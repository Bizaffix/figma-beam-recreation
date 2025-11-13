# Stripe Payment Integration Setup

This guide will help you set up Stripe payment processing for the quilting retreats application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard
3. Supabase project with Edge Functions enabled (or a backend API)

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

## Step 2: Set Environment Variables

Add your Stripe publishable key to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

For production, add this to your Vercel environment variables:
- Go to your Vercel project settings
- Navigate to **Environment Variables**
- Add `VITE_STRIPE_PUBLISHABLE_KEY` with your production publishable key

## Step 3: Set Up Backend Payment Processing

You have two options for processing payments:

### Option A: Supabase Edge Functions (Recommended)

1. **Create the Edge Function for Payment Intent:**

   Create a new Edge Function in your Supabase project:
   - Go to **Edge Functions** in your Supabase dashboard
   - Create a new function named `create-payment-intent`
   - Add your Stripe secret key as a secret: `STRIPE_SECRET_KEY`

   Example Edge Function code (`supabase/functions/create-payment-intent/index.ts`):

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

   const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
     apiVersion: "2023-10-16",
   })

   serve(async (req) => {
     try {
       const { retreatId, amount, bookingDetails } = await req.json()

       const paymentIntent = await stripe.paymentIntents.create({
         amount: amount, // Amount in cents
         currency: "usd",
         metadata: {
           retreatId: retreatId.toString(),
           fullName: bookingDetails.fullName,
           email: bookingDetails.email,
           skillLevel: bookingDetails.skillLevel,
         },
       })

       return new Response(
         JSON.stringify({ clientSecret: paymentIntent.client_secret }),
         {
           headers: { "Content-Type": "application/json" },
           status: 200,
         }
       )
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         {
           headers: { "Content-Type": "application/json" },
           status: 400,
         }
       )
     }
   })
   ```

2. **Create the Edge Function for Payment Confirmation:**

   Create another Edge Function named `confirm-payment`:

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

   serve(async (req) => {
     try {
       const { paymentIntentId, retreatId, bookingDetails } = await req.json()

       // Verify payment with Stripe
       const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "")
       const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

       if (paymentIntent.status !== "succeeded") {
         throw new Error("Payment not completed")
       }

       // Create booking in database
       const supabase = createClient(
         Deno.env.get("SUPABASE_URL") ?? "",
         Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
       )

       const { data: booking, error } = await supabase
         .from("bookings")
         .insert({
           retreat_id: retreatId,
           user_id: paymentIntent.metadata.userId,
           payment_intent_id: paymentIntentId,
           full_name: bookingDetails.fullName,
           email: bookingDetails.email,
           skill_level: bookingDetails.skillLevel,
           amount: paymentIntent.amount / 100, // Convert from cents
           status: "confirmed",
         })
         .select()
         .single()

       if (error) throw error

       // Update retreat spots available
       await supabase.rpc("decrement_spots", { retreat_id: retreatId })

       return new Response(
         JSON.stringify({ bookingId: booking.id, success: true }),
         {
           headers: { "Content-Type": "application/json" },
           status: 200,
         }
       )
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         {
           headers: { "Content-Type": "application/json" },
           status: 400,
         }
       )
     }
   })
   ```

### Option B: Backend API

If you prefer to use your own backend API, update the functions in `src/lib/stripe-payment.ts` to call your API endpoints instead of Supabase Edge Functions.

## Step 4: Create Database Tables

Create a `bookings` table in your Supabase database:

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id INTEGER NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_intent_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_retreat_id ON bookings(retreat_id);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Create a function to decrement spots:

```sql
CREATE OR REPLACE FUNCTION decrement_spots(retreat_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET spots_available = GREATEST(0, spots_available - 1)
  WHERE id = retreat_id;
END;
$$ LANGUAGE plpgsql;
```

## Step 5: Test the Integration

1. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVV

2. Test the payment flow:
   - Select a retreat
   - Fill in booking details
   - Enter test card information
   - Complete payment

3. Check your Stripe Dashboard:
   - Go to **Payments** to see test payments
   - Verify payment intents are created correctly

## Step 6: Go Live

When ready for production:

1. Switch to live mode in Stripe Dashboard
2. Get your live API keys
3. Update environment variables with live keys
4. Deploy your Edge Functions or backend API
5. Test with a real card (use a small amount first)

## Security Notes

- **Never** expose your Stripe secret key in the frontend
- Always use HTTPS in production
- Validate all payment data on the backend
- Use webhooks to handle payment status updates
- Implement proper error handling and logging

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)


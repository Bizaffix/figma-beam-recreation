# Edge Function Code Fixes

## ⚠️ CRITICAL: CORS Fix Required

**If you're getting CORS errors, you MUST add OPTIONS request handling!**

See `EDGE_FUNCTION_CORS_FIX.md` for the complete fix.

## Important: Update Your Edge Functions

Make sure your Edge Functions include the following fixes:

### 1. `create-payment-intent` Function

**Make sure it includes the `amount` parameter:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests - THIS IS CRITICAL!
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { retreatId, amount, bookingDetails } = await req.json()

    // IMPORTANT: amount is already in cents from the frontend
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
```

### 2. `confirm-payment` Function

**Make sure it includes userId and proper error handling:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests - THIS IS CRITICAL!
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { paymentIntentId, retreatId, bookingDetails, userId } = await req.json()

    // Verify payment with Stripe
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
        user_id: userId, // IMPORTANT: Use userId from request
        payment_intent_id: paymentIntentId,
        full_name: bookingDetails.fullName,
        email: bookingDetails.email,
        skill_level: bookingDetails.skillLevel,
        amount: paymentIntent.amount / 100, // Convert from cents
        status: "confirmed",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    // Update retreat spots available
    const { error: updateError } = await supabase.rpc("decrement_spots", {
      retreat_id: retreatId,
    })

    if (updateError) {
      console.error("Error decrementing spots:", updateError)
      // Don't throw - booking is already created
    }

    return new Response(
      JSON.stringify({ bookingId: booking.id, success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in confirm-payment:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
```

## Key Points to Check

1. ✅ **CORS Headers**: Both functions should include CORS headers
2. ✅ **Error Handling**: Proper try-catch blocks
3. ✅ **userId**: `confirm-payment` should use `userId` from request body
4. ✅ **Amount**: `create-payment-intent` should use amount directly (already in cents)
5. ✅ **Service Role Key**: `confirm-payment` needs `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

## Verify Secrets in Supabase

Make sure these secrets are set in your Supabase Edge Functions:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_URL` - Your Supabase project URL (usually auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for `confirm-payment`)

To set secrets:
1. Go to Supabase Dashboard → Edge Functions
2. Click on the function
3. Go to Settings → Secrets
4. Add the required secrets


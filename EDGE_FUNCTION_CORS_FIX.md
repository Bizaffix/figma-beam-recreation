# Fix CORS Error in Edge Functions

## The Problem

The CORS error occurs because your Edge Function doesn't handle the OPTIONS preflight request that browsers send before making the actual POST request.

## Solution: Update Your Edge Functions

### 1. Update `create-payment-intent` Function

Replace your current function with this code that properly handles CORS:

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { retreatId, amount, bookingDetails } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents from frontend
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

### 2. Update `confirm-payment` Function

Replace your current function with this code:

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
  // Handle CORS preflight requests
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
        user_id: userId,
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

## Key Changes

1. **Added CORS headers constant** - Reusable headers for all responses
2. **Handle OPTIONS requests** - Return 200 OK for preflight requests
3. **Include CORS headers in all responses** - Both success and error responses

## How to Update

1. Go to Supabase Dashboard → Edge Functions
2. Click on `create-payment-intent`
3. Replace the code with the updated version above
4. Click "Deploy" or "Save"
5. Repeat for `confirm-payment`

## After Updating

1. Wait a few seconds for the function to redeploy
2. Refresh your browser
3. Try the payment flow again
4. The CORS error should be resolved

## Alternative: If Still Having Issues

If you're still getting CORS errors after updating:

1. **Check function logs** in Supabase Dashboard
2. **Verify the function is deployed** - Check the deployment status
3. **Clear browser cache** - Sometimes cached responses cause issues
4. **Check network tab** - See if OPTIONS request returns 200

## Testing the Fix

After updating, test by:

1. Opening browser DevTools (F12)
2. Going to Network tab
3. Trying to make a payment
4. Check that:
   - OPTIONS request returns 200 OK
   - POST request succeeds
   - No CORS errors in console


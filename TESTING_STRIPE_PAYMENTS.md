# Testing Stripe Payment Integration

## Prerequisites Checklist

Before testing, ensure you have:

- [x] Created Supabase Edge Functions (`create-payment-intent` and `confirm-payment`)
- [x] Added `STRIPE_SECRET_KEY` as a secret in Supabase Edge Functions
- [x] Added `VITE_STRIPE_PUBLISHABLE_KEY` to your `.env` file
- [x] Created `bookings` table in Supabase database
- [x] Created `decrement_spots` function in Supabase database
- [x] Set up RLS policies for the `bookings` table

## Step-by-Step Testing Guide

### 1. Verify Environment Setup

**Check your `.env` file:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Restart your dev server** after adding environment variables:
```bash
npm run dev
```

### 2. Verify Edge Functions Setup

**In Supabase Dashboard:**
1. Go to **Edge Functions**
2. Verify both functions exist:
   - `create-payment-intent`
   - `confirm-payment`
3. Check that `STRIPE_SECRET_KEY` is set as a secret for both functions

### 3. Test the Complete Payment Flow

#### Step 1: Login as a Student
- Go to `/login`
- Sign in with a student account (or create one)
- You should be redirected to `/home` or `/`

#### Step 2: Browse and Select a Retreat
- Navigate to the retreats list
- Click on any published retreat
- Click "Book This Retreat"

#### Step 3: Fill Booking Details
- **Full Name**: Enter any name (e.g., "John Doe")
- **Email**: Enter any email (e.g., "john@example.com")
- **Skill Level**: Enter any level (e.g., "Beginner")
- Click "Continue to Payment"

#### Step 4: Test Payment with Stripe Test Cards

**Use these test card numbers:**

| Card Number | Scenario | Expiry | CVV |
|------------|----------|--------|-----|
| `4242 4242 4242 4242` | ✅ Success | Any future date (e.g., 12/34) | Any 3 digits (e.g., 123) |
| `4000 0000 0000 0002` | ❌ Card Declined | Any future date | Any 3 digits |
| `4000 0000 0000 9995` | ❌ Insufficient Funds | Any future date | Any 3 digits |
| `4000 0025 0000 3155` | ⚠️ Requires Authentication | Any future date | Any 3 digits |

**Recommended Test Card:**
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: `12/34` (or any future date)
- **CVV**: `123` (or any 3 digits)
- **ZIP Code**: Any 5 digits (if prompted)

#### Step 5: Complete Payment
1. Enter the test card details in the Stripe Card Element
2. Click "Confirm & Pay"
3. Wait for processing (you should see "Processing..." on the button)
4. You should be redirected to the confirmation page on success

### 4. Verify Payment in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. Navigate to **Payments** (test mode)
3. You should see the payment with:
   - Status: "Succeeded"
   - Amount: The retreat price
   - Metadata: Retreat ID, booking details

### 5. Verify Booking in Database

**In Supabase Dashboard:**
1. Go to **Table Editor** → `bookings`
2. You should see a new booking record with:
   - `retreat_id`: The retreat ID
   - `user_id`: Your user ID
   - `payment_intent_id`: The Stripe payment intent ID
   - `status`: "confirmed"
   - `amount`: The retreat price

**Verify spots were decremented:**
1. Go to **Table Editor** → `retreats`
2. Check the retreat you booked
3. `spots_available` should be decreased by 1

### 6. Test Error Scenarios

#### Test 1: Declined Card
- Use card: `4000 0000 0000 0002`
- You should see an error message
- Payment should not be processed
- No booking should be created

#### Test 2: Missing Booking Details
- Try to go directly to `/retreat/:id/payment` without booking details
- You should see an error message
- Payment intent should not be created

#### Test 3: Network Error
- Disconnect internet
- Try to process payment
- You should see an error message

## Troubleshooting

### Issue: "Payment system is not ready"
**Solution:**
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Restart your dev server
- Check browser console for errors

### Issue: "Failed to create payment intent"
**Solution:**
- Check Supabase Edge Functions logs
- Verify `STRIPE_SECRET_KEY` is set as a secret
- Check that the Edge Function is deployed
- Verify the function name matches exactly: `create-payment-intent`

### Issue: "Payment succeeded but booking creation failed"
**Solution:**
- Check that `bookings` table exists
- Verify RLS policies allow inserts
- Check Edge Function logs for `confirm-payment`
- Verify `decrement_spots` function exists

### Issue: Card Element not showing
**Solution:**
- Check browser console for Stripe errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is correct
- Check that Stripe Elements is properly initialized
- Try clearing browser cache

### Issue: "CORS error" or "Function not found"
**Solution:**
- Verify Edge Functions are deployed
- Check Supabase project URL is correct
- Verify function names match exactly
- Check Supabase Edge Functions are enabled

## Debugging Tips

### 1. Check Browser Console
Open DevTools (F12) and check:
- Network tab for API calls
- Console for errors
- Application tab for environment variables

### 2. Check Supabase Edge Functions Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on the function name
3. View logs to see errors

### 3. Test Edge Functions Directly

**Test `create-payment-intent`:**
```bash
curl -X POST https://gxyhzeihzxjqaqrdhsnr.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "retreatId": 1,
    "amount": 10000,
    "bookingDetails": {
      "fullName": "Test User",
      "email": "test@example.com",
      "skillLevel": "Beginner"
    }
  }'
```

**Expected Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

## Expected Flow

1. ✅ User selects retreat → `/retreat/:id`
2. ✅ User clicks "Book This Retreat" → `/retreat/:id/book`
3. ✅ User fills booking form → submits → `/retreat/:id/payment`
4. ✅ Payment page loads → Creates payment intent via Edge Function
5. ✅ User enters card details → Clicks "Confirm & Pay"
6. ✅ Stripe processes payment → Returns payment intent
7. ✅ Confirm payment Edge Function creates booking
8. ✅ User redirected to `/retreat/:id/confirmed`

## Success Indicators

- ✅ Payment intent created successfully
- ✅ Card details accepted by Stripe
- ✅ Payment status: "succeeded" in Stripe Dashboard
- ✅ Booking record created in database
- ✅ Retreat spots decreased by 1
- ✅ User redirected to confirmation page
- ✅ No errors in console or Edge Function logs

## Next Steps After Testing

Once testing is successful:
1. Test with different card scenarios
2. Test with different retreat prices
3. Test error handling
4. Set up Stripe webhooks for production
5. Switch to live mode when ready

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Edge Function logs in Supabase
3. Check Stripe Dashboard for payment attempts
4. Verify all environment variables are set correctly
5. Ensure database tables and functions are created


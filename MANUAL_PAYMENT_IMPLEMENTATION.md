# Manual Payment Feature Implementation

## Overview
This feature allows users to register for retreats by indicating they've paid manually via check, Venmo, or other methods, bypassing the Stripe payment flow.

## Changes Made

### 1. Booking.tsx (`src/pages/Booking.tsx`)
- ✅ Added `Checkbox` component import
- ✅ Added `useToast` hook import
- ✅ Added state for `paidManually` checkbox
- ✅ Added `processingManualPayment` state
- ✅ Created `handleManualPayment()` function that:
  - Creates a booking directly in the database with `payment_status: 'paid_manual'`
  - Generates a unique `payment_intent_id` for manual payments (format: `manual_{timestamp}_{random}`)
  - Sets `status: 'confirmed'` for database consistency
  - Decrements retreat spots available
  - Navigates to confirmation page
- ✅ Updated `handleContinue()` to check if manual payment is selected and call `handleManualPayment()` instead of navigating to payment page
- ✅ Added checkbox UI at the end of registration form with label: "I've paid manually via check, Venmo or other method"
- ✅ Updated button text to show "Complete Registration" when manual payment is selected

### 2. UserManagement.tsx (`src/components/UserManagement.tsx`)
- ✅ Updated `Booking` interface to include `"paid_manual"` in `payment_status` type
- ✅ Updated statistics calculation to include `paid_manual` in fully paid count and revenue
- ✅ Updated `getPaymentStatusBadge()` to display "Paid Manual" badge (purple) for manual payments
- ✅ Updated `getPaymentStatusBadge()` to display "Paid" (instead of "Fully Paid") for Stripe payments
- ✅ Updated `getPaymentStatusIcon()` to show purple checkmark for manual payments
- ✅ Updated refund button visibility to show for both `fully_paid` and `paid_manual` statuses

### 3. Database Migration (`MANUAL_PAYMENT_MIGRATION.sql`)
- ✅ Created SQL migration script that:
  - Adds `payment_status` column if it doesn't exist
  - Migrates existing data (sets `fully_paid` for confirmed bookings with Stripe payment intents)
  - Makes `payment_intent_id` nullable (though we still generate unique IDs for manual payments)
  - Adds `full_amount`, `deposit_amount`, `price_variant`, `add_ons`, and `booking_date` columns if missing

## Database Schema Updates Required

**⚠️ IMPORTANT: Run the SQL migration before using this feature!**

Execute `MANUAL_PAYMENT_MIGRATION.sql` in your Supabase SQL Editor to:
1. Add the `payment_status` column to the `bookings` table
2. Ensure all required columns exist
3. Migrate existing booking data

## Payment Status Values

The system now supports the following payment statuses:
- `deposit_paid` - Deposit has been paid
- `fully_paid` - Full payment via Stripe (displays as "Paid")
- `paid_manual` - Manual payment via check/Venmo/etc. (displays as "Paid Manual")
- `refunded` - Payment has been refunded
- `cancelled` - Booking has been cancelled

## User Flow

### Manual Payment Flow:
1. User fills out registration form
2. User checks "I've paid manually via check, Venmo or other method"
3. User clicks "Complete Registration"
4. Booking is created immediately with `payment_status: 'paid_manual'`
5. User is redirected to confirmation page
6. Instructor sees "Paid Manual" status in User Management

### Stripe Payment Flow (unchanged):
1. User fills out registration form
2. User clicks "Continue to Payment"
3. User completes Stripe payment
4. Booking is created with `payment_status: 'fully_paid'`
5. User is redirected to confirmation page
6. Instructor sees "Paid" status in User Management

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Test manual payment registration flow
- [ ] Verify booking appears in User Management with "Paid Manual" status
- [ ] Test Stripe payment flow still works correctly
- [ ] Verify "Paid" status displays for Stripe payments
- [ ] Test refund functionality works for both payment types
- [ ] Verify statistics count manual payments correctly

## Notes

- Manual payments generate unique `payment_intent_id` values to maintain database constraints
- Both manual and Stripe payments decrement retreat spots available
- Manual payments are included in revenue calculations
- The checkbox is optional - users can still use Stripe if they don't check it


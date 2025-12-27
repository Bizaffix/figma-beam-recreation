# Simplified Manual Payment Workflow

## Overview
The manual payment workflow has been simplified to remove the rejection step. Organizers now only approve registrations after receiving payment, and pending approvals are automatically cancelled after 48 hours.

## Workflow

### 1. User Submits Manual Payment
- User checks "I've paid manually via check, Venmo or other method"
- Booking is created with:
  - `payment_status: 'paid_manual'`
  - `manual_payment_status: 'pending_approval'`
  - `booking_date: [current timestamp]`
- **Email is sent immediately** informing user:
  - They must submit payment to organizer within 48 hours
  - Registration will be cancelled if payment not received
  - Contact organizer directly to arrange payment
- User sees confirmation page with 48-hour warning

### 2. Organizer Waits for Payment (48 Hours)
- Organizer sees "Pending Approval" status with countdown timer
- Only **Approve** button is shown (no reject option)
- Organizer waits to receive payment from user
- If payment received → Organizer clicks "Approve Payment"
- If 48 hours pass without approval → Auto-cancelled

### 3. Organizer Approves (After Receiving Payment)
- Organizer clicks "Approve Payment" button
- Booking status updated to:
  - `manual_payment_status: 'approved'`
  - `payment_status: 'paid_manual'` (remains)
- User receives confirmation (booking is confirmed)

### 4. Auto-Cancellation (After 48 Hours)
- System checks every 5 minutes for pending approvals older than 48 hours
- Bookings with `manual_payment_status: 'pending_approval'` and `booking_date` > 48 hours ago are:
  - Set to `payment_status: 'cancelled'`
  - Set to `status: 'cancelled'`
  - `manual_payment_status` set to NULL
  - Retreat spot restored
- **Email is sent** to user:
  - Notification that registration was cancelled
  - Reason: Payment not submitted within 48 hours
  - Spot has been released

## Key Changes from Previous Implementation

### Removed:
- ❌ Reject button/functionality
- ❌ Rejection workflow
- ❌ 48-hour countdown after rejection
- ❌ `rejected` status from `manual_payment_status`
- ❌ `payment_rejection_date` usage (kept for backward compatibility)

### Simplified:
- ✅ Only one action: **Approve** (after receiving payment)
- ✅ 48-hour deadline applies to pending approvals (from booking creation)
- ✅ Auto-cancellation based on booking creation date
- ✅ Clearer email messaging

## Email Notifications

### 1. Initial Registration Email
**Sent:** Immediately when manual payment is submitted
**Subject:** `Registration Submitted: [Retreat Title]`
**Key Message:** "You must submit your payment to the organizer within 48 hours, or your registration will be automatically cancelled."

### 2. Cancellation Email
**Sent:** When booking is auto-cancelled after 48 hours
**Subject:** `Registration Cancelled: [Retreat Title]`
**Key Message:** "Your registration has been automatically cancelled because payment was not submitted to the organizer within the 48-hour deadline."

## Database Changes

### Updated Function
- `cancel_expired_rejections()` → `cancel_expired_pending_approvals()`
- Now checks for `pending_approval` status (not `rejected`)
- Uses `booking_date` or `created_at` to determine age

### Updated Constraint
- `manual_payment_status` CHECK constraint now only allows: `'pending_approval'`, `'approved'`
- Removed `'rejected'` from allowed values

## User Interface Changes

### Organizer View (UserManagement):
- **Pending Approval** bookings show only "Approve Payment" button
- Status badge shows "Pending Approval" with countdown timer
- No reject option

### Student View:
- Confirmation page shows clear 48-hour warning
- Email sent immediately with deadline information
- No rejection emails (workflow simplified)

## Testing Checklist

- [ ] Manual payment booking creates with `pending_approval` status
- [ ] Initial email is sent with 48-hour deadline message
- [ ] Confirmation page shows 48-hour warning
- [ ] Organizer sees only "Approve Payment" button
- [ ] Approve button works correctly
- [ ] Auto-cancellation works after 48 hours
- [ ] Cancellation email is sent
- [ ] Spots are restored when cancelled
- [ ] Countdown timer displays correctly
- [ ] Statistics count correctly

## Migration Notes

If you've already run the previous migration with `rejected` status:
1. The constraint will need to be updated (run `FIX_PAYMENT_STATUS_CONSTRAINT.sql` if needed)
2. Update the database function name: `cancel_expired_rejections` → `cancel_expired_pending_approvals`
3. Any existing `rejected` bookings should be manually reviewed


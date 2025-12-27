# Manual Payment Workflow with Rejection

## Overview
The manual payment workflow allows organizers to approve or reject manual payment claims within 48 hours of booking. After 48 hours, pending approvals are auto-cancelled. Rejected payments give users 48 hours from rejection to complete payment online.

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

### 2. Organizer Actions (Within 48 Hours of Booking)
Organizer can take one of two actions:

#### Option A: Approve Payment
- Organizer receives payment from user
- Organizer clicks **"Approve Payment"** button
- Booking status updated to:
  - `manual_payment_status: 'approved'`
  - `payment_status: 'paid_manual'` (remains)
- User receives confirmation (booking is confirmed)

#### Option B: Reject Payment (Only Available Within 48 Hours)
- Organizer clicks **"Reject"** button (only visible if booking is within 48 hours)
- Booking is **immediately cancelled** (same as auto-cancellation):
  - `payment_status: 'cancelled'`
  - `status: 'cancelled'`
  - `manual_payment_status: null`
- Retreat spot is **immediately restored**
- **Cancellation email is sent** to user:
  - Notification that registration was cancelled
  - Reason: Manual payment claim was rejected by organizer
  - Spot has been released
- **No 48-hour wait period** - cancellation is immediate

### 3. Auto-Cancellation Scenarios

#### Scenario A: Pending Approval Expires (48 Hours from Booking)
- If booking remains `pending_approval` for 48 hours from booking date
- System automatically:
  - Sets `payment_status: 'cancelled'`
  - Sets `status: 'cancelled'`
  - Clears `manual_payment_status`
  - Restores retreat spot
- **Email is sent** to user about cancellation

#### Scenario B: Manual Rejection (Immediate Cancellation)
- When organizer rejects a manual payment claim
- Booking is **immediately cancelled** (no waiting period):
  - Sets `payment_status: 'cancelled'`
  - Sets `status: 'cancelled'`
  - Clears `manual_payment_status`
  - Restores retreat spot immediately
- **Cancellation email is sent** to user immediately

## Key Features

### Reject Button Visibility
- **Reject button only shows** if booking is within 48 hours of creation
- After 48 hours, only "Approve" button is visible (or booking is auto-cancelled)
- Prevents rejection of bookings that are about to auto-cancel

### Status Badges
- **Pending Approval**: Yellow badge with countdown timer (hours remaining)
- **Cancelled**: Gray badge (for rejected or expired bookings)
- **Paid Manual**: Purple badge (approved manual payments)

### Auto-Cancellation Logic
- Checks every 5 minutes for expired bookings
- Handles:
  - Pending approvals older than 48 hours (from `booking_date`)
- Manual rejections are handled immediately (no auto-cancellation needed)

## Email Notifications

### 1. Initial Registration Email
**Sent:** Immediately when manual payment is submitted
**Subject:** `Registration Submitted: [Retreat Title]`
**Key Message:** "You must submit your payment to the organizer within 48 hours, or your registration will be automatically cancelled."

### 2. Cancellation Email (Manual Rejection)
**Sent:** Immediately when organizer rejects payment claim
**Subject:** `Registration Cancelled: [Retreat Title]`
**Key Message:** "Your registration has been cancelled because your manual payment claim was rejected by the organizer. Your spot has been released."

### 3. Cancellation Email
**Sent:** When booking is auto-cancelled
**Subject:** `Registration Cancelled: [Retreat Title]`
**Key Message:** "Your registration has been automatically cancelled because payment was not completed within the 48-hour deadline."

## Database Schema

### Columns
- `manual_payment_status`: `'pending_approval' | 'approved'` (rejected bookings are immediately cancelled)
- `booking_date`: Timestamp when booking was created

### Function
- `cancel_expired_pending_approvals()`: Handles auto-cancellation of both pending and rejected bookings

## User Interface

### Organizer View (UserManagement):
- **Pending Approval** bookings show:
  - "Approve" button (always visible)
  - "Reject" button (only if booking is within 48 hours)
  - Status badge with countdown timer
- **Rejected** bookings are immediately cancelled:
  - Status changes to "Cancelled"
  - Spot is restored immediately
  - No action buttons needed

### Student View:
- Confirmation page shows clear 48-hour warning
- Email sent immediately with deadline information
- Rejection email includes payment link

## Testing Checklist

- [ ] Manual payment booking creates with `pending_approval` status
- [ ] Initial email is sent with 48-hour deadline message
- [ ] Confirmation page shows 48-hour warning
- [ ] Organizer sees "Approve" and "Reject" buttons (within 48 hours)
- [ ] Reject button disappears after 48 hours
- [ ] Reject button prevents rejection if booking is older than 48 hours
- [ ] Rejection immediately cancels booking (no 48-hour wait)
- [ ] Spot is restored immediately when rejected
- [ ] Cancellation email is sent immediately when rejected
- [ ] Approve button works correctly
- [ ] Auto-cancellation works for pending approvals after 48 hours
- [ ] Cancellation emails are sent for both manual rejection and auto-cancellation
- [ ] Spots are restored when cancelled
- [ ] Countdown timers display correctly for pending approvals

## Migration Notes

The `MANUAL_PAYMENT_APPROVAL_MIGRATION.sql` file has been updated to:
1. Only include `'pending_approval'` and `'approved'` in the `manual_payment_status` CHECK constraint (rejected bookings are immediately cancelled)
2. Update `cancel_expired_pending_approvals()` function to only handle pending approvals
3. Removed `payment_rejection_date` index (no longer needed)


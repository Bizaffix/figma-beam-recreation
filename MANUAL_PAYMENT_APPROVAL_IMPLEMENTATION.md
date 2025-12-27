# Manual Payment Approval Feature Implementation

## Overview
This feature allows organizers (instructors) to approve or reject manual payment claims. If rejected, students receive a notification with a 48-hour deadline to complete payment, after which their spot is automatically cancelled.

## Changes Made

### 1. UserManagement.tsx (`src/components/UserManagement.tsx`)
- ✅ Updated `Booking` interface to include:
  - `manual_payment_status`: "pending_approval" | "approved" | "rejected"
  - `payment_rejection_date`: timestamp when payment was rejected
- ✅ Added `processingApproval` state for button loading states
- ✅ Updated statistics to only count approved manual payments
- ✅ Added `pendingApproval` count to statistics
- ✅ Created `approveManualPayment()` function:
  - Updates booking to `approved` status
  - Confirms the manual payment
- ✅ Created `rejectManualPayment()` function:
  - Updates booking to `rejected` status
  - Sets `payment_rejection_date`
  - Sends notification to student with 48-hour deadline
- ✅ Created `checkExpiredRejections()` function:
  - Checks for bookings rejected more than 48 hours ago
  - Automatically cancels expired rejections
  - Restores retreat spots
  - Sends cancellation notification
  - Runs on component mount and every 5 minutes
- ✅ Updated `getPaymentStatusBadge()` to show:
  - "Pending Approval" (yellow) for pending manual payments
  - "Payment Rejected" (orange) with hours remaining countdown
  - "Paid Manual" (purple) for approved manual payments
- ✅ Updated `getPaymentStatusIcon()` to show appropriate icons for each status
- ✅ Added Approve/Reject buttons in desktop table view
- ✅ Added Approve/Reject buttons in mobile card view
- ✅ Buttons only show for bookings with `payment_status: 'paid_manual'` and `manual_payment_status: 'pending_approval'`

### 2. Booking.tsx (`src/pages/Booking.tsx`)
- ✅ Updated manual payment booking creation to set `manual_payment_status: 'pending_approval'`
- ✅ Updated success message to indicate registration is "pending organizer approval"

### 3. Database Migration (`MANUAL_PAYMENT_APPROVAL_MIGRATION.sql`)
- ✅ Adds `manual_payment_status` column with CHECK constraint
- ✅ Adds `payment_rejection_date` column
- ✅ Creates `increment_spots()` function to restore spots when bookings are cancelled
- ✅ Creates `cancel_expired_rejections()` function for automated cleanup
- ✅ Creates indexes for performance
- ✅ Grandfathers existing manual payments as 'approved'

## Database Schema Updates Required

**⚠️ IMPORTANT: Run the SQL migration before using this feature!**

Execute `MANUAL_PAYMENT_APPROVAL_MIGRATION.sql` in your Supabase SQL Editor to:
1. Add the `manual_payment_status` column
2. Add the `payment_rejection_date` column
3. Create helper functions
4. Set up indexes

## Payment Status Flow

### Manual Payment Lifecycle:
1. **User submits manual payment** → `payment_status: 'paid_manual'`, `manual_payment_status: 'pending_approval'`
2. **Organizer approves** → `manual_payment_status: 'approved'` (booking confirmed)
3. **Organizer rejects** → `manual_payment_status: 'rejected'`, `payment_rejection_date: [timestamp]`
4. **48 hours pass** → Booking automatically cancelled, spot restored

### Status Display:
- **Pending Approval**: Yellow badge, clock icon
- **Approved**: Purple "Paid Manual" badge, checkmark icon
- **Rejected**: Orange badge with countdown, warning icon
- **Cancelled**: Gray badge (after 48 hours)

## Notification System

When a manual payment is rejected:
- Notification is sent via `messages` table
- Message includes:
  - Rejection notice
  - 48-hour deadline warning
  - Link to payment page
- Message type: `payment_rejection`

When booking is auto-cancelled:
- Notification is sent via `messages` table
- Message includes cancellation notice
- Message type: `booking_cancelled`

## Automated Cleanup

The system automatically checks for expired rejections:
- On component mount (when UserManagement loads)
- Every 5 minutes while component is mounted
- Can also be triggered via database function `cancel_expired_rejections()`

**Optional: Set up Supabase Cron Job**
- Schedule: Every hour
- Command: `SELECT cancel_expired_rejections();`
- This ensures expired bookings are cancelled even if no one is viewing the dashboard

## User Interface

### Organizer View (UserManagement):
- **Pending Approval** bookings show Approve/Reject buttons
- Status badge shows "Pending Approval" in yellow
- Rejected bookings show countdown timer
- Statistics include pending approval count

### Student View:
- After submitting manual payment, sees "Registration Submitted" message
- Receives notification if payment is rejected
- Receives notification if booking is cancelled

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Test manual payment submission (should be pending approval)
- [ ] Test approve functionality
- [ ] Test reject functionality
- [ ] Verify rejection notification is sent
- [ ] Verify countdown timer displays correctly
- [ ] Test auto-cancellation after 48 hours (or manually set rejection date to test)
- [ ] Verify spots are restored when booking is cancelled
- [ ] Verify statistics count correctly
- [ ] Test on both desktop and mobile views

## Notes

- Manual payments require organizer approval before being confirmed
- Rejected payments have a 48-hour grace period
- Expired rejections are automatically cancelled and spots are restored
- The system checks for expired rejections every 5 minutes while the dashboard is open
- Consider setting up a cron job for automated cleanup outside of dashboard usage


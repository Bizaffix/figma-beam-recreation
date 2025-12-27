# Manual Payment Email Notifications

## Overview
This document describes the email notification system for manual payment bookings, including the 48-hour deadline warnings and cancellation/rejection notifications.

## Email Notifications Flow

### 1. Initial Registration Email (When Manual Payment is Submitted)
**Trigger**: User submits manual payment registration
**Recipient**: Student
**Subject**: `Registration Submitted: [Retreat Title]`
**Content**:
- Confirmation of registration submission
- Notice that payment claim is pending organizer approval
- **48-hour warning**: If payment claim is rejected, they have 48 hours to complete payment
- Retreat details (title, date, location, amount)
- Instructions on what happens next

**Implementation**: `src/pages/Booking.tsx` - `handleManualPayment()`

### 2. Payment Rejection Email
**Trigger**: Organizer rejects manual payment claim
**Recipient**: Student
**Subject**: `Payment Required: [Retreat Title]`
**Content**:
- Notification that payment claim was rejected
- **48-hour deadline warning**: Must complete payment within 48 hours or registration will be cancelled
- Direct link to payment page
- Contact information

**Implementation**: `src/components/UserManagement.tsx` - `rejectManualPayment()`

### 3. Registration Cancellation Email
**Trigger**: 48 hours pass after payment rejection without payment completion
**Recipient**: Student
**Subject**: `Registration Cancelled: [Retreat Title]`
**Content**:
- Notification that registration was automatically cancelled
- Reason: Payment not completed within 48-hour deadline
- Notice that spot has been released
- Instructions to re-register if desired

**Implementation**: `src/components/UserManagement.tsx` - `checkExpiredRejections()`

## Confirmation Page Warning

The confirmation page (`src/pages/Confirmation.tsx`) displays a prominent warning for manual payments:

- **Alert Box**: Orange/yellow alert with warning icon
- **Title**: "Payment Required Within 48 Hours"
- **Message**: 
  - Explains that registration is pending organizer approval
  - States that payment must be completed within 48 hours if claim is rejected
  - Provides "Complete Payment Now" button for immediate action
- **Visibility**: Only shown when `paymentMethod === 'manual'`

## Technical Implementation

### Email Sending
All emails are sent using the `sendCustomEmail()` function from `src/lib/email-notifications.ts`, which:
- Calls Supabase Edge Function `send-custom-email`
- Uses Resend API for email delivery
- Handles errors gracefully (doesn't block user flow)

### Message Storage
In addition to emails, notifications are also stored in the `messages` table for:
- In-app notification display
- Message history
- Backup if email fails

### Timing
- **Initial Email**: Sent immediately when manual payment is submitted
- **Rejection Email**: Sent immediately when organizer rejects payment
- **Cancellation Email**: Sent when auto-cancellation occurs (after 48 hours)

## User Experience

### Student Journey:
1. **Submit Manual Payment** → Receives initial email + sees warning on confirmation page
2. **If Approved** → Receives confirmation (no additional action needed)
3. **If Rejected** → Receives rejection email with 48-hour deadline
4. **If Payment Not Completed** → Receives cancellation email after 48 hours

### Key Messages:
- Clear 48-hour deadline communication at every step
- Direct links to payment page when action is required
- Professional, helpful tone
- All critical information included (retreat details, deadlines, next steps)

## Testing Checklist

- [ ] Initial registration email is sent when manual payment is submitted
- [ ] Confirmation page shows 48-hour warning for manual payments
- [ ] Rejection email is sent when organizer rejects payment
- [ ] Rejection email includes 48-hour deadline and payment link
- [ ] Cancellation email is sent after 48 hours
- [ ] All emails include correct retreat details
- [ ] Payment links work correctly
- [ ] Messages are also saved to messages table


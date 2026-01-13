# Venue Manager Affiliate Program Implementation

## Overview

This document explains the affiliate program implementation for venue managers, clarifying how the system works and what features have been added.

## How the Affiliate System Works

### Current Understanding vs. Reality

**Your Understanding:**
- Venue managers get a link to share with organizers
- Organizers get a 30% discount for 30 days
- Discount applies to platform fees

**Actual Implementation:**
- ✅ Venue managers automatically get an affiliate link when they register
- ✅ Organizers referred by venue managers get their **first event 100% FREE** (no platform fee)
- ✅ Venue managers earn revenue share (commission) based on campaign rules
- ✅ The system tracks all referred users and their conversions

### Key Features Implemented

#### 1. Auto-Creation of Affiliate Records
- **File:** `VENUE_MANAGER_AFFILIATE_AUTO_SETUP.sql`
- When a venue manager (location_owner) registers, the system automatically:
  - Creates an affiliate record with type `venue_partner`
  - Auto-approves the affiliate (status: `approved`)
  - Generates an affiliate link for the "Organizer Referral Program" campaign
  - Links are in format: `https://bookmyquiltretreat.com?ref=ref_XXXXXXXX`

#### 2. First Event Free for Referred Organizers
- **Files Modified:**
  - `src/pages/InstructorRetreatForm.tsx`
  - `src/pages/InstructorDashboard.tsx`
- When an organizer signs up via a venue manager's affiliate link:
  - The system checks if they were referred by a venue manager
  - On their **first published event**, the platform fee is **100% waived** (0% instead of 12.4%)
  - This only applies to the first event - subsequent events use normal platform fees
  - The discount is clearly displayed in the event creation form

#### 3. Venue Dashboard Affiliate Section
- **File:** `src/pages/LocationOwnerDashboard.tsx`
- Added comprehensive affiliate section showing:
  - **Your Affiliate Link**: Copyable link with click count
  - **Referred Users List**: 
    - User name and email
    - Account type (Organizer/Student/Venue)
    - Sign-up date
    - Conversion status (if they've completed an action)
    - Revenue share rate (from campaign settings)
    - Total commissions earned from each user

#### 4. Revenue Share Display
- Shows commission rate for each referred user based on campaign settings
- Displays total commissions earned per user
- Commission rates are pulled from the affiliate campaign configuration

## Database Changes

### SQL Migration Required
Run `VENUE_MANAGER_AFFILIATE_AUTO_SETUP.sql` in Supabase SQL Editor to:
1. Create trigger function to auto-create affiliate records
2. Set up triggers on `profiles` and `auth.users` tables
3. Backfill existing venue managers with affiliate records and links

## How It Works - Step by Step

### For Venue Managers:

1. **Registration**: When a venue manager signs up, they automatically get:
   - An affiliate account (type: `venue_partner`)
   - An affiliate link for the Organizer Referral Program
   - Auto-approved status

2. **Sharing the Link**: Venue managers can:
   - View their affiliate link on their dashboard
   - Copy the link with one click
   - Share it with organizers they want to invite

3. **Tracking**: Venue managers can see:
   - All users who signed up with their link
   - Account types of referred users
   - Sign-up dates
   - Conversion status
   - Revenue share rates
   - Total commissions earned

### For Organizers:

1. **Sign Up**: When an organizer clicks a venue manager's affiliate link:
   - A cookie is set (30-day window)
   - When they sign up, a referral record is created
   - The referral is linked to the venue manager

2. **First Event**: When the organizer creates their first published event:
   - System checks if they were referred by a venue manager
   - If yes, platform fee is **100% waived** (0% instead of 12.4%)
   - This is clearly displayed in the event creation form
   - The venue manager earns a commission when the event converts

3. **Subsequent Events**: Normal platform fees apply (12.4% or with any discounts)

## Commission Structure

The commission structure is defined in the "Organizer Referral Program" campaign:
- **Active Commission**: One-time commission when organizer verifies and publishes first event
- **Commission Type**: Can be percentage or fixed amount
- **Commission Base**: Can be based on platform fee, transaction amount, etc.

## Important Notes

1. **First Event Free**: This is a one-time benefit - only the organizer's first published event gets the 100% platform fee waiver.

2. **Cookie Window**: The affiliate link tracking uses a 30-day cookie window. If an organizer doesn't sign up within 30 days of clicking the link, the referral won't be tracked.

3. **Conversion Events**: The referral converts when:
   - Organizer account is verified
   - First listing is published
   - Commission is calculated and created

4. **Revenue Share**: The revenue share rate is determined by the campaign settings, not a fixed 30%. Check the "Organizer Referral Program" campaign in the Affiliate Program Manager to see the actual rate.

## Testing Checklist

- [ ] Run `VENUE_MANAGER_AFFILIATE_AUTO_SETUP.sql` in Supabase
- [ ] Verify existing venue managers have affiliate records
- [ ] Check that new venue manager registrations auto-create affiliate records
- [ ] Test affiliate link generation
- [ ] Verify venue dashboard shows affiliate section
- [ ] Test organizer signup via affiliate link
- [ ] Verify first event gets 100% platform fee waiver
- [ ] Check that subsequent events use normal fees
- [ ] Verify commission creation when organizer publishes first event

## Future Enhancements

Potential improvements:
- Email notifications when someone signs up via affiliate link
- Detailed analytics dashboard for venue managers
- Commission payout tracking
- Multiple campaign support per venue manager
- Custom commission rates per venue manager

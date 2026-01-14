# Affiliate Campaigns Structure

## Overview

The affiliate program has three main campaigns with the following structure:

## Campaigns

### 1. Student Referral Program - **PAUSED**
- **Status**: Disabled/Paused
- **Reason**: Students don't pay platform fees, so there's no commission to share
- **Can be re-enabled**: Yes, via admin toggle in Affiliate Program Manager

### 2. Organizer Referral Program - **ACTIVE**
- **Description**: Refer new organizers - Earn 20% of their Event Fee for 1 year
- **Target**: Organizers
- **Conversion Event**: `organizer_verified` (when organizer account is verified)
- **Active Commission**: None (no one-time commission)
- **Passive Commission**: 
  - **Rate**: 20% of Event Fee
  - **Duration**: 12 months (1 year)
  - **Trigger Events**: `event_published`, `booking_completed`
- **First Event Benefit**: 
  - Organizers referred by venue managers get **100% platform fee waiver** on their first event
  - This is separate from the commission structure
  - Only applies to the first published event
- **Cookie Window**: 30 days
- **Status**: Can be toggled on/off by admin

### 3. Venue Referral Program - **ACTIVE**
- **Description**: Refer new Venue Hosts and get 20% of their venue fees for one year
- **Target**: Venues
- **Conversion Event**: `venue_activated` (when venue is published and activated)
- **Active Commission**: None (no one-time commission)
- **Passive Commission**:
  - **Rate**: 20% of venue fees
  - **Duration**: 12 months (1 year)
  - **Trigger Events**: `venue_booking`, `event_at_venue`
- **First Event Benefit**:
  - Venues referred get **100% platform fee waiver** on their first event
  - This is separate from the commission structure
- **Cookie Window**: 30 days
- **Status**: Can be toggled on/off by admin

## Key Features

### Campaign Toggle (On/Off)
- Admins can enable/disable any campaign via the `is_active` field
- When paused, no new referrals or commissions are created
- Existing commissions and referrals remain intact
- Toggle is visible in the campaign list and edit dialog

### First Event Free
- **For Organizers**: When referred by a venue manager, their first published event gets 100% platform fee discount
- **For Venues**: When referred, their first event gets 100% platform fee discount
- This is a one-time benefit, separate from the ongoing commission structure
- Implemented in:
  - `src/pages/InstructorRetreatForm.tsx`
  - `src/pages/InstructorDashboard.tsx`

### Passive Commission Structure
- **Organizer Program**: 20% of event fees for 1 year
- **Venue Program**: 20% of venue fees for 1 year
- Commissions are calculated and created automatically when trigger events occur
- Duration is tracked from the conversion date

## Admin Controls

### In Affiliate Program Manager:
1. **View Campaigns**: See all campaigns with their status (Active/Paused)
2. **Edit Campaigns**: 
   - Toggle campaign on/off
   - Update commission rates
   - Modify duration
   - Change conversion events
3. **Campaign Status Badge**: 
   - Green "Active" badge for enabled campaigns
   - Red "Paused" badge for disabled campaigns

## Database Updates

Run `UPDATE_AFFILIATE_CAMPAIGNS.sql` to:
1. Pause Student Referral Program
2. Update Organizer Referral Program with 20% passive commission
3. Update Venue Referral Program with 20% passive commission
4. Set proper descriptions and settings

## Implementation Notes

- The first-event-free logic checks if the user was referred by a venue manager
- Platform fee calculation automatically applies 100% discount for first events
- Campaign status (`is_active`) controls whether new referrals can be created
- Passive commissions are tracked separately from active commissions
- Commission calculations happen automatically via database functions

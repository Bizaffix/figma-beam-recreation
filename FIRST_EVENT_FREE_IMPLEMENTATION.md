# First Event Free Feature Implementation

## Overview

The "First Event Free" feature is now a **separate, admin-controlled campaign** that allows admins to grant organizers a 100% platform fee waiver on their first event.

## Key Features

### 1. Admin-Controlled Assignment
- **Location**: Admin Dashboard → Organizers/Venues section
- **Action**: Admins can select organizers and click "First Event Free" button
- **Result**: Grants `first_event_free_eligible = true` to selected organizers
- **Removal**: Admins can remove the benefit by clicking the X button next to the badge

### 2. Campaign Toggle
- **Campaign Name**: "First Event Free Program"
- **Location**: Affiliate Program Manager → Campaigns tab
- **Control**: Admins can enable/disable the entire feature via the campaign toggle
- **When Disabled**: Even if organizers are marked as eligible, the benefit won't apply

### 3. Automatic Tracking
- **Usage Tracking**: System automatically marks `first_event_free_used = true` when organizer publishes their first event
- **One-Time Benefit**: Once used, the benefit cannot be used again
- **Status Display**: Shows "Eligible" or "Used" badge in admin dashboard

## Database Changes

### SQL Migration Required
Run `FIRST_EVENT_FREE_MIGRATION.sql` in Supabase SQL Editor to:
1. Add `first_event_free_eligible` field to profiles table
2. Add `first_event_free_used` field to profiles table
3. Create "First Event Free Program" campaign

## How It Works

### For Admins:

1. **Grant Benefit**:
   - Go to Admin Dashboard
   - Open Organizers or Venues dialog
   - Select one or more organizers
   - Click "First Event Free" button
   - Benefit is granted immediately

2. **Toggle Feature**:
   - Go to Affiliate Program Manager
   - Click "Campaigns" tab
   - Find "First Event Free Program"
   - Edit campaign and toggle "Campaign Active" on/off
   - When off, no one gets the benefit (even if marked eligible)

3. **View Status**:
   - See "Eligible" badge for organizers who haven't used it yet
   - See "Used" badge for organizers who already used it
   - Remove benefit by clicking X button

### For Organizers:

1. **Eligibility**: Admin grants the benefit
2. **First Event**: When creating their first published event:
   - System checks if campaign is active
   - System checks if they're eligible
   - System checks if they haven't used it yet
   - If all true: Platform fee is 100% waived (0% instead of 12.4%)
   - Benefit is clearly displayed in the event creation form
3. **After First Event**: Normal platform fees apply

## Implementation Details

### Files Modified:

1. **`FIRST_EVENT_FREE_MIGRATION.sql`**
   - Adds database fields
   - Creates campaign

2. **`src/pages/AdminDashboard.tsx`**
   - Added "First Event Free" button
   - Added handlers: `handleAssignFirstEventFree()`, `handleRemoveFirstEventFree()`
   - Updated table/card views to show eligibility status
   - Updated queries to fetch `first_event_free_eligible` and `first_event_free_used`

3. **`src/pages/InstructorRetreatForm.tsx`**
   - Removed automatic referral-based logic
   - Added check for admin-assigned eligibility
   - Added check for campaign status
   - Marks `first_event_free_used` when first event is published

4. **`src/pages/InstructorDashboard.tsx`**
   - Same updates as InstructorRetreatForm.tsx

## Platform Fee Calculation Logic

```typescript
// Priority order:
1. First Event Free (if eligible, campaign active, not used, and first event)
2. Organizer discount (if assigned by admin)
3. Venue owner discount (if assigned by admin)
4. Base platform fee (12.4%)
```

## Campaign Control

The "First Event Free Program" campaign:
- **Target Type**: Organizer
- **Conversion Event**: `first_event_published`
- **Active Commission**: None
- **Passive Commission**: Disabled
- **Status**: Toggleable by admin (`is_active`)

When the campaign is **paused**:
- No new benefits are applied
- Organizers already marked as eligible won't get the benefit
- Existing usage records remain intact

## Testing Checklist

- [ ] Run `FIRST_EVENT_FREE_MIGRATION.sql` in Supabase
- [ ] Verify "First Event Free Program" campaign exists
- [ ] Test granting benefit to organizers in Admin Dashboard
- [ ] Test removing benefit
- [ ] Toggle campaign on/off in Affiliate Program Manager
- [ ] Verify benefit applies when campaign is active
- [ ] Verify benefit doesn't apply when campaign is paused
- [ ] Test that benefit is marked as "Used" after first event
- [ ] Verify subsequent events use normal platform fees

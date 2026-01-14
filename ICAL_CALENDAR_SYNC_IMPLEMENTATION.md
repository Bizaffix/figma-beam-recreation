# iCal Calendar Sync Implementation Guide

## Overview

This document outlines what it would take to implement iCal calendar synchronization for venues, allowing them to sync their availability with platforms like AirBnB, VRBO, Booking.com, Retreat Guru, Lodgify, and Guesty. This eliminates the need for venues to manually manage calendars across multiple platforms.

## Current System Analysis

### Existing Calendar Infrastructure

1. **iCal Library** (`src/lib/calendar.ts`)
   - ✅ Can generate ICS files for individual retreats
   - ✅ Supports Google Calendar URL generation
   - ✅ Handles date parsing and formatting

2. **Database Schema**
   - ✅ `event_requests` table with `start_date`, `end_date`, `status`
   - ✅ `properties` table with `blocked_dates` (text[]) and `availability_calendar` (text[])
   - ✅ `bookings` table for student bookings

3. **Venue Dashboard**
   - ✅ Calendar view showing approved events
   - ✅ Visual representation of booked dates

## What Needs to Be Implemented

### 1. iCal Feed Export (Outbound Sync)

**Purpose:** Generate a public iCal feed URL for each venue that other platforms can subscribe to.

**Implementation Requirements:**

#### A. Database Changes
```sql
-- Add iCal feed token to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_feed_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_properties_ical_token ON properties(ical_feed_token);

-- Generate unique token for each property
UPDATE properties SET ical_feed_token = gen_random_uuid()::text WHERE ical_feed_token IS NULL;
```

#### B. API Endpoint (Supabase Edge Function or API Route)
Create an endpoint that:
- Accepts a token parameter: `/api/ical/[token].ics`
- Fetches all approved `event_requests` for that property
- Fetches all `blocked_dates` from the property
- Generates a complete iCal feed with:
  - All approved bookings as BUSY events
  - All blocked dates as BUSY events
  - Proper DTSTART/DTEND formatting
  - UID, DTSTAMP, SUMMARY fields
- Returns with `Content-Type: text/calendar`

**Example Endpoint:**
```
GET /api/ical/abc123def456.ics
```

**Response Format:**
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BookMyQuiltRetreat//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:event-123@bookmyquiltretreat.com
DTSTAMP:20250115T120000Z
DTSTART:20250215T000000Z
DTEND:20250218T000000Z
SUMMARY:Quilting Retreat - Beginner Workshop
DESCRIPTION:Approved booking for quilting retreat
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:blocked-456@bookmyquiltretreat.com
DTSTAMP:20250115T120000Z
DTSTART:20250301T000000Z
DTEND:20250305T000000Z
SUMMARY:Blocked Dates
DESCRIPTION:Property unavailable
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

#### C. Frontend UI Updates
- Add "Calendar Sync" section to `LocationOwnerDashboard.tsx`
- Display the iCal feed URL with copy button
- Show instructions for adding to AirBnB, VRBO, Booking.com
- Display last sync time

### 2. iCal Feed Import (Inbound Sync)

**Purpose:** Allow venues to import external calendar feeds (from AirBnB, VRBO, etc.) to automatically block dates.

**Implementation Requirements:**

#### A. Database Changes
```sql
-- Add external calendar sync settings
CREATE TABLE IF NOT EXISTS property_calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export')),
  ical_url TEXT NOT NULL,
  platform_name TEXT, -- 'airbnb', 'vrbo', 'booking.com', etc.
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_hours INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, ical_url)
);

CREATE INDEX idx_calendar_syncs_property ON property_calendar_syncs(property_id);
CREATE INDEX idx_calendar_syncs_enabled ON property_calendar_syncs(sync_enabled) WHERE sync_enabled = true;
```

#### B. Background Job (Supabase Edge Function or Cron)
Create a scheduled function that:
- Runs every hour (or configurable interval)
- Fetches all enabled import syncs
- Downloads iCal feeds from external URLs
- Parses iCal format to extract events
- Updates `blocked_dates` array in `properties` table
- Handles errors gracefully (invalid URLs, network issues)
- Updates `last_synced_at` timestamp

**iCal Parsing Library:**
- Use `node-ical` or `ical.js` npm package
- Parse VEVENT components
- Extract DTSTART, DTEND, SUMMARY

#### C. Frontend UI Updates
- Add "Import External Calendar" section
- Form to add iCal URL with platform selector
- List of active syncs with status indicators
- Manual "Sync Now" button
- Toggle to enable/disable syncs
- Show last sync time and any errors

### 3. Two-Way Sync Logic

**Conflict Resolution:**
- When external calendar shows a booking, block those dates in our system
- When our system has an approved booking, it appears in the exported feed
- If both systems have bookings for the same dates, prioritize our system (since we control the booking)

**Data Flow:**
```
External Platform (AirBnB) → iCal Feed → Our System → Blocked Dates
Our System → Approved Bookings → iCal Feed → External Platform → Blocked Dates
```

## Technical Implementation Details

### 1. iCal Feed Generation (Export)

**File:** `supabase/functions/generate-ical-feed/index.ts` or API route

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const url = new URL(req.url)
  const token = url.pathname.split('/').pop()?.replace('.ics', '')
  
  if (!token) {
    return new Response('Invalid token', { status: 400 })
  }

  const supabase = createClient(...)
  
  // Get property by token
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('ical_feed_token', token)
    .single()

  if (!property) {
    return new Response('Property not found', { status: 404 })
  }

  // Get approved events
  const { data: events } = await supabase
    .from('event_requests')
    .select('*')
    .eq('property_id', property.id)
    .eq('status', 'approved')

  // Get blocked dates
  const blockedDates = property.blocked_dates || []

  // Generate iCal content
  const icalContent = generateICalFeed(events, blockedDates)

  return new Response(icalContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="calendar-${token}.ics"`,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
})
```

### 2. iCal Feed Import (Background Sync)

**File:** `supabase/functions/sync-external-calendars/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://esm.sh/node-ical@0.15.1'

serve(async (req) => {
  const supabase = createClient(...)
  
  // Get all enabled import syncs
  const { data: syncs } = await supabase
    .from('property_calendar_syncs')
    .select('*, properties(id, blocked_dates)')
    .eq('sync_type', 'import')
    .eq('sync_enabled', true)

  for (const sync of syncs) {
    try {
      // Fetch external iCal feed
      const response = await fetch(sync.ical_url)
      const icalText = await response.text()
      
      // Parse iCal
      const events = parse(icalText)
      
      // Extract blocked dates
      const blockedDates = extractBlockedDates(events)
      
      // Update property blocked_dates
      await supabase
        .from('properties')
        .update({ 
          blocked_dates: blockedDates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sync.property_id)
      
      // Update sync status
      await supabase
        .from('property_calendar_syncs')
        .update({ 
          last_synced_at: new Date().toISOString()
        })
        .eq('id', sync.id)
        
    } catch (error) {
      console.error(`Error syncing ${sync.id}:`, error)
      // Log error but continue with other syncs
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 3. Frontend Components

**New Component:** `src/components/CalendarSyncSettings.tsx`

```typescript
interface CalendarSyncSettingsProps {
  propertyId: string
  icalFeedToken: string
}

export const CalendarSyncSettings = ({ propertyId, icalFeedToken }: CalendarSyncSettingsProps) => {
  // Display export URL
  // Form to add import URLs
  // List of active syncs
  // Manual sync button
}
```

## Integration Steps for Venues

### Exporting to External Platforms

1. **AirBnB:**
   - Go to Listing → Availability → Calendar sync
   - Click "Import calendar"
   - Paste: `https://bookmyquiltretreat.com/api/ical/[token].ics`
   - Name it "BookMyQuiltRetreat"

2. **VRBO:**
   - Go to Calendar → Import & export
   - Click "Import a calendar"
   - Paste the iCal URL

3. **Booking.com:**
   - Go to Rates & Availability → Calendar
   - Click "Sync calendars" → "Add calendar connection"
   - Paste the iCal URL

### Importing from External Platforms

1. **Get iCal URL from platform:**
   - AirBnB: Export calendar → Copy URL
   - VRBO: Export calendar → Copy URL
   - Booking.com: Sync calendars → Export → Copy URL

2. **Add to our system:**
   - Go to Venue Dashboard → Calendar Sync
   - Click "Import External Calendar"
   - Paste the iCal URL
   - Select platform name
   - System will sync every 6 hours (configurable)

## Estimated Implementation Effort

### Phase 1: Export Feed (Outbound)
- **Time:** 2-3 days
- **Tasks:**
  - Database migration for ical_feed_token
  - Edge function for iCal generation
  - Frontend UI for displaying feed URL
  - Testing with external platforms

### Phase 2: Import Feed (Inbound)
- **Time:** 3-4 days
- **Tasks:**
  - Database migration for sync settings
  - iCal parsing library integration
  - Background sync job
  - Frontend UI for managing imports
  - Error handling and logging

### Phase 3: Testing & Refinement
- **Time:** 2-3 days
- **Tasks:**
  - Test with real AirBnB/VRBO/Booking.com feeds
  - Handle edge cases (timezone issues, recurring events)
  - Performance optimization
  - User documentation

**Total Estimated Time:** 7-10 days

## Considerations & Limitations

### 1. Sync Frequency
- iCal syncs are **not real-time**
- Platforms typically update every 2-6 hours
- Our system should sync at similar intervals
- Manual "Sync Now" button for urgent updates

### 2. Timezone Handling
- iCal uses UTC timestamps
- Need to handle timezone conversions properly
- Store all dates in UTC in database

### 3. Recurring Events
- iCal supports RRULE for recurring events
- May need additional parsing logic
- Consider if venues need recurring blocked dates

### 4. Conflict Resolution
- What happens if AirBnB shows a booking but we also have one?
- Priority: Our bookings take precedence
- Show warnings in UI if conflicts detected

### 5. Security
- iCal feed tokens should be:
  - Unique per property
  - Regeneratable by venue owner
  - Not easily guessable
- Consider adding optional password protection

### 6. Performance
- iCal feeds can be large for venues with many bookings
- Cache generated feeds (1 hour TTL)
- Paginate or limit date range if needed

## Dependencies

### NPM Packages Needed
```json
{
  "node-ical": "^0.15.1",  // For parsing iCal feeds
  "ical-generator": "^5.0.0"  // Alternative for generating iCal (if needed)
}
```

### Supabase Features
- Edge Functions (for background sync job)
- Cron jobs (or external cron service like Vercel Cron)
- Database triggers (optional, for auto-updating timestamps)

## Alternative Approaches

### Option 1: Use Third-Party Service
- **Services:** Syncbnb, Hostfully, Guesty
- **Pros:** Handles all sync logic, more reliable
- **Cons:** Monthly cost ($20-50/venue), less control

### Option 2: Direct API Integration
- **Platforms:** AirBnB API, VRBO API (if available)
- **Pros:** Real-time sync, more data
- **Cons:** Requires API access, more complex, may not be available

### Option 3: Manual Export/Import
- **Current:** Venues manually export/import
- **Pros:** Simple, no development needed
- **Cons:** Time-consuming, error-prone, not scalable

## Recommended Approach

**Start with Option 1 (iCal Export) + Option 2 (iCal Import):**
- Most platforms support iCal
- No API access required
- Standard format, well-documented
- Can be implemented in-house
- Scales to many platforms

**Future Enhancement:**
- If specific platforms offer APIs, add direct integration
- Consider third-party service if sync becomes too complex

## Next Steps

1. **Validate Requirements:**
   - Confirm which platforms venues use most
   - Test iCal export/import with sample data
   - Verify timezone handling

2. **Start with Export:**
   - Implement iCal feed generation
   - Test with AirBnB/VRBO import
   - Get feedback from venues

3. **Add Import:**
   - Implement background sync job
   - Test with real external feeds
   - Handle edge cases

4. **Documentation:**
   - Create user guide with screenshots
   - Video tutorial for common platforms
   - Troubleshooting guide

## Questions to Answer

1. **Sync Frequency:** How often should we sync? (Recommendation: Every 6 hours)
2. **Date Range:** How far in advance should feeds include? (Recommendation: 1 year)
3. **Blocked vs Booked:** Should we differentiate in the feed? (Recommendation: Yes, use SUMMARY field)
4. **Multiple Properties:** Can venues sync multiple properties? (Recommendation: Yes, separate feeds)
5. **Pricing:** Should this be a premium feature? (Recommendation: Free for all, or Pro plan feature)

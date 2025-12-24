# Affiliate Program Manager - Setup Guide

## Overview

The Affiliate Program Manager is a comprehensive system for managing affiliates, campaigns, referrals, commissions, and payouts. It supports tracking for students, organizers, and venues with both active (one-time) and passive (recurring) commission structures.

## Database Setup

1. **Run the SQL Migration**
   - Open Supabase SQL Editor
   - Run the contents of `AFFILIATE_PROGRAM_MIGRATION.sql`
   - This creates all necessary tables, indexes, RLS policies, and functions

2. **Verify Tables Created**
   - `affiliates` - Affiliate records
   - `affiliate_campaigns` - Campaign/program configurations
   - `affiliate_links` - Tracking links
   - `affiliate_campaign_assignments` - Custom commission overrides
   - `affiliate_referrals` - Referral tracking
   - `affiliate_commissions` - Commission records
   - `affiliate_payouts` - Payout records
   - `affiliate_link_clicks` - Click tracking

## Features

### 1. Program Overview Dashboard
- Total affiliates (active, pending, blocked)
- Total clicks, signups, and conversions
- Commission totals (pending, approved, paid)
- Conversion rate metrics
- Recent activity feed

### 2. Affiliate Management
- Create and manage affiliates
- Set affiliate type (Content Creator, Organizer Partner, Venue Partner, Other)
- Configure payout methods (Stripe Connect, PayPal, Bank Transfer, Manual)
- Manage status (Pending, Approved, Blocked, Suspended)
- Track tax info status

### 3. Campaign & Link Manager
- Create campaigns for different target types (Student, Organizer, Venue)
- Configure conversion events
- Set active commission (fixed amount or percentage)
- Configure passive/recurring commissions
- Set cookie window and attribution rules
- Generate unique tracking links per affiliate per campaign
- Optional coupon codes tied to links

### 4. Referral & Commission Ledger
- Detailed view of all referrals and commissions
- Filter by date range, affiliate, type, status
- View conversion events and transaction details
- Manual commission adjustments (top-up, clawback, dispute)
- Export to CSV

### 5. Payout Center
- View payable balances per affiliate
- Track payout status (queued, processing, sent, confirmed, failed)
- Support for multiple payout methods
- Bulk payout generation

## Tracking Integration

### Automatic Tracking
The system automatically tracks affiliate referrals through:

1. **URL Parameters**: `?ref=CODE` or `?affiliate=CODE`
2. **Cookies**: 30-day cookie window (configurable per campaign)
3. **Attribution**: Last-click model (configurable)

### Integration Points

#### Student Signups
- Automatically creates referral when student signs up via affiliate link
- Converts referral when student completes first booking
- Commission calculated based on campaign rules

#### Organizer Signups
- Creates referral when organizer signs up via affiliate link
- Converts when organizer account is verified and first listing is published
- Supports both active and passive commissions

#### Venue Registration
- Creates referral when venue owner signs up via affiliate link
- Converts when venue is published and activated
- Tracks venue-specific conversions

## Usage

### Accessing the Manager
1. Log in as admin
2. Go to Admin Dashboard
3. Click "Open Manager" button in the Affiliate Program Manager card
4. Or navigate directly to `/admin/affiliates`

### Creating an Affiliate
1. Go to "Affiliates" tab
2. Click "Add Affiliate"
3. Fill in:
   - Name and email
   - Affiliate type
   - Payout method
   - Status (start with "Pending")
4. Save

### Creating a Campaign
1. Go to "Campaigns" tab
2. Click "New Campaign"
3. Configure:
   - Campaign name and description
   - Target type (Student/Organizer/Venue)
   - Conversion event
   - Active commission (type, value, base)
   - Cookie window
   - Attribution model
4. Save

### Generating Tracking Links
1. Go to "Campaigns" tab
2. Click "Generate Link"
3. Select affiliate and campaign
4. Optionally add coupon code
5. Copy the generated link

### Viewing Performance
1. Go to "Overview" tab for high-level metrics
2. Go to "Ledger" tab for detailed commission records
3. Use filters to narrow down results
4. Export to CSV for accounting

### Processing Payouts
1. Go to "Payouts" tab
2. View pending payouts
3. Process payouts through configured method (Stripe Connect, PayPal, etc.)
4. Update status as payouts are processed

## Commission Structure Examples

### Student Referral
- **Active**: 20% of platform fee on first booking
- **Passive**: None (or optional recurring %)

### Organizer Referral
- **Active**: $50 fixed bounty when organizer verified + first listing published
- **Passive**: 5% of platform fees for 12 months

### Venue Referral
- **Active**: $25 fixed bounty when venue activated
- **Passive**: 3% of revenue generated via venue for 6 months

## Technical Details

### Tracking Flow
1. User clicks affiliate link → Cookie set (30 days)
2. User signs up → Referral record created
3. User converts (books/verifies/activates) → Commission created
4. Admin approves commission → Status updated
5. Payout processed → Commission marked as paid

### Cookie Management
- Stored in browser with 30-day expiry (configurable)
- Contains: link code, affiliate ID, campaign ID, timestamp
- Automatically cleaned up on expiry

### Attribution Rules
- **Last-click**: Most recent affiliate link gets credit
- **First-click**: First affiliate link gets credit (configurable per campaign)

## API Functions

### `initializeAffiliateTracking()`
Called on app load to capture affiliate codes from URL and set cookies.

### `createReferral(type, userId, venueId?)`
Creates a referral record when user signs up or venue is registered.

### `convertReferral(referralId, eventType, eventId, amount, platformFee)`
Marks referral as converted and creates commission.

### `getCurrentAffiliate()`
Returns current affiliate data from cookie.

## Future Enhancements

- Stripe Connect integration for automated payouts
- PayPal integration
- Recurring commission automation
- Advanced analytics and reporting
- Affiliate portal for self-service
- Performance-based tiered commissions
- Time-boxed bonus campaigns

## Support

For issues or questions, check:
- Database schema: `AFFILIATE_PROGRAM_MIGRATION.sql`
- Tracking utilities: `src/lib/affiliate-tracking.ts`
- Admin UI: `src/pages/AffiliateProgramManager.tsx`


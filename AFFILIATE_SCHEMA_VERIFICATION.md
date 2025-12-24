# Affiliate Program Schema Verification

## Current Database Status

Your database schema matches the migration file structure. Here's what's verified:

### ✅ Tables Present
- `affiliates` ✓
- `affiliate_campaigns` ✓
- `affiliate_links` ✓
- `affiliate_campaign_assignments` ✓
- `affiliate_referrals` ✓
- `affiliate_commissions` ✓
- `affiliate_payouts` ✓
- `affiliate_link_clicks` ✓

### ⚠️ Recommended Additions

Run `AFFILIATE_PROGRAM_INDEXES_AND_CONSTRAINTS.sql` to add:

1. **UNIQUE Constraints** (prevent duplicates):
   - `affiliate_links(affiliate_id, campaign_id)` - One link per affiliate per campaign
   - `affiliate_campaign_assignments(affiliate_id, campaign_id)` - One assignment per affiliate per campaign

2. **Additional Indexes** (improve query performance):
   - `idx_affiliate_referrals_referred_venue` - For venue referral lookups
   - `idx_affiliate_commissions_payout` - For payout-related queries
   - `idx_affiliate_commissions_transaction` - For transaction lookups
   - `idx_affiliate_referrals_affiliate_converted` - Composite index for conversion queries
   - `idx_affiliate_campaigns_active` - For active campaign filtering
   - `idx_affiliates_status_type` - For status/type filtering
   - `idx_affiliate_payouts_status_date` - For payout status queries

3. **Foreign Key Constraints**:
   - `affiliate_referrals.referred_venue_id` → `properties.id`
   - `affiliate_commissions.payout_id` → `affiliate_payouts.id`

## Schema Comparison

### Matches Migration ✓
- All table structures match
- All column types and constraints match
- All CHECK constraints are present
- Default values are correct

### Differences from Migration
- Some UNIQUE constraints may be missing (run the indexes script)
- Some performance indexes may be missing (run the indexes script)
- Foreign key for `referred_venue_id` may be missing (run the indexes script)

## Next Steps

1. **Run the indexes script**:
   ```sql
   -- Execute: AFFILIATE_PROGRAM_INDEXES_AND_CONSTRAINTS.sql
   ```

2. **Verify RLS Policies**:
   - Check that RLS is enabled on all tables
   - Verify admin policies are in place

3. **Test the System**:
   - Create a test affiliate
   - Create a test campaign
   - Generate a test link
   - Test referral tracking

## Field Notes

### `affiliate_campaigns.passive_commission_events`
- Type: `text[]` (array)
- Default: `'{}'::text[]`
- Used to specify which events trigger passive commissions
- Example: `['booking', 'subscription_renewal']`

### `affiliate_referrals.referred_venue_id`
- References `properties.id` (not `auth.users`)
- Can be NULL (for student/organizer referrals)
- Should have foreign key constraint

### `affiliate_commissions.payout_id`
- References `affiliate_payouts.id`
- Can be NULL (until payout is created)
- Should have foreign key constraint

## Performance Considerations

The additional indexes will help with:
- Fast affiliate lookup by status/type
- Quick campaign filtering by active status
- Efficient referral conversion queries
- Fast payout status lookups
- Optimized payout generation


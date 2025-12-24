-- Additional Indexes and Constraints for Affiliate Program
-- Run this in Supabase SQL Editor to optimize performance and add missing constraints

-- 1. Add UNIQUE constraint to affiliate_links (one link per affiliate per campaign)
-- This prevents duplicate links
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_links_affiliate_campaign_unique'
  ) THEN
    ALTER TABLE public.affiliate_links
    ADD CONSTRAINT affiliate_links_affiliate_campaign_unique 
    UNIQUE (affiliate_id, campaign_id);
  END IF;
END $$;

-- 2. Add UNIQUE constraint to affiliate_campaign_assignments
-- This prevents duplicate assignments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_campaign_assignments_unique'
  ) THEN
    ALTER TABLE public.affiliate_campaign_assignments
    ADD CONSTRAINT affiliate_campaign_assignments_unique 
    UNIQUE (affiliate_id, campaign_id);
  END IF;
END $$;

-- 3. Add index on affiliate_referrals for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_venue 
ON public.affiliate_referrals(referred_venue_id) 
WHERE referred_venue_id IS NOT NULL;

-- 4. Add index on affiliate_commissions for payout lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payout 
ON public.affiliate_commissions(payout_id) 
WHERE payout_id IS NOT NULL;

-- 5. Add index on affiliate_commissions for transaction lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_transaction 
ON public.affiliate_commissions(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- 6. Add composite index for referral conversion queries
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_converted 
ON public.affiliate_referrals(affiliate_id, converted, created_at);

-- 7. Add index for campaign active status lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_active 
ON public.affiliate_campaigns(is_active, target_type);

-- 8. Add index for affiliate status lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_status_type 
ON public.affiliates(status, affiliate_type);

-- 9. Add index for link code lookups (already should exist, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code_unique 
ON public.affiliate_links(link_code);

-- 10. Add index for payout status and date queries
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status_date 
ON public.affiliate_payouts(status, requested_at);

-- 11. Add foreign key constraint for referred_venue_id if it doesn't exist
-- Note: This assumes properties table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_referrals_referred_venue_id_fkey'
  ) THEN
    ALTER TABLE public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_referred_venue_id_fkey 
    FOREIGN KEY (referred_venue_id) REFERENCES public.properties(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 12. Add foreign key constraint for payout_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_commissions_payout_id_fkey'
  ) THEN
    ALTER TABLE public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_payout_id_fkey 
    FOREIGN KEY (payout_id) REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Verify all indexes and constraints
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename LIKE 'affiliate%'
ORDER BY tablename, indexname;

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name LIKE 'affiliate%'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;


-- ============================================================
-- Draft Listings V2 – Additional columns for claim flow,
-- admin review, editable listing, and token expiry
-- Run AFTER DRAFT_LISTINGS_MIGRATION.sql
-- ============================================================

-- 1. Application answers from claim form
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS claimer_role TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS application_about TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS application_events_hosted TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS application_notes TEXT;

-- 2. Editable listing fields (organizer fills in during claim Step 2)
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}';
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS policies TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS deposit_info TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS skill_levels TEXT[] DEFAULT '{}';

-- 3. Admin review fields
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS review_flags TEXT[] DEFAULT '{}';

-- 4. Token expiry (30 days from creation)
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
ALTER TABLE draft_listings ADD COLUMN IF NOT EXISTS invite_reminder_sent BOOLEAN DEFAULT FALSE;

-- Set expiry for existing rows that don't have one
UPDATE draft_listings 
SET invite_expires_at = created_at + INTERVAL '30 days'
WHERE invite_expires_at IS NULL;

-- 5. Grant permissions for admin operations on draft_listings
GRANT ALL ON draft_listings TO authenticated;
GRANT SELECT, INSERT ON listing_interests TO anon;
GRANT SELECT, INSERT ON listing_interests TO authenticated;

-- Done! Run in the Supabase SQL Editor.

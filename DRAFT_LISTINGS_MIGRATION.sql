-- ============================================================
-- Draft Listings Discovery Engine – Database Migration
-- Web-scraped retreat listings, student interests, organizer invites
-- ============================================================

-- 1. Draft Listings – retreats discovered from web search
CREATE TABLE IF NOT EXISTS draft_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'invited', 'claimed', 'pending_approval', 'live', 'rejected', 'removed')),
  title           TEXT NOT NULL,
  description     TEXT,
  main_image_url  TEXT,
  pricing         TEXT DEFAULT 'Contact organizer',
  dates           TEXT DEFAULT 'Flexible—ask organizer',
  location_city   TEXT,
  location_region TEXT,
  location_country TEXT DEFAULT 'USA',
  rooming         TEXT,
  source_url      TEXT NOT NULL,
  extraction_confidence TEXT DEFAULT 'medium'
                    CHECK (extraction_confidence IN ('high', 'medium', 'low')),

  -- Organizer/venue contact (only publicly available info)
  organizer_name  TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  organizer_website TEXT,

  -- Claim tracking
  invite_token    TEXT UNIQUE,
  invite_sent_at  TIMESTAMPTZ,
  invite_reminder_sent_at TIMESTAMPTZ,
  claimed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at      TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Search context (what query found this)
  discovered_from_query TEXT,
  search_result_snippet TEXT,

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_listings_status ON draft_listings (status);
CREATE INDEX IF NOT EXISTS idx_draft_listings_invite_token ON draft_listings (invite_token);
CREATE INDEX IF NOT EXISTS idx_draft_listings_location ON draft_listings (location_city, location_region);
CREATE INDEX IF NOT EXISTS idx_draft_listings_created_at ON draft_listings (created_at DESC);

-- 2. Listing Interests – students who clicked "I'm interested"
CREATE TABLE IF NOT EXISTS listing_interests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_listing_id UUID NOT NULL REFERENCES draft_listings(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name    TEXT,
  student_email   TEXT,
  student_message TEXT,
  contact_preference TEXT DEFAULT 'platform'
                    CHECK (contact_preference IN ('email', 'platform')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_interests_draft ON listing_interests (draft_listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_interests_student ON listing_interests (student_id);

-- 3. RLS Policies
ALTER TABLE draft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_interests ENABLE ROW LEVEL SECURITY;

-- Everyone (including unauthenticated) can view draft listings
CREATE POLICY "Anyone can view draft listings"
  ON draft_listings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can do everything with draft listings
CREATE POLICY "Admins manage draft listings"
  ON draft_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role (edge functions) can insert/update drafts
-- No explicit policy needed; service_role bypasses RLS.

-- Organizers who claimed a listing can update it
CREATE POLICY "Claimers can update their listing"
  ON draft_listings FOR UPDATE
  USING (claimed_by = auth.uid());

-- Anyone (including unauthenticated) can express interest
CREATE POLICY "Anyone can express interest"
  ON listing_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Students can view their own interests
CREATE POLICY "Students view own interests"
  ON listing_interests FOR SELECT
  USING (student_id = auth.uid());

-- Admins can view all interests
CREATE POLICY "Admins view all interests"
  ON listing_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Listing owners can view interests on their listings
CREATE POLICY "Claimers view interests on their listings"
  ON listing_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM draft_listings
      WHERE draft_listings.id = listing_interests.draft_listing_id
        AND draft_listings.claimed_by = auth.uid()
    )
  );

-- Done! Run in the Supabase SQL Editor.

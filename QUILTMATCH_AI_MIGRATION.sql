-- ============================================================
-- QuiltMatch AI – Database Migration
-- Student Query Log & supporting indexes
-- ============================================================

-- 1. Student Query Log – captures every "Find My Quilt Retreat" search
CREATE TABLE IF NOT EXISTS student_query_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_query     TEXT NOT NULL,
  parsed_filters_json JSONB,
  student_name  TEXT,
  student_email TEXT,
  home_location TEXT,
  session_id    TEXT,
  source        TEXT DEFAULT 'homepage-widget',
  matched_event_ids UUID[] DEFAULT '{}',
  created_demo  BOOLEAN DEFAULT FALSE,
  quality_score INTEGER DEFAULT 0,
  outreach_sent BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-based analytics and flywheel insights
CREATE INDEX IF NOT EXISTS idx_student_query_log_created_at
  ON student_query_log (created_at DESC);

-- Index for demand-pattern aggregation (location, themes in parsed_filters_json)
CREATE INDEX IF NOT EXISTS idx_student_query_log_parsed_filters
  ON student_query_log USING GIN (parsed_filters_json);

-- Index for deduplication and follow-up
CREATE INDEX IF NOT EXISTS idx_student_query_log_session
  ON student_query_log (session_id);

-- 2. RLS Policies
ALTER TABLE student_query_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all query logs
CREATE POLICY admin_read_query_log ON student_query_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Any authenticated user can insert (students submitting queries)
CREATE POLICY insert_query_log ON student_query_log
  FOR INSERT
  WITH CHECK (true);

-- Service role (edge functions) can do anything via service_role key
-- No explicit policy needed; service_role bypasses RLS.

-- 3. Ensure retreats table has columns the AI matcher expects
-- These are safe ADD IF NOT EXISTS equivalents:
DO $$
BEGIN
  -- ratings_avg on retreats
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'ratings_avg'
  ) THEN
    ALTER TABLE retreats ADD COLUMN ratings_avg NUMERIC(3,2) DEFAULT 0;
  END IF;

  -- theme array on retreats
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'theme'
  ) THEN
    ALTER TABLE retreats ADD COLUMN theme TEXT[] DEFAULT '{}';
  END IF;

  -- amenities array on retreats
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE retreats ADD COLUMN amenities TEXT[] DEFAULT '{}';
  END IF;

  -- skill_level normalized on retreats (may already exist as 'level')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'skill_level'
  ) THEN
    ALTER TABLE retreats ADD COLUMN skill_level TEXT DEFAULT 'beginner';
  END IF;

  -- booking_url on retreats
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'booking_url'
  ) THEN
    ALTER TABLE retreats ADD COLUMN booking_url TEXT;
  END IF;

  -- venue_id on retreats (nullable FK to venues)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retreats' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE retreats ADD COLUMN venue_id UUID;
  END IF;
END $$;

-- 4. Ensure properties table (venues) has columns for AI matching
DO $$
BEGIN
  -- ratings_avg on properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'ratings_avg'
  ) THEN
    ALTER TABLE properties ADD COLUMN ratings_avg NUMERIC(3,2) DEFAULT 0;
  END IF;

  -- lat/lon on properties for geospatial matching
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'lat'
  ) THEN
    ALTER TABLE properties ADD COLUMN lat NUMERIC(10,7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'lon'
  ) THEN
    ALTER TABLE properties ADD COLUMN lon NUMERIC(10,7);
  END IF;

  -- amenities array on properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE properties ADD COLUMN amenities TEXT[] DEFAULT '{}';
  END IF;

  -- max_capacity on properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE properties ADD COLUMN max_capacity INTEGER DEFAULT 20;
  END IF;

  -- website_url on properties
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE properties ADD COLUMN website_url TEXT;
  END IF;
END $$;

-- 5. Ensure profiles (organizers/instructors) have specialty fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialty_styles'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialty_styles TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'instagram_handle'
  ) THEN
    ALTER TABLE profiles ADD COLUMN instagram_handle TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'events_hosted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN events_hosted INTEGER DEFAULT 0;
  END IF;
END $$;

-- Done! Run this migration in the Supabase SQL Editor.

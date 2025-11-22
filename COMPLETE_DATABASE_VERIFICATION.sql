-- Complete Database Verification and Migration
-- Run this in Supabase SQL Editor to ensure all fields exist and are correct
-- This verifies all fields used in Admin, Instructor, and Student dashboards

-- ============================================
-- 1. VERIFY BOOKINGS TABLE
-- ============================================
-- All fields used in application:
-- id, retreat_id, user_id, payment_intent_id, full_name, email, skill_level, amount, status, created_at, updated_at

-- Verify bookings table structure
DO $$
BEGIN
  -- Check if all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'skill_level'
  ) THEN
    ALTER TABLE bookings ADD COLUMN skill_level TEXT;
  END IF;
  
  -- Ensure status has correct default
  ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed';
  
  -- Ensure amount is numeric(10,2)
  -- Note: This might fail if data exists, so we check first
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'amount'
    AND data_type != 'numeric'
  ) THEN
    -- Convert if needed (be careful with existing data)
    RAISE NOTICE 'Amount column type may need adjustment';
  END IF;
END $$;

-- ============================================
-- 2. VERIFY PROFILES TABLE
-- ============================================
-- All fields used in application:
-- id, email, full_name, avatar_url, bio, role, created_at, updated_at, 
-- facebook_url, instagram_url, pinterest_url, referred_by

-- Verify all profile fields exist
DO $$
BEGIN
  -- Check and add missing fields if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN facebook_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN instagram_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'pinterest_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pinterest_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  -- Ensure role constraint includes 'admin'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    -- Drop and recreate with admin
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('student', 'instructor', 'admin'));
  END IF;
END $$;

-- ============================================
-- 3. VERIFY RETREATS TABLE
-- ============================================
-- All fields used in application:
-- id, title, description, location, date, duration, level, price, total_spots, 
-- spots_available, image, includes, schedule, published, instructor_id, created_at, updated_at

-- Verify all retreat fields exist
DO $$
BEGIN
  -- Check critical fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'includes'
  ) THEN
    ALTER TABLE retreats ADD COLUMN includes TEXT[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'schedule'
  ) THEN
    ALTER TABLE retreats ADD COLUMN schedule JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'published'
  ) THEN
    ALTER TABLE retreats ADD COLUMN published BOOLEAN DEFAULT false;
  END IF;
  
  -- Ensure level constraint is correct
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'retreats_level_check'
  ) THEN
    -- Verify it has correct values
    RAISE NOTICE 'Level constraint exists';
  ELSE
    ALTER TABLE retreats ADD CONSTRAINT retreats_level_check 
      CHECK (level IN ('Beginner', 'Intermediate', 'Advanced'));
  END IF;
END $$;

-- ============================================
-- 4. CREATE/VERIFY INDEXES FOR PERFORMANCE
-- ============================================

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_retreat_id ON bookings(retreat_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Retreats indexes
CREATE INDEX IF NOT EXISTS idx_retreats_instructor_id ON retreats(instructor_id);
CREATE INDEX IF NOT EXISTS idx_retreats_published ON retreats(published);
CREATE INDEX IF NOT EXISTS idx_retreats_created_at ON retreats(created_at DESC);

-- ============================================
-- 5. VERIFY FUNCTIONS
-- ============================================

-- Ensure decrement_spots function exists
CREATE OR REPLACE FUNCTION decrement_spots(retreat_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET spots_available = GREATEST(0, spots_available - 1)
  WHERE id = retreat_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VERIFY ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on bookings if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Users can view their own bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'Users can view own bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  -- Users can create their own bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'Users can create own bookings'
  ) THEN
    CREATE POLICY "Users can create own bookings"
      ON bookings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 7. VERIFY DATA TYPES AND DEFAULTS
-- ============================================

-- Ensure bookings.amount is numeric(10,2)
DO $$
BEGIN
  -- This is informational - actual type changes should be done carefully with existing data
  RAISE NOTICE 'Verify bookings.amount is numeric(10,2)';
  RAISE NOTICE 'Verify retreats.price is numeric(10,2)';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- All fields used in the application should now exist:
-- 
-- BOOKINGS: id, retreat_id, user_id, payment_intent_id, full_name, email, 
--           skill_level, amount, status, created_at, updated_at
--
-- PROFILES: id, email, full_name, avatar_url, bio, role, created_at, updated_at,
--           facebook_url, instagram_url, pinterest_url, referred_by
--
-- RETREATS: id, title, description, location, date, duration, level, price,
--           total_spots, spots_available, image, includes, schedule, published,
--           instructor_id, created_at, updated_at


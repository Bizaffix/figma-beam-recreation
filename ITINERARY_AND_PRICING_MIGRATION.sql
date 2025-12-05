-- Migration: Add Itinerary Builder and Pricing Breakdown fields to retreats table
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- ============================================
-- ADD NEW FIELDS TO RETREATS TABLE
-- ============================================

-- Add venue_fees field for location/venue costs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'venue_fees'
  ) THEN
    ALTER TABLE retreats ADD COLUMN venue_fees NUMERIC(10, 2) DEFAULT 0;
    RAISE NOTICE 'Added venue_fees column';
  ELSE
    RAISE NOTICE 'venue_fees column already exists';
  END IF;
END $$;

-- Add food_budget field for food coordination costs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'food_budget'
  ) THEN
    ALTER TABLE retreats ADD COLUMN food_budget NUMERIC(10, 2) DEFAULT 0;
    RAISE NOTICE 'Added food_budget column';
  ELSE
    RAISE NOTICE 'food_budget column already exists';
  END IF;
END $$;

-- Add itinerary_blocks field for the new itinerary builder data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'itinerary_blocks'
  ) THEN
    ALTER TABLE retreats ADD COLUMN itinerary_blocks JSONB;
    RAISE NOTICE 'Added itinerary_blocks column';
  ELSE
    RAISE NOTICE 'itinerary_blocks column already exists';
  END IF;
END $$;

-- Add location_images field for location photo gallery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retreats' AND column_name = 'location_images'
  ) THEN
    ALTER TABLE retreats ADD COLUMN location_images TEXT[];
    RAISE NOTICE 'Added location_images column';
  ELSE
    RAISE NOTICE 'location_images column already exists';
  END IF;
END $$;

-- ============================================
-- VERIFY THE NEW FIELDS
-- ============================================

-- Verify all new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'retreats' 
  AND column_name IN ('venue_fees', 'food_budget', 'itinerary_blocks', 'location_images')
ORDER BY column_name;

-- ============================================
-- NOTES
-- ============================================
-- 
-- New fields added:
-- 1. venue_fees (NUMERIC(10, 2), default 0) - Location/Venue fees from Airbnb or venue booking
-- 2. food_budget (NUMERIC(10, 2), default 0) - Food coordination budget for guests
-- 3. itinerary_blocks (JSONB, nullable) - Full itinerary builder data including:
--    - Block type (class, open_sew, meal, field_trip, rest)
--    - Title, description, time, day
--    - Pattern file URLs and names
--    - Project image URLs and names
--    - Supply lists
-- 4. location_images (TEXT[], nullable) - Array of location photo URLs for horizontal scrolling gallery
--
-- The schedule field (existing JSONB) will continue to work for backward compatibility
-- with the simple schedule format. The itinerary_blocks field stores the enhanced
-- itinerary builder data with drag-and-drop blocks and attachments.


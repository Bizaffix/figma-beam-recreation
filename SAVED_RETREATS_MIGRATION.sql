-- Migration: Create saved_retreats table for users to save retreats they're interested in
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- ============================================
-- CREATE SAVED_RETREATS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS saved_retreats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retreat_id INTEGER NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, retreat_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_retreats_user_id ON saved_retreats(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_retreats_retreat_id ON saved_retreats(retreat_id);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_retreats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy: Users can view their own saved retreats
CREATE POLICY "Users can view their own saved retreats"
  ON saved_retreats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved retreats
CREATE POLICY "Users can insert their own saved retreats"
  ON saved_retreats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved retreats
CREATE POLICY "Users can delete their own saved retreats"
  ON saved_retreats
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFY TABLE CREATION
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'saved_retreats'
  ) THEN
    RAISE NOTICE 'saved_retreats table created successfully';
  ELSE
    RAISE EXCEPTION 'saved_retreats table was not created';
  END IF;
END $$;

-- Add content_cards column to retreats table
-- This migration adds support for flexible content sections

ALTER TABLE retreats 
ADD COLUMN content_cards JSONB;

-- Add index for better performance on content cards queries
CREATE INDEX idx_retreats_content_cards ON retreats USING GIN (content_cards);

-- Add comment to describe the new column
COMMENT ON COLUMN retreats.content_cards IS 'Array of content cards with title, description, images, and order for organizing retreat details';

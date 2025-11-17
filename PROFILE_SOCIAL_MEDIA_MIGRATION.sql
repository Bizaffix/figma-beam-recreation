-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- This adds social media fields to the profiles table

-- Add social media columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL for instructors';
COMMENT ON COLUMN profiles.instagram_url IS 'Instagram profile URL for instructors';
COMMENT ON COLUMN profiles.pinterest_url IS 'Pinterest profile URL for instructors';


-- Admin Discount Assignment Migration
-- Run this in Supabase SQL Editor
-- This adds discount field to profiles table for organizers and venues

-- Add discount column to profiles table (JSONB to store discount type and value)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS discount JSONB DEFAULT NULL;

-- Add comment to explain the discount structure
COMMENT ON COLUMN profiles.discount IS 'Discount assigned by admin. Format: {"type": "percentage" | "fixed", "value": number}';

-- Create index for faster queries on profiles with discounts
CREATE INDEX IF NOT EXISTS idx_profiles_discount ON profiles USING GIN (discount) WHERE discount IS NOT NULL;

-- Example discount values:
-- Percentage: {"type": "percentage", "value": 10} (10% discount)
-- Fixed: {"type": "fixed", "value": 50} ($50 discount)


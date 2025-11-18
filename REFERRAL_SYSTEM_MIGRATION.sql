-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- This adds referral tracking to the profiles table

-- Add referred_by column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster queries on referred_by
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Add comment for documentation
COMMENT ON COLUMN profiles.referred_by IS 'UUID of the user who referred this user to the platform';

-- Update or create the profile creation trigger function to handle referral codes
-- This function will be called when a new user is created in auth.users

-- First, check if a trigger function exists by trying to create/replace it
-- If you have an existing function, you may need to adjust this
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role,
    referred_by
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
      AND NEW.raw_user_meta_data->>'referred_by' != ''
      THEN (NEW.raw_user_meta_data->>'referred_by')::UUID
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    referred_by = COALESCE(EXCLUDED.referred_by, profiles.referred_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


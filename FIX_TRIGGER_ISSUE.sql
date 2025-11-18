-- If you're getting 500 errors, try this fix
-- Run this in Supabase SQL Editor

-- First, drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Then run the full migration from REFERRAL_SYSTEM_MIGRATION.sql
-- Or run this complete version:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  referred_by_uuid UUID;
  full_name_text TEXT;
  bio_text TEXT;
BEGIN
  -- Extract role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Extract and validate referred_by
  IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'referred_by' != '' THEN
    BEGIN
      referred_by_uuid := (NEW.raw_user_meta_data->>'referred_by')::UUID;
    EXCEPTION WHEN OTHERS THEN
      referred_by_uuid := NULL;
    END;
  ELSE
    referred_by_uuid := NULL;
  END IF;
  
  -- Combine first_name and last_name into full_name
  IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL THEN
    full_name_text := TRIM(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
  ELSE
    full_name_text := NULL;
  END IF;
  
  -- Extract bio
  IF NEW.raw_user_meta_data->>'bio' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'bio' != '' THEN
    bio_text := NEW.raw_user_meta_data->>'bio';
  ELSE
    bio_text := NULL;
  END IF;
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    id, 
    email, 
    role,
    referred_by,
    full_name,
    bio
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    referred_by_uuid,
    full_name_text,
    bio_text
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    referred_by = COALESCE(EXCLUDED.referred_by, profiles.referred_by),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    bio = COALESCE(EXCLUDED.bio, profiles.bio);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- Add RLS policies for Admin users to view all bookings, profiles, and retreats
-- Run this in Supabase SQL Editor
-- This fixes the infinite recursion issue by using a security definer function

-- ============================================
-- 1. CREATE SECURITY DEFINER FUNCTION TO CHECK ADMIN ROLE
-- ============================================
-- This function bypasses RLS to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.role = 'admin'
  );
END;
$$;

-- ============================================
-- 2. DROP EXISTING ADMIN POLICIES (if any)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all retreats" ON retreats;
DROP POLICY IF EXISTS "Admins can update all retreats" ON retreats;

-- ============================================
-- 3. ADMIN POLICIES FOR BOOKINGS
-- ============================================

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow admins to update bookings (if needed for management)
CREATE POLICY "Admins can update all bookings"
  ON bookings FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- 4. ADMIN POLICIES FOR PROFILES
-- ============================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow admins to update profiles (for management)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- 5. ADMIN POLICIES FOR RETREATS
-- ============================================

-- Allow admins to view all retreats
CREATE POLICY "Admins can view all retreats"
  ON retreats FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow admins to update retreats (for management)
CREATE POLICY "Admins can update all retreats"
  ON retreats FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, admins should be able to:
-- 1. View all bookings in AdminDashboard
-- 2. View all profiles (instructors and students)
-- 3. View all retreats
-- 
-- Note: These policies work alongside existing user policies
-- Regular users can still only see their own bookings


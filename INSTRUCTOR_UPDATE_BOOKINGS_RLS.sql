-- Add RLS policy for Instructors to UPDATE bookings for their retreats
-- This allows instructors to approve/reject manual payments and manage bookings
-- Run this in Supabase SQL Editor

-- ============================================
-- INSTRUCTOR UPDATE POLICY FOR BOOKINGS
-- ============================================
-- Allow instructors to update bookings for their own retreats

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Instructors can update bookings for their retreats" ON bookings;

-- Create policy for instructors to update bookings
CREATE POLICY "Instructors can update bookings for their retreats"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM retreats 
      WHERE retreats.id = bookings.retreat_id 
      AND retreats.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM retreats 
      WHERE retreats.id = bookings.retreat_id 
      AND retreats.instructor_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, instructors should be able to:
-- 1. Update bookings for retreats they created
-- 2. Approve/reject manual payment claims
-- 3. Cancel bookings
-- 4. Update payment status
-- 
-- Note: This policy works alongside existing policies
-- Students can still only see their own bookings

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bookings'
AND policyname = 'Instructors can update bookings for their retreats';


-- Add RLS policies for Instructors to view bookings for their retreats
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. INSTRUCTOR POLICIES FOR BOOKINGS
-- ============================================
-- Allow instructors to view bookings for their own retreats

CREATE POLICY "Instructors can view bookings for their retreats"
  ON bookings FOR SELECT
  USING (
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
-- 1. View bookings for retreats they created
-- 2. See correct revenue and booking counts in their dashboard
-- 
-- Note: This policy works alongside existing user policies
-- Students can still only see their own bookings


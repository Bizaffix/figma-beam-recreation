-- Update Manual Payment Rejection to Immediate Cancellation
-- This migration updates the system so that manual payment rejections
-- immediately cancel the booking instead of waiting 48 hours
-- Run this in Supabase SQL Editor

-- 1. Update manual_payment_status CHECK constraint to remove 'rejected'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_manual_payment_status_check;
  
  -- Add new constraint without 'rejected' (rejections now immediately cancel)
  ALTER TABLE bookings 
  ADD CONSTRAINT bookings_manual_payment_status_check 
  CHECK (manual_payment_status IN ('pending_approval', 'approved') OR manual_payment_status IS NULL);
  
  RAISE NOTICE 'Updated manual_payment_status constraint - removed rejected status';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- 2. Update any existing 'rejected' bookings to 'cancelled'
-- (This handles any bookings that were in rejected state before the update)
UPDATE bookings
SET 
  payment_status = 'cancelled',
  status = 'cancelled',
  manual_payment_status = NULL
WHERE 
  payment_status = 'paid_manual'
  AND manual_payment_status = 'rejected';

-- 3. Note: Spots restoration for cancelled bookings
-- The application code will handle spot restoration when rejections occur
-- If you have existing rejected bookings that need spots restored, you can run:
-- SELECT increment_spots(retreat_id) FROM bookings WHERE payment_status = 'cancelled' AND status = 'cancelled' GROUP BY retreat_id;
-- But be careful not to double-restore spots that were already restored

-- 4. Update the cancel_expired_pending_approvals function to only handle pending approvals
CREATE OR REPLACE FUNCTION cancel_expired_pending_approvals()
RETURNS TABLE(booking_id UUID, retreat_id INTEGER, full_name TEXT, email TEXT) AS $$
DECLARE
  forty_eight_hours_ago TIMESTAMP WITH TIME ZONE;
BEGIN
  forty_eight_hours_ago := NOW() - INTERVAL '48 hours';
  
  -- Find and update expired pending approvals (bookings created more than 48 hours ago)
  RETURN QUERY
  WITH expired_bookings AS (
    UPDATE bookings
    SET 
      payment_status = 'cancelled',
      status = 'cancelled',
      manual_payment_status = NULL
    WHERE 
      payment_status = 'paid_manual'
      AND manual_payment_status = 'pending_approval'
      AND (booking_date < forty_eight_hours_ago OR created_at < forty_eight_hours_ago)
      AND payment_status != 'cancelled'
    RETURNING 
      id, 
      retreat_id, 
      full_name, 
      email
  )
  SELECT 
    expired_bookings.id,
    expired_bookings.retreat_id,
    expired_bookings.full_name,
    expired_bookings.email
  FROM expired_bookings;
  
  -- Restore spots for cancelled bookings
  PERFORM increment_spots(retreat_id)
  FROM bookings
  WHERE 
    payment_status = 'cancelled'
    AND manual_payment_status IS NULL
    AND (booking_date < forty_eight_hours_ago OR created_at < forty_eight_hours_ago);
END;
$$ LANGUAGE plpgsql;

-- 5. Remove index on payment_rejection_date if it exists (no longer needed)
DROP INDEX IF EXISTS idx_bookings_payment_rejection_date;

-- 6. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'manual_payment_status';

-- 7. Show constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname LIKE '%manual_payment_status%';


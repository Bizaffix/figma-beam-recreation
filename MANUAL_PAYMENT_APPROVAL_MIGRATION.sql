-- Manual Payment Approval Feature Migration
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Add manual_payment_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'manual_payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN manual_payment_status TEXT 
      CHECK (manual_payment_status IN ('pending_approval', 'approved'));
    
    -- Set existing manual payments to 'approved' (grandfathered in)
    UPDATE bookings 
    SET manual_payment_status = 'approved'
    WHERE payment_status = 'paid_manual' AND manual_payment_status IS NULL;
  END IF;
END $$;

-- 2. Add payment_rejection_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_rejection_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_rejection_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 3. Create increment_spots function (if it doesn't exist)
CREATE OR REPLACE FUNCTION increment_spots(retreat_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET spots_available = LEAST(total_spots, spots_available + 1)
  WHERE id = retreat_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to check and cancel expired pending approvals
-- This can be called by a cron job or edge function
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

-- 5. Create index for faster queries on manual payment status
CREATE INDEX IF NOT EXISTS idx_bookings_manual_payment_status 
  ON bookings(manual_payment_status) 
  WHERE payment_status = 'paid_manual';

CREATE INDEX IF NOT EXISTS idx_bookings_booking_date_pending 
  ON bookings(booking_date, created_at) 
  WHERE manual_payment_status = 'pending_approval';

-- 6. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('manual_payment_status', 'payment_rejection_date')
ORDER BY column_name;

-- 7. Optional: Set up a cron job to run cancel_expired_pending_approvals() every hour
-- This can be done in Supabase Dashboard → Database → Cron Jobs
-- Schedule: 0 * * * * (every hour)
-- Command: SELECT cancel_expired_pending_approvals();


-- Fix Payment Status CHECK Constraint
-- Run this in Supabase SQL Editor to allow 'paid_manual' status
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Drop existing CHECK constraint on payment_status if it exists
DO $$
BEGIN
  -- Drop the constraint if it exists
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  
  -- Also try alternative constraint names that might exist
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_payment_status;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop constraint (may not exist or have different name): %', SQLERRM;
END $$;

-- 2. Add new CHECK constraint that includes all payment status values
DO $$
BEGIN
  -- Check if payment_status column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    -- Add CHECK constraint with all allowed values
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status IN (
      'deposit_paid',
      'fully_paid', 
      'paid_manual',
      'refunded',
      'cancelled'
    ));
    
    RAISE NOTICE 'CHECK constraint added successfully';
  ELSE
    RAISE NOTICE 'payment_status column does not exist. Run MANUAL_PAYMENT_MIGRATION.sql first.';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- 3. Verify the constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname LIKE '%payment_status%';

-- 4. Test that the constraint allows 'paid_manual (this will show an error if constraint is wrong)
-- Uncomment the line below to test (it should fail if constraint is incorrect)
-- INSERT INTO bookings (payment_status) VALUES ('paid_manual') ON CONFLICT DO NOTHING;


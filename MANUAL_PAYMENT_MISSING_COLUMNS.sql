-- Manual Payment Missing Columns Migration
-- Run this AFTER MANUAL_PAYMENT_APPROVAL_MIGRATION.sql
-- This adds the missing columns that are required for manual payment bookings
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Add payment_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status TEXT;
    
    -- Migrate existing data: set payment_status based on status
    UPDATE bookings 
    SET payment_status = CASE 
      WHEN status = 'confirmed' AND payment_intent_id NOT LIKE 'manual_%' THEN 'fully_paid'
      WHEN status = 'confirmed' AND payment_intent_id LIKE 'manual_%' THEN 'paid_manual'
      ELSE status
    END
    WHERE payment_status IS NULL;
  END IF;
END $$;

-- 1a. Fix CHECK constraint on payment_status to include 'paid_manual'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_payment_status;
  
  -- Add new constraint with all allowed values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    BEGIN
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_payment_status_check 
      CHECK (payment_status IN (
        'deposit_paid',
        'fully_paid', 
        'paid_manual',
        'refunded',
        'cancelled'
      ));
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists';
    END;
  END IF;
END $$;

-- 2. Make payment_intent_id nullable if it's not already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'payment_intent_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN payment_intent_id DROP NOT NULL;
    
    -- Try to remove unique constraint if it exists
    BEGIN
      ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_intent_id_key;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop unique constraint on payment_intent_id (may not exist)';
    END;
  END IF;
END $$;

-- 3. Add full_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'full_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN full_amount NUMERIC(10, 2);
    -- Set full_amount to amount for existing records
    UPDATE bookings SET full_amount = amount WHERE full_amount IS NULL AND amount IS NOT NULL;
  END IF;
END $$;

-- 4. Add deposit_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount NUMERIC(10, 2);
  END IF;
END $$;

-- 5. Add price_variant column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'price_variant'
  ) THEN
    ALTER TABLE bookings ADD COLUMN price_variant TEXT;
  END IF;
END $$;

-- 6. Add add_ons column if it doesn't exist (THIS IS THE ONE CAUSING YOUR ERROR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'add_ons'
  ) THEN
    ALTER TABLE bookings ADD COLUMN add_ons JSONB;
  END IF;
END $$;

-- 7. Add booking_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    -- Set booking_date to created_at for existing records
    UPDATE bookings SET booking_date = created_at WHERE booking_date IS NULL AND created_at IS NOT NULL;
  END IF;
END $$;

-- 8. Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN (
  'payment_status', 
  'payment_intent_id', 
  'full_amount', 
  'deposit_amount', 
  'price_variant', 
  'add_ons', 
  'booking_date',
  'manual_payment_status',
  'payment_rejection_date'
)
ORDER BY column_name;


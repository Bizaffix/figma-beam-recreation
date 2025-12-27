-- Manual Payment Feature Migration
-- Run this in Supabase SQL Editor to add support for manual payment status
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Check if payment_status column exists, if not add it
DO $$
BEGIN
  -- Check if payment_status column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    -- Add payment_status column
    ALTER TABLE bookings ADD COLUMN payment_status TEXT;
    
    -- Migrate existing data: set payment_status based on status
    -- If status is 'confirmed' and payment_intent_id doesn't start with 'manual_', set to 'fully_paid'
    -- Otherwise, keep as is or set to appropriate status
    UPDATE bookings 
    SET payment_status = CASE 
      WHEN status = 'confirmed' AND payment_intent_id NOT LIKE 'manual_%' THEN 'fully_paid'
      WHEN status = 'confirmed' AND payment_intent_id LIKE 'manual_%' THEN 'paid_manual'
      ELSE status
    END;
  END IF;
END $$;

-- 2. Make payment_intent_id nullable (for manual payments that don't have a Stripe payment intent)
DO $$
BEGIN
  -- Check if payment_intent_id is currently NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'payment_intent_id' 
    AND is_nullable = 'NO'
  ) THEN
    -- Make it nullable
    ALTER TABLE bookings ALTER COLUMN payment_intent_id DROP NOT NULL;
    
    -- Remove unique constraint if it exists (since manual payments might not have unique IDs)
    -- Note: This might fail if there are existing constraints, so we'll handle it gracefully
    BEGIN
      ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_intent_id_key;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop unique constraint on payment_intent_id (may not exist)';
    END;
  END IF;
END $$;

-- 3. Add full_amount and deposit_amount columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'full_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN full_amount NUMERIC(10, 2);
    -- Set full_amount to amount for existing records
    UPDATE bookings SET full_amount = amount WHERE full_amount IS NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount NUMERIC(10, 2);
  END IF;
END $$;

-- 4. Add price_variant and add_ons columns if they don't exist (for storing booking selections)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'price_variant'
  ) THEN
    ALTER TABLE bookings ADD COLUMN price_variant TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'add_ons'
  ) THEN
    ALTER TABLE bookings ADD COLUMN add_ons JSONB;
  END IF;
END $$;

-- 5. Add booking_date column if it doesn't exist (for tracking when booking was made)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    -- Set booking_date to created_at for existing records
    UPDATE bookings SET booking_date = created_at WHERE booking_date IS NULL;
  END IF;
END $$;

-- 6. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('payment_status', 'payment_intent_id', 'full_amount', 'deposit_amount', 'price_variant', 'add_ons', 'booking_date')
ORDER BY column_name;


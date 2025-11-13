-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Drop existing bookings table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS bookings CASCADE;

-- 2. Create bookings table with correct schema
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id INTEGER NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_intent_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_retreat_id ON bookings(retreat_id);

-- 3. Create decrement_spots function
CREATE OR REPLACE FUNCTION decrement_spots(retreat_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET spots_available = GREATEST(0, spots_available - 1)
  WHERE id = retreat_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (drop existing if any)
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Verify the function exists (optional - just to check)
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'decrement_spots';


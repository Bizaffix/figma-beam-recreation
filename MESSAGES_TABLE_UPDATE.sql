-- Messages Table Update Migration
-- Run this in Supabase SQL Editor to add missing columns for booking notifications
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Add receiver_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'receiver_email'
  ) THEN
    ALTER TABLE messages ADD COLUMN receiver_email TEXT;
  END IF;
END $$;

-- 2. Add message_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type TEXT;
    
    -- Set default message_type for existing records
    UPDATE messages 
    SET message_type = 'attendee_communication'
    WHERE message_type IS NULL;
  END IF;
END $$;

-- 3. Add related_id column if it doesn't exist (more generic than event_request_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN related_id UUID;
    
    -- Migrate existing data: copy event_request_id to related_id if event_request_id exists
    UPDATE messages 
    SET related_id = event_request_id::uuid
    WHERE related_id IS NULL AND event_request_id IS NOT NULL;
  END IF;
END $$;

-- 4. Make event_request_id nullable (since we now use related_id for bookings too)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'event_request_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE messages ALTER COLUMN event_request_id DROP NOT NULL;
  END IF;
END $$;

-- 4a. Make sender_id nullable (for system messages)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'sender_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
  END IF;
END $$;

-- 5. Update sender_role CHECK constraint to include 'system' and 'student'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check;
  
  -- Add new constraint with all allowed roles
  ALTER TABLE messages 
  ADD CONSTRAINT messages_sender_role_check 
  CHECK (sender_role IN ('instructor', 'location_owner', 'student', 'system'));
  
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- 6. Add CHECK constraint for message_type if it doesn't exist
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
  
  -- Add new constraint with all allowed message types
  ALTER TABLE messages 
  ADD CONSTRAINT messages_message_type_check 
  CHECK (message_type IN (
    'event_request',
    'retreat_question', 
    'attendee_communication',
    'venue_communication',
    'payment_rejection',
    'booking_cancelled'
  ));
  
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding message_type constraint: %', SQLERRM;
END $$;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_email 
  ON messages(receiver_email) 
  WHERE receiver_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_message_type 
  ON messages(message_type) 
  WHERE message_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_related_id 
  ON messages(related_id) 
  WHERE related_id IS NOT NULL;

-- 8. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('receiver_email', 'message_type', 'related_id', 'event_request_id', 'sender_role')
ORDER BY column_name;

-- 9. Show constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
AND (conname LIKE '%role%' OR conname LIKE '%message_type%');


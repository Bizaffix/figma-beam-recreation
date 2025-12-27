-- Quick Fix: Add receiver_email column to messages table
-- Run this in Supabase SQL Editor if you're getting the error:
-- "Could not find the 'receiver_email' column of 'messages' in the schema cache"

-- Add receiver_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'receiver_email'
  ) THEN
    ALTER TABLE messages ADD COLUMN receiver_email TEXT;
    RAISE NOTICE 'Added receiver_email column to messages table';
  ELSE
    RAISE NOTICE 'receiver_email column already exists';
  END IF;
END $$;

-- Add message_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type TEXT;
    RAISE NOTICE 'Added message_type column to messages table';
  ELSE
    RAISE NOTICE 'message_type column already exists';
  END IF;
END $$;

-- Add related_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN related_id UUID;
    RAISE NOTICE 'Added related_id column to messages table';
  ELSE
    RAISE NOTICE 'related_id column already exists';
  END IF;
END $$;

-- Make sender_id nullable if it's not already (for system messages)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'sender_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
    RAISE NOTICE 'Made sender_id nullable';
  ELSE
    RAISE NOTICE 'sender_id is already nullable or does not exist';
  END IF;
END $$;

-- Update sender_role CHECK constraint to include 'system' and 'student'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check;
  
  -- Add new constraint with all allowed roles
  ALTER TABLE messages 
  ADD CONSTRAINT messages_sender_role_check 
  CHECK (sender_role IN ('instructor', 'location_owner', 'student', 'system'));
  
  RAISE NOTICE 'Updated sender_role constraint';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- Add CHECK constraint for message_type
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
  
  RAISE NOTICE 'Added message_type constraint';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding message_type constraint: %', SQLERRM;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_email 
  ON messages(receiver_email) 
  WHERE receiver_email IS NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('receiver_email', 'message_type', 'related_id', 'sender_id', 'sender_role')
ORDER BY column_name;


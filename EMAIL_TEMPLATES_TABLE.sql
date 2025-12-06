-- Create email_templates table for saving email templates and drafts
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('template', 'draft')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  recipient_type TEXT CHECK (recipient_type IN ('students', 'instructors')),
  sections JSONB, -- Store email sections with message and images
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own templates and drafts
CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates and drafts
CREATE POLICY "Users can insert own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates and drafts
CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own templates and drafts
CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();


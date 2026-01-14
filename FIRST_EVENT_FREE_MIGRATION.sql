-- First Event Free Feature Migration
-- Run this in Supabase SQL Editor

-- Add first_event_free_eligible field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_event_free_eligible BOOLEAN DEFAULT false;

-- Add first_event_free_used field to track if they've used the benefit
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_event_free_used BOOLEAN DEFAULT false;

-- Add comment to explain the fields
COMMENT ON COLUMN public.profiles.first_event_free_eligible IS 'Set by admin to grant first event free benefit to organizer';
COMMENT ON COLUMN public.profiles.first_event_free_used IS 'Tracks if organizer has already used their first event free benefit';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_first_event_free_eligible 
ON public.profiles(first_event_free_eligible) 
WHERE first_event_free_eligible = true;

-- Add a feature flag/campaign for First Event Free
-- This will be a special campaign that controls if the feature is enabled globally
INSERT INTO public.affiliate_campaigns (
  name,
  description,
  target_type,
  conversion_event,
  active_commission_type,
  active_commission_value,
  active_commission_base,
  passive_commission_enabled,
  passive_commission_rate,
  passive_commission_duration_months,
  is_active,
  cookie_window_days
)
SELECT 
  'First Event Free Program',
  'Admin-controlled benefit: Grant organizers 100% platform fee waiver on their first event',
  'organizer',
  'first_event_published',
  'none',
  NULL,
  NULL,
  false,
  0,
  0,
  true, -- Enable by default, admin can toggle
  30
WHERE NOT EXISTS (
  SELECT 1 FROM public.affiliate_campaigns WHERE name = 'First Event Free Program'
);

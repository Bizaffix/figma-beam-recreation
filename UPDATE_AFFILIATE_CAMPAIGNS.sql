-- Update Affiliate Campaigns to match new structure
-- Run this in Supabase SQL Editor

-- 1. Pause/Disable Student Referral Program (students don't pay platform fees)
UPDATE public.affiliate_campaigns
SET 
  is_active = false,
  description = 'Refer students who book retreats (PAUSED - Students do not pay platform fees)'
WHERE name = 'Student Referral Program';

-- 2. Update Organizer Referral Program
-- Earn 20% of Event Fee for 1 year (passive commission)
UPDATE public.affiliate_campaigns
SET 
  name = 'Organizer Referral Program',
  description = 'Refer new organizers - Earn 20% of their Event Fee for 1 year',
  target_type = 'organizer',
  conversion_event = 'organizer_verified',
  active_commission_type = 'none', -- No one-time commission, only passive
  active_commission_value = NULL,
  active_commission_base = NULL,
  passive_commission_enabled = true,
  passive_commission_rate = 20.00, -- 20% of event fees
  passive_commission_duration_months = 12, -- 1 year
  passive_commission_events = ARRAY['event_published', 'booking_completed'], -- Events that trigger commission
  is_active = true,
  cookie_window_days = 30
WHERE name = 'Organizer Referral Program';

-- 3. Update Venue Referral Program
-- Get 20% of venue fees for one year
UPDATE public.affiliate_campaigns
SET 
  name = 'Venue Referral Program',
  description = 'Refer new Venue Hosts and get 20% of their venue fees for one year',
  target_type = 'venue',
  conversion_event = 'venue_activated',
  active_commission_type = 'none', -- No one-time commission, only passive
  active_commission_value = NULL,
  active_commission_base = NULL,
  passive_commission_enabled = true,
  passive_commission_rate = 20.00, -- 20% of venue fees
  passive_commission_duration_months = 12, -- 1 year
  passive_commission_events = ARRAY['venue_booking', 'event_at_venue'], -- Events that trigger commission
  is_active = true,
  cookie_window_days = 30
WHERE name = 'Venue Referral Program';

-- If campaigns don't exist, create them
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
  passive_commission_events,
  is_active,
  cookie_window_days
)
SELECT 
  'Student Referral Program',
  'Refer students who book retreats (PAUSED - Students do not pay platform fees)',
  'student',
  'completed_booking',
  'percentage',
  20.00,
  'platform_fee',
  false,
  0,
  12,
  ARRAY[]::text[],
  false, -- PAUSED
  30
WHERE NOT EXISTS (
  SELECT 1 FROM public.affiliate_campaigns WHERE name = 'Student Referral Program'
);

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
  passive_commission_events,
  is_active,
  cookie_window_days
)
SELECT 
  'Organizer Referral Program',
  'Refer new organizers - Earn 20% of their Event Fee for 1 year',
  'organizer',
  'organizer_verified',
  'none',
  NULL,
  NULL,
  true,
  20.00,
  12,
  ARRAY['event_published', 'booking_completed'],
  true,
  30
WHERE NOT EXISTS (
  SELECT 1 FROM public.affiliate_campaigns WHERE name = 'Organizer Referral Program'
);

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
  passive_commission_events,
  is_active,
  cookie_window_days
)
SELECT 
  'Venue Referral Program',
  'Refer new Venue Hosts and get 20% of their venue fees for one year',
  'venue',
  'venue_activated',
  'none',
  NULL,
  NULL,
  true,
  20.00,
  12,
  ARRAY['venue_booking', 'event_at_venue'],
  true,
  30
WHERE NOT EXISTS (
  SELECT 1 FROM public.affiliate_campaigns WHERE name = 'Venue Referral Program'
);

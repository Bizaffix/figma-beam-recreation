-- Passive Commission Calculation and Creation Functions
-- Run this in Supabase SQL Editor

-- Function to calculate passive commission
CREATE OR REPLACE FUNCTION public.calculate_passive_commission(
  p_campaign_id UUID,
  p_affiliate_id UUID,
  p_transaction_amount NUMERIC,
  p_platform_fee NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
  v_passive_rate NUMERIC;
  v_commission_base TEXT;
  v_custom_rate NUMERIC;
  v_result NUMERIC;
  v_campaign RECORD;
BEGIN
  -- Get campaign details
  SELECT 
    passive_commission_enabled,
    passive_commission_rate,
    active_commission_base,
    passive_commission_duration_months
  INTO v_campaign
  FROM public.affiliate_campaigns
  WHERE id = p_campaign_id;

  -- Check if passive commission is enabled
  IF NOT v_campaign.passive_commission_enabled THEN
    RETURN 0;
  END IF;

  -- Check for custom passive commission rate
  SELECT custom_passive_commission_rate
  INTO v_custom_rate
  FROM public.affiliate_campaign_assignments
  WHERE affiliate_id = p_affiliate_id AND campaign_id = p_campaign_id;

  -- Use custom rate or campaign default
  v_passive_rate := COALESCE(v_custom_rate, v_campaign.passive_commission_rate, 0);

  IF v_passive_rate <= 0 THEN
    RETURN 0;
  END IF;

  -- Calculate commission based on base (platform_fee or transaction_amount)
  -- For organizer referrals: 20% of event fee (transaction amount)
  -- For venue referrals: 20% of venue fees (platform fee or transaction amount)
  v_commission_base := COALESCE(v_campaign.active_commission_base, 'transaction_amount');
  
  IF v_commission_base = 'platform_fee' THEN
    v_result := (p_platform_fee * v_passive_rate / 100);
  ELSE
    v_result := (p_transaction_amount * v_passive_rate / 100);
  END IF;

  RETURN COALESCE(v_result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if referral is still within passive commission duration
CREATE OR REPLACE FUNCTION public.is_within_passive_commission_window(
  p_referral_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral RECORD;
  v_campaign RECORD;
  v_months_elapsed INTEGER;
BEGIN
  -- Get referral and campaign details
  SELECT 
    r.converted_at,
    r.campaign_id
  INTO v_referral
  FROM public.affiliate_referrals r
  WHERE r.id = p_referral_id AND r.converted = true;

  IF v_referral.converted_at IS NULL THEN
    RETURN false;
  END IF;

  SELECT passive_commission_duration_months
  INTO v_campaign
  FROM public.affiliate_campaigns
  WHERE id = v_referral.campaign_id;

  IF v_campaign.passive_commission_duration_months IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate months elapsed since conversion
  v_months_elapsed := EXTRACT(EPOCH FROM (NOW() - v_referral.converted_at)) / 2592000; -- 30 days per month

  RETURN v_months_elapsed < v_campaign.passive_commission_duration_months;
END;
$$ LANGUAGE plpgsql;

-- Function to create passive commission
-- Call this when events are published or bookings are completed
CREATE OR REPLACE FUNCTION public.create_passive_commission(
  p_referral_id UUID,
  p_event_type TEXT, -- 'event_published', 'booking_completed', 'venue_booking', 'event_at_venue'
  p_transaction_amount NUMERIC,
  p_platform_fee NUMERIC DEFAULT 0,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_referral RECORD;
  v_campaign RECORD;
  v_commission_amount NUMERIC;
  v_commission_id UUID;
BEGIN
  -- Get referral details
  SELECT 
    r.*,
    c.passive_commission_enabled,
    c.passive_commission_events
  INTO v_referral
  FROM public.affiliate_referrals r
  JOIN public.affiliate_campaigns c ON c.id = r.campaign_id
  WHERE r.id = p_referral_id;

  -- Check if referral exists and is converted
  IF v_referral.id IS NULL OR NOT v_referral.converted THEN
    RETURN NULL;
  END IF;

  -- Check if passive commission is enabled
  IF NOT v_referral.passive_commission_enabled THEN
    RETURN NULL;
  END IF;

  -- Check if this event type triggers passive commission
  IF NOT (p_event_type = ANY(v_referral.passive_commission_events)) THEN
    RETURN NULL;
  END IF;

  -- Check if still within commission window
  IF NOT public.is_within_passive_commission_window(p_referral_id) THEN
    RETURN NULL;
  END IF;

  -- Calculate passive commission
  v_commission_amount := public.calculate_passive_commission(
    v_referral.campaign_id,
    v_referral.affiliate_id,
    p_transaction_amount,
    p_platform_fee
  );

  IF v_commission_amount <= 0 THEN
    RETURN NULL;
  END IF;

  -- Create passive commission record
  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    referral_id,
    campaign_id,
    commission_type,
    amount,
    transaction_id,
    transaction_amount,
    platform_fee,
    status
  )
  VALUES (
    v_referral.affiliate_id,
    p_referral_id,
    v_referral.campaign_id,
    'passive',
    v_commission_amount,
    p_transaction_id,
    p_transaction_amount,
    p_platform_fee,
    'pending'
  )
  RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Affiliate Program Manager Database Schema
-- Run this in Supabase SQL Editor

-- 1. Affiliates Table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('content_creator', 'organizer_partner', 'venue_partner', 'other')),
  payout_method TEXT CHECK (payout_method IN ('stripe_connect', 'paypal', 'bank_transfer', 'manual')),
  payout_details JSONB DEFAULT '{}', -- Store Stripe Connect ID, PayPal email, bank details, etc.
  tax_info_status TEXT DEFAULT 'pending' CHECK (tax_info_status IN ('pending', 'submitted', 'verified', 'not_required')),
  tax_info JSONB DEFAULT '{}', -- Store W-9, tax ID, etc.
  country TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT affiliates_user_id_unique UNIQUE (user_id)
);

-- 2. Campaigns/Programs Table
CREATE TABLE IF NOT EXISTS public.affiliate_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('student', 'organizer', 'venue')),
  
  -- Conversion Event Configuration
  conversion_event TEXT NOT NULL, -- e.g., 'completed_booking', 'organizer_verified', 'venue_activated'
  
  -- Active Commission (one-time)
  active_commission_type TEXT CHECK (active_commission_type IN ('fixed', 'percentage', 'none')),
  active_commission_value NUMERIC(10, 2), -- Fixed amount or percentage (0-100)
  active_commission_base TEXT, -- 'transaction_amount', 'platform_fee', 'first_transaction'
  
  -- Passive/Recurring Commission
  passive_commission_enabled BOOLEAN DEFAULT false,
  passive_commission_rate NUMERIC(5, 2), -- Percentage (0-100)
  passive_commission_duration_months INTEGER, -- Duration in months
  passive_commission_max_lifetime_value NUMERIC(10, 2), -- Optional cap
  passive_commission_events TEXT[] DEFAULT '{}', -- Events that trigger passive commission
  
  -- Attribution & Tracking
  cookie_window_days INTEGER DEFAULT 30,
  attribution_model TEXT DEFAULT 'last_click' CHECK (attribution_model IN ('last_click', 'first_click')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Affiliate Links Table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.affiliate_campaigns(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL UNIQUE, -- Unique tracking code
  base_url TEXT NOT NULL, -- Base URL for the link
  full_url TEXT NOT NULL, -- Full tracking URL
  coupon_code TEXT, -- Optional coupon code tied to this link
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT affiliate_links_affiliate_campaign_unique UNIQUE (affiliate_id, campaign_id)
);

-- 4. Affiliate-Campaign Assignments (for custom commission rates)
CREATE TABLE IF NOT EXISTS public.affiliate_campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.affiliate_campaigns(id) ON DELETE CASCADE,
  
  -- Override commission rates (optional, uses campaign defaults if null)
  custom_active_commission_type TEXT CHECK (custom_active_commission_type IN ('fixed', 'percentage', 'none')),
  custom_active_commission_value NUMERIC(10, 2),
  custom_passive_commission_rate NUMERIC(5, 2),
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT affiliate_campaign_assignments_unique UNIQUE (affiliate_id, campaign_id)
);

-- 5. Referrals Table (tracks who referred whom)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.affiliate_campaigns(id) ON DELETE CASCADE,
  affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  
  -- Referred Entity
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For students/organizers
  referred_venue_id UUID, -- For venues (references properties.id)
  referral_type TEXT NOT NULL CHECK (referral_type IN ('student', 'organizer', 'venue')),
  
  -- Attribution
  attribution_method TEXT DEFAULT 'link' CHECK (attribution_method IN ('link', 'code', 'manual')),
  cookie_data JSONB, -- Store cookie/URL parameter data for audit
  
  -- Conversion Tracking
  converted BOOLEAN DEFAULT false,
  conversion_event_id TEXT, -- ID of the event that triggered conversion (booking_id, etc.)
  conversion_event_type TEXT, -- 'booking', 'organizer_verified', 'venue_activated'
  converted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Commissions Table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.affiliate_campaigns(id) ON DELETE CASCADE,
  
  -- Commission Details
  commission_type TEXT NOT NULL CHECK (commission_type IN ('active', 'passive')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Transaction Context
  transaction_id TEXT, -- Booking ID, organizer ID, venue ID, etc.
  transaction_amount NUMERIC(10, 2), -- Original transaction amount
  platform_fee NUMERIC(10, 2), -- Platform fee if applicable
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'void', 'disputed', 'on_hold')),
  
  -- Payout
  payout_id UUID, -- References affiliate_payouts.id when paid
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 7. Payouts Table
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  
  -- Amount
  total_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payout Method
  payout_method TEXT NOT NULL CHECK (payout_method IN ('stripe_connect', 'paypal', 'bank_transfer', 'manual')),
  payout_details JSONB DEFAULT '{}', -- Store transaction IDs, payment references, etc.
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'confirmed', 'failed')),
  
  -- Dates
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Link Clicks Tracking (for analytics)
CREATE TABLE IF NOT EXISTS public.affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON public.affiliate_links(link_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate ON public.affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user ON public.affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_converted ON public.affiliate_referrals(converted);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral ON public.affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_clicks_link ON public.affiliate_link_clicks(affiliate_link_id);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can do everything
CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage campaigns"
  ON public.affiliate_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage affiliate links"
  ON public.affiliate_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage campaign assignments"
  ON public.affiliate_campaign_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create referrals"
  ON public.affiliate_referrals FOR INSERT
  WITH CHECK (true); -- Allow system/service role to create referrals

CREATE POLICY "Admins can manage commissions"
  ON public.affiliate_commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payouts"
  ON public.affiliate_payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can track link clicks"
  ON public.affiliate_link_clicks FOR INSERT
  WITH CHECK (true);

-- Functions for automatic commission calculation
CREATE OR REPLACE FUNCTION public.calculate_active_commission(
  p_campaign_id UUID,
  p_affiliate_id UUID,
  p_transaction_amount NUMERIC,
  p_platform_fee NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
  v_commission_type TEXT;
  v_commission_value NUMERIC;
  v_commission_base TEXT;
  v_custom_type TEXT;
  v_custom_value NUMERIC;
  v_result NUMERIC;
BEGIN
  -- Check for custom commission override
  SELECT custom_active_commission_type, custom_active_commission_value
  INTO v_custom_type, v_custom_value
  FROM public.affiliate_campaign_assignments
  WHERE affiliate_id = p_affiliate_id AND campaign_id = p_campaign_id;
  
  -- Use custom or campaign default
  IF v_custom_type IS NOT NULL THEN
    v_commission_type := v_custom_type;
    v_commission_value := v_custom_value;
  ELSE
    SELECT active_commission_type, active_commission_value, active_commission_base
    INTO v_commission_type, v_commission_value, v_commission_base
    FROM public.affiliate_campaigns
    WHERE id = p_campaign_id;
  END IF;
  
  -- Calculate commission
  IF v_commission_type = 'fixed' THEN
    v_result := v_commission_value;
  ELSIF v_commission_type = 'percentage' THEN
    IF v_commission_base = 'platform_fee' THEN
      v_result := (p_platform_fee * v_commission_value / 100);
    ELSE
      v_result := (p_transaction_amount * v_commission_value / 100);
    END IF;
  ELSE
    v_result := 0;
  END IF;
  
  RETURN COALESCE(v_result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment affiliate link clicks
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.affiliate_links
  SET clicks = clicks + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_campaigns_updated_at
  BEFORE UPDATE ON public.affiliate_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at
  BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at
  BEFORE UPDATE ON public.affiliate_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default campaigns
INSERT INTO public.affiliate_campaigns (name, description, target_type, conversion_event, active_commission_type, active_commission_value, active_commission_base, cookie_window_days)
VALUES
  ('Student Referral Program', 'Refer students who book retreats', 'student', 'completed_booking', 'percentage', 20.00, 'platform_fee', 30),
  ('Organizer Referral Program', 'Refer new organizers who onboard', 'organizer', 'organizer_verified', 'fixed', 50.00, 'transaction_amount', 30),
  ('Venue Referral Program', 'Refer new venues that activate', 'venue', 'venue_activated', 'fixed', 25.00, 'transaction_amount', 30)
ON CONFLICT DO NOTHING;


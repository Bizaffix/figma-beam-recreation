-- Platform Settings Migration
-- Run this in Supabase SQL Editor
-- Stores configurable fee rates for the business model (admin-controlled, not hardcoded)

-- 1. Create platform_settings table (single row for global settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Instructor/Organizer platform fee (% of gross booking revenue)
  -- Default 12.4% - deducted from organizer payouts
  platform_fee_rate_instructor NUMERIC(5, 2) NOT NULL DEFAULT 12.4,
  
  -- Venue/Host platform fee (% of venue fees if applicable)
  -- Default 0 - venues currently pass through; can enable for future
  platform_fee_rate_venue NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Optional: minimum platform fee in dollars (0 = none)
  platform_fee_min NUMERIC(10, 2) DEFAULT 0,
  
  -- Optional: maximum platform fee in dollars (0 = no cap)
  platform_fee_max NUMERIC(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default row if empty
INSERT INTO public.platform_settings (platform_fee_rate_instructor, platform_fee_rate_venue)
SELECT 12.4, 0
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings LIMIT 1);

-- 3. Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Everyone can read (needed for fee calculations), only admins can update
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins need INSERT for initial setup (only if no row exists)
CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- 5. Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_settings_updated_at();

COMMENT ON TABLE public.platform_settings IS 'Admin-configurable business model settings: platform fee rates for instructors and venue hosts';

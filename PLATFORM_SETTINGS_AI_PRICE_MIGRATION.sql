-- Add admin-configurable QuiltMatch AI monthly price
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS ai_subscription_monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 3.99;

-- Ensure existing rows get a value
UPDATE public.platform_settings
SET ai_subscription_monthly_price = 3.99
WHERE ai_subscription_monthly_price IS NULL;


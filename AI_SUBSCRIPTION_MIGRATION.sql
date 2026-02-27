-- QuiltMatch AI subscription columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS ai_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_subscription_price_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_stripe_customer_id TEXT;

-- Keep status values constrained
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_ai_subscription_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_ai_subscription_status_check
      CHECK (ai_subscription_status IN ('inactive', 'active', 'past_due', 'canceled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_ai_subscription_status
  ON profiles (ai_subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_ai_stripe_customer_id
  ON profiles (ai_stripe_customer_id);


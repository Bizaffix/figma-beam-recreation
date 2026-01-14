-- Auto-create affiliate records for venue managers (location_owners)
-- This ensures every venue manager automatically gets an affiliate account

-- Function to create affiliate record for venue managers
CREATE OR REPLACE FUNCTION public.auto_create_venue_manager_affiliate()
RETURNS TRIGGER AS $$
DECLARE
  v_profile RECORD;
  v_organizer_campaign_id UUID;
  v_affiliate_id UUID;
  v_link_code TEXT;
  v_base_url TEXT;
  v_full_url TEXT;
  v_user_role TEXT;
BEGIN
  -- Determine role based on which table the trigger fired from
  -- If trigger is on auth.users, check raw_user_meta_data
  -- If trigger is on profiles, check role column directly
  IF TG_TABLE_NAME = 'users' THEN
    v_user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    v_user_role := COALESCE(NEW.role, 'student');
  ELSE
    RETURN NEW;
  END IF;

  -- Only process location_owner role
  IF v_user_role != 'location_owner' THEN
    RETURN NEW;
  END IF;

  -- Get profile data
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = NEW.id AND role = 'location_owner';

  -- If profile doesn't exist yet, wait for it (trigger will run after profile creation)
  IF v_profile IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if affiliate already exists
  IF EXISTS (SELECT 1 FROM public.affiliates WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Create affiliate record
  INSERT INTO public.affiliates (
    user_id,
    name,
    email,
    affiliate_type,
    status,
    payout_method
  )
  VALUES (
    NEW.id,
    COALESCE(v_profile.full_name, v_profile.first_name || ' ' || v_profile.last_name, 'Venue Manager'),
    COALESCE(v_profile.email, NEW.email),
    'venue_partner',
    'approved', -- Auto-approve venue managers
    'manual' -- Default payout method
  )
  RETURNING id INTO v_affiliate_id;

  -- Find the "Organizer Referral Program" campaign
  SELECT id INTO v_organizer_campaign_id
  FROM public.affiliate_campaigns
  WHERE target_type = 'organizer'
    AND conversion_event = 'organizer_verified'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If campaign exists, create affiliate link
  IF v_organizer_campaign_id IS NOT NULL THEN
    v_link_code := 'ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    v_base_url := 'https://bookmyquiltretreat.com'; -- Update with your actual domain
    v_full_url := v_base_url || '?ref=' || v_link_code;

    INSERT INTO public.affiliate_links (
      affiliate_id,
      campaign_id,
      link_code,
      base_url,
      full_url
    )
    VALUES (
      v_affiliate_id,
      v_organizer_campaign_id,
      v_link_code,
      v_base_url,
      v_full_url
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create affiliate when venue manager profile is created/updated
DROP TRIGGER IF EXISTS auto_create_venue_manager_affiliate_trigger ON public.profiles;
CREATE TRIGGER auto_create_venue_manager_affiliate_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'location_owner')
  EXECUTE FUNCTION public.auto_create_venue_manager_affiliate();

-- Also create trigger on auth.users to catch new signups
DROP TRIGGER IF EXISTS auto_create_venue_manager_affiliate_auth_trigger ON auth.users;
CREATE TRIGGER auto_create_venue_manager_affiliate_auth_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'role' = 'location_owner')
  EXECUTE FUNCTION public.auto_create_venue_manager_affiliate();

-- Backfill: Create affiliate records for existing venue managers
INSERT INTO public.affiliates (
  user_id,
  name,
  email,
  affiliate_type,
  status,
  payout_method
)
SELECT 
  p.id,
  COALESCE(p.full_name, p.first_name || ' ' || p.last_name, 'Venue Manager'),
  p.email,
  'venue_partner',
  'approved',
  'manual'
FROM public.profiles p
WHERE p.role = 'location_owner'
  AND NOT EXISTS (
    SELECT 1 FROM public.affiliates a WHERE a.user_id = p.id
  );

-- Backfill: Create affiliate links for existing venue manager affiliates
DO $$
DECLARE
  v_organizer_campaign_id UUID;
  v_affiliate RECORD;
  v_link_code TEXT;
  v_base_url TEXT := 'https://bookmyquiltretreat.com'; -- Update with your actual domain
  v_full_url TEXT;
BEGIN
  -- Find the "Organizer Referral Program" campaign
  SELECT id INTO v_organizer_campaign_id
  FROM public.affiliate_campaigns
  WHERE target_type = 'organizer'
    AND conversion_event = 'organizer_verified'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_organizer_campaign_id IS NOT NULL THEN
    -- Create links for venue manager affiliates who don't have one for this campaign
    FOR v_affiliate IN
      SELECT a.id
      FROM public.affiliates a
      WHERE a.affiliate_type = 'venue_partner'
        AND a.status = 'approved'
        AND NOT EXISTS (
          SELECT 1 FROM public.affiliate_links al
          WHERE al.affiliate_id = a.id
            AND al.campaign_id = v_organizer_campaign_id
        )
    LOOP
      v_link_code := 'ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
      v_full_url := v_base_url || '?ref=' || v_link_code;

      INSERT INTO public.affiliate_links (
        affiliate_id,
        campaign_id,
        link_code,
        base_url,
        full_url
      )
      VALUES (
        v_affiliate.id,
        v_organizer_campaign_id,
        v_link_code,
        v_base_url,
        v_full_url
      );
    END LOOP;
  END IF;
END $$;

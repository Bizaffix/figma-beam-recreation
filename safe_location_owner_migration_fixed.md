-- Safe Migration for Location Owner System
-- This script ensures no disturbance to existing data and adds proper RLS policies

-- 1. First, safely update the role constraint without breaking existing data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_role_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
        
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('student', 'instructor', 'admin', 'location_owner'));
    END IF;
END $$;

-- 2. Add missing columns to profiles table safely
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instructor_mode_settings jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS instructor_mode_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS property_name text;

-- 3. Create properties table with proper structure and RLS enabled
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  
  -- Step 1: Owner Goals
  primary_goal text DEFAULT '',
  risk_preference integer DEFAULT 50,
  booking_control text DEFAULT '',
  
  -- Step 2: Property Snapshot
  property_name text NOT NULL,
  location text NOT NULL,
  sleeps integer NOT NULL,
  max_quilters integer NOT NULL,
  property_type text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'draft',
  views integer DEFAULT 0,
  saves integer DEFAULT 0,
  inquiries integer DEFAULT 0,
  base_pricing jsonb DEFAULT '{}',
  stay_types text[] DEFAULT '{}',
  
  -- Step 3: Quilter-Centric Setup
  dedicated_sewing_room boolean DEFAULT false,
  max_sewing_stations integer DEFAULT 8,
  outlets_near_stations boolean DEFAULT false,
  iron_support boolean DEFAULT false,
  cutting_stations integer DEFAULT 2,
  pressing_stations integer DEFAULT 2,
  irons_provided boolean DEFAULT false,
  design_walls text DEFAULT '',
  quiet_hours text DEFAULT '',
  natural_light text DEFAULT '',
  accessibility boolean DEFAULT false,
  
  -- Step 4: Revenue & Rules
  supported_formats text[] DEFAULT '{}',
  pricing jsonb DEFAULT '{}',
  min_notice integer DEFAULT 7,
  min_group_size integer DEFAULT 4,
  max_group_size integer DEFAULT 12,
  house_rules text[] DEFAULT '{}',
  blocked_dates text[] DEFAULT '{}',
  availability_calendar text[] DEFAULT '{}',
  
  -- Step 5: Visual Story
  photos text[] DEFAULT '{}',
  headline text DEFAULT '',
  description text DEFAULT '',
  
  -- Step 6: Verification
  verified boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT properties_status_check CHECK (status IN ('draft', 'published', 'verified')),
  CONSTRAINT properties_plan_check CHECK (plan IN ('free', 'plus', 'pro'))
);

-- 4. Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Users can only access their own properties
CREATE POLICY "Users can view their own properties" ON public.properties
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

-- 5. Create event_requests table with RLS
CREATE TABLE IF NOT EXISTS public.event_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_title text NOT NULL,
  instructor_name text NOT NULL,
  property_name text NOT NULL,
  instructor_id uuid NOT NULL,
  property_id uuid NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  expected_headcount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  basic_schedule jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_requests_pkey PRIMARY KEY (id),
  CONSTRAINT event_requests_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT event_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE,
  CONSTRAINT event_requests_status_check CHECK (status IN ('pending', 'approved', 'declined'))
);

-- Enable RLS on event_requests
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- 6. Create messages table with RLS
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_request_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_event_request_id_fkey FOREIGN KEY (event_request_id) REFERENCES public.event_requests(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('instructor', 'location_owner'))
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Create event_co_hosts table with RLS
CREATE TABLE IF NOT EXISTS public.event_co_hosts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'location_owner',
  permissions jsonb DEFAULT '{}',
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_co_hosts_pkey PRIMARY KEY (id),
  CONSTRAINT event_co_hosts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_requests(id) ON DELETE CASCADE,
  CONSTRAINT event_co_hosts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT event_co_hosts_role_check CHECK (role = 'location_owner')
);

-- Enable RLS on event_co_hosts
ALTER TABLE public.event_co_hosts ENABLE ROW LEVEL SECURITY;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties USING btree (status);
CREATE INDEX IF NOT EXISTS idx_event_requests_property_id ON public.event_requests USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_instructor_id ON public.event_requests USING btree (instructor_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON public.event_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_messages_event_request_id ON public.messages USING btree (event_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_event_co_hosts_event_id ON public.event_co_hosts USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_event_co_hosts_user_id ON public.event_co_hosts USING btree (user_id);

-- 9. Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers only if they don't exist
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_requests_updated_at ON public.event_requests;
CREATE TRIGGER update_event_requests_updated_at BEFORE UPDATE ON public.event_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Update the trigger function to handle location_owner role safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, role, first_name, last_name, bio, property_name, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'instructor' THEN COALESCE(NEW.raw_user_meta_data->>'bio', '')
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'location_owner' THEN COALESCE(NEW.raw_user_meta_data->>'property_name', '')
      ELSE NULL
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    property_name = COALESCE(EXCLUDED.property_name, profiles.property_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Ensure the trigger exists and is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Update any existing users who might have location_owner role but no profile
INSERT INTO public.profiles (id, email, role, first_name, last_name, property_name, updated_at)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as role,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(au.raw_user_meta_data->>'property_name', '') as property_name,
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND au.raw_user_meta_data->>'role' = 'location_owner'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  property_name = EXCLUDED.property_name,
  updated_at = NOW();

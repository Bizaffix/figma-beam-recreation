-- Fix RLS Policies for Affiliates Table
-- Run this in Supabase SQL Editor
-- This allows venue managers to view their own affiliate records

-- Drop existing policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;

-- Recreate admin policy
CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow venue managers (location_owners) to view their own affiliate record
CREATE POLICY "Venue managers can view own affiliate"
  ON public.affiliates FOR SELECT
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'location_owner'
    )
  );

-- Allow venue managers to update their own affiliate record (for payout details, etc.)
CREATE POLICY "Venue managers can update own affiliate"
  ON public.affiliates FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'location_owner'
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'location_owner'
    )
  );

-- Also allow venue managers to view their own affiliate links
CREATE POLICY "Venue managers can view own affiliate links"
  ON public.affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = affiliate_links.affiliate_id
        AND a.user_id = auth.uid()
        AND p.role = 'location_owner'
    )
  );

-- Allow venue managers to view their own referrals
CREATE POLICY "Venue managers can view own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = affiliate_referrals.affiliate_id
        AND a.user_id = auth.uid()
        AND p.role = 'location_owner'
    )
  );

-- Allow venue managers to view their own commissions
CREATE POLICY "Venue managers can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = affiliate_commissions.affiliate_id
        AND a.user_id = auth.uid()
        AND p.role = 'location_owner'
    )
  );

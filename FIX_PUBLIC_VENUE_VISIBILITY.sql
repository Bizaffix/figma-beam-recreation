-- Fix RLS policy to allow PUBLIC (unauthenticated) users to view published venues
-- This allows anyone browsing the directory to see published and verified venues

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Properties access policy" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;

-- Create a comprehensive SELECT policy that allows:
-- 1. Users to view their own properties (all statuses)
-- 2. ANYONE (including unauthenticated users) to view published and verified properties
-- 3. Instructors to view published and verified properties from other owners
-- 4. Admins to view all properties
CREATE POLICY "Properties access policy" ON public.properties
    FOR SELECT USING (
        -- Users can always view their own properties (any status)
        auth.uid() = owner_id
        OR
        -- ANYONE (including unauthenticated users) can view published and verified properties
        status IN ('published', 'verified')
        OR
        -- Admins can view all properties
        (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        )
    );

-- Keep the existing policies for INSERT, UPDATE, DELETE as they are appropriate
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Users can insert their own properties
CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own properties  
CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own properties
CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

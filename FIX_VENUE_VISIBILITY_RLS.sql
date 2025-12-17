-- Fix RLS policy to allow instructors to view published venues
-- This policy allows instructors to see published and verified venues from other location owners

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Properties access policy" ON public.properties;

-- Create a more comprehensive SELECT policy that allows:
-- 1. Users to view their own properties (all statuses)
-- 2. Instructors to view published and verified properties from other owners
-- 3. Admins to view all properties
CREATE POLICY "Properties access policy" ON public.properties
    FOR SELECT USING (
        -- Users can always view their own properties
        auth.uid() = owner_id
        OR
        -- Instructors can view published and verified properties from any owner
        (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role = 'instructor'
            )
            AND status IN ('published', 'verified')
        )
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
-- Users can insert their own properties
CREATE POLICY IF NOT EXISTS "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own properties  
CREATE POLICY IF NOT EXISTS "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own properties
CREATE POLICY IF NOT EXISTS "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

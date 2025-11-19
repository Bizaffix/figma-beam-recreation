-- Update Storage Policies to Allow Students to Upload Profile Images
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- First, drop the existing instructor-only policies
DROP POLICY IF EXISTS "Instructors can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can delete own images" ON storage.objects;

-- Create a new policy that allows both students and instructors to upload profile images
-- This checks if the path starts with 'profiles/'
CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-images' AND
  name LIKE 'profiles/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Create a separate policy for instructors to upload retreat images
-- This checks if the path starts with 'retreats/'
CREATE POLICY "Instructors can upload retreat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-images' AND
  name LIKE 'retreats/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Update policy: Allow both students and instructors to update their profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE 'profiles/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Create a separate policy for instructors to update retreat images
CREATE POLICY "Instructors can update own retreat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE 'retreats/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Delete policy: Allow both students and instructors to delete their profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE 'profiles/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Create a separate policy for instructors to delete retreat images
CREATE POLICY "Instructors can delete own retreat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE 'retreats/%' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);


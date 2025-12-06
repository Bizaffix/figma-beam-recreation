-- Storage Policies for Admin Email Images
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- This allows admins to upload images for email notifications

-- ============================================
-- ADMIN EMAIL IMAGES POLICIES
-- ============================================
-- These policies allow admins to upload, update, and delete email images
-- Images are stored in the 'retreat-images' bucket under 'email-images/' path

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload email images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update own email images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete own email images" ON storage.objects;

-- Allow admins to upload email images
-- Path format: {user_id}/email-images/{timestamp}.{ext}
CREATE POLICY "Admins can upload email images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-images' AND
  name LIKE (auth.uid()::text || '/email-images/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update their own email images
CREATE POLICY "Admins can update own email images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE (auth.uid()::text || '/email-images/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete their own email images
CREATE POLICY "Admins can delete own email images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  name LIKE (auth.uid()::text || '/email-images/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Note: Public read access is already covered by the existing "Anyone can view images" policy
-- for the retreat-images bucket, so admins' email images will be publicly accessible via URL


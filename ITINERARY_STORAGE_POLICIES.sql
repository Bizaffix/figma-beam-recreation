-- Storage Policies for Itinerary Builder and Location Images
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- ============================================
-- IMPORTANT: CREATE BUCKETS FIRST
-- ============================================
-- Before running this script, create these buckets in Supabase Dashboard → Storage:
-- 1. retreat-patterns (Public bucket)
-- 2. retreat-project-images (Public bucket)
-- 3. retreat-location-images (Public bucket)

-- ============================================
-- RETREAT PATTERNS BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructors can upload patterns" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view patterns" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update own patterns" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can delete own patterns" ON storage.objects;

-- Allow instructors to upload pattern files (PDFs)
CREATE POLICY "Instructors can upload patterns"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-patterns' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow public to view pattern files
CREATE POLICY "Anyone can view patterns"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-patterns');

-- Allow instructors to update their own pattern files
CREATE POLICY "Instructors can update own patterns"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-patterns' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow instructors to delete their own pattern files
CREATE POLICY "Instructors can delete own patterns"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-patterns' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- ============================================
-- RETREAT PROJECT IMAGES BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructors can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update own project images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can delete own project images" ON storage.objects;

-- Allow instructors to upload project images
CREATE POLICY "Instructors can upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-project-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow public to view project images
CREATE POLICY "Anyone can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-project-images');

-- Allow instructors to update their own project images
CREATE POLICY "Instructors can update own project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-project-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow instructors to delete their own project images
CREATE POLICY "Instructors can delete own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-project-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- ============================================
-- RETREAT LOCATION IMAGES BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructors can upload location images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view location images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update own location images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can delete own location images" ON storage.objects;

-- Allow instructors to upload location images
CREATE POLICY "Instructors can upload location images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-location-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow public to view location images
CREATE POLICY "Anyone can view location images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-location-images');

-- Allow instructors to update their own location images
CREATE POLICY "Instructors can update own location images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-location-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- Allow instructors to delete their own location images
CREATE POLICY "Instructors can delete own location images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-location-images' AND
  name LIKE (auth.uid()::text || '/%') AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

-- ============================================
-- VERIFY POLICIES (OPTIONAL)
-- ============================================

-- Check all policies for storage.objects
-- You can run this separately to verify the policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname IN (
    'Instructors can upload patterns',
    'Anyone can view patterns',
    'Instructors can update own patterns',
    'Instructors can delete own patterns',
    'Instructors can upload project images',
    'Anyone can view project images',
    'Instructors can update own project images',
    'Instructors can delete own project images',
    'Instructors can upload location images',
    'Anyone can view location images',
    'Instructors can update own location images',
    'Instructors can delete own location images'
  )
ORDER BY policyname;


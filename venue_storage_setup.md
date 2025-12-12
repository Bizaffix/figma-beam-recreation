-- Create venue-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images', 
  'venue-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload venue images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own venue images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own venue images" ON storage.objects;

-- Policy for users to upload images to their own folder
CREATE POLICY "Users can upload venue images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'venue-images' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to view their own venue images
CREATE POLICY "Users can view their own venue images" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'venue-images' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to delete their own venue images
CREATE POLICY "Users can delete their own venue images" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'venue-images' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for public access to venue images (for viewing)
CREATE POLICY "Public can view venue images" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'venue-images'
);

-- Grant necessary permissions
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

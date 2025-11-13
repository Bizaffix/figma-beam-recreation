# Supabase Storage Setup for Image Uploads

## Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket named: `retreat-images`
5. Make it **Public** (so images can be accessed via URL)

## Set Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Instructors can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);
```

### Policy 2: Allow public read access
```sql
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-images');
```

### Policy 3: Allow instructors to update their own images
```sql
CREATE POLICY "Instructors can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);
```

### Policy 4: Allow instructors to delete their own images
```sql
CREATE POLICY "Instructors can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);
```

## File Size Limit

The current implementation limits images to 5MB. You can adjust this in `src/pages/InstructorRetreatForm.tsx` if needed.

## Supported Image Formats

The file input accepts all image types (`image/*`), including:
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG


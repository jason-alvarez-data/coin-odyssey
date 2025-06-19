-- Simple storage policies for coin-images bucket
-- Run these in your Supabase SQL Editor

-- First, let's check if RLS is enabled
-- (This is usually enabled by default, but let's make sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies for coin-images to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to upload coin images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view coin images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own coin images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own coin images" ON storage.objects;

-- Create simple policies that allow all authenticated users to manage coin-images
CREATE POLICY "coin_images_upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'coin-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "coin_images_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'coin-images'
);

CREATE POLICY "coin_images_update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'coin-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "coin_images_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'coin-images' 
    AND auth.role() = 'authenticated'
);

-- Verify policies were created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%coin_images%'; 
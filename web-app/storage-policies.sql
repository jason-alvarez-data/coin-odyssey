-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload images to the coin-images bucket
CREATE POLICY "Allow authenticated users to upload coin images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view coin images
CREATE POLICY "Allow authenticated users to view coin images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own coin images
CREATE POLICY "Allow users to update their own coin images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own coin images
CREATE POLICY "Allow users to delete their own coin images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
);

-- If you want to be more restrictive and only allow users to manage images 
-- for coins they own, you can use this more complex policy instead:
-- Note: This requires that the filename contains the coin ID as the first part

/*
-- More restrictive policy example (uncomment if needed):
CREATE POLICY "Allow users to manage images for their own coins"
ON storage.objects FOR ALL
USING (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM coins c
    JOIN collections col ON c.collection_id = col.id
    WHERE col.user_id = auth.uid()
    AND (storage.objects.name LIKE c.id::text || '%')
  )
) WITH CHECK (
  bucket_id = 'coin-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM coins c
    JOIN collections col ON c.collection_id = col.id
    WHERE col.user_id = auth.uid()
    AND (name LIKE c.id::text || '%')
  )
);
*/ 
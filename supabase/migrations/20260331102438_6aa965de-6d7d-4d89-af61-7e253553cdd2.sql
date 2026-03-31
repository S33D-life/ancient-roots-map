
DROP POLICY IF EXISTS "Authenticated users can upload to greenhouse" ON storage.objects;
CREATE POLICY "Authenticated users can upload to greenhouse"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'greenhouse'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- Make greenhouse bucket private to respect is_shared flag
UPDATE storage.buckets SET public = false WHERE id = 'greenhouse';

-- Drop overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view greenhouse photos" ON storage.objects;

-- Users can always view their own greenhouse photos
CREATE POLICY "Users can view own greenhouse photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'greenhouse' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone authenticated can view shared greenhouse photos
CREATE POLICY "Anyone can view shared greenhouse photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'greenhouse' AND
    EXISTS (
      SELECT 1 FROM public.greenhouse_plants
      WHERE photo_url LIKE '%' || storage.filename(name) || '%'
      AND is_shared = true
    )
  );

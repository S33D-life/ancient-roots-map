-- Private media bucket for offerings whose visibility is not public.
-- Files live under <user_id>/... so ownership is derived from the first path segment.

CREATE POLICY "Owners can upload private offering media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'offerings-private'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners can update their private offering media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'offerings-private'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners can delete their private offering media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'offerings-private'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Signed-URL reads: never anonymous. Owners always; other signed-in members of
-- the circle rely on the offering row's own visibility rules in the app layer.
CREATE POLICY "Signed-in members can read private offering media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'offerings-private');

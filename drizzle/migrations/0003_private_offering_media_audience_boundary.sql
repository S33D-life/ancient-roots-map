-- Authoritative access rule for a single Life Grove offering, mirroring the
-- SELECT policies on public.life_grove_offerings.
CREATE OR REPLACE FUNCTION public.can_view_life_grove_offering(_offering_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.life_grove_offerings o
    JOIN public.life_groves g ON g.id = o.life_grove_id
    WHERE o.id = _offering_id
      AND o.hidden_at IS NULL
      AND (
        (_user_id IS NOT NULL AND o.contributor_user_id = _user_id)
        OR (_user_id IS NOT NULL AND public.is_grove_contributor(o.life_grove_id, _user_id))
        OR (g.privacy = 'public' AND o.visibility = 'public')
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_life_grove_offering(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_life_grove_offering(uuid, uuid) TO authenticated, service_role;

-- Being signed in is no longer sufficient to read private offering media.
DROP POLICY IF EXISTS "Signed-in members can read private offering media" ON storage.objects;

-- Owners keep direct access to their own uploads; every other viewer must go
-- through the offering-media function, which checks the offering record first.
CREATE POLICY "Owners can read their private offering media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'offerings-private'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
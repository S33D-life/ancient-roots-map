-- 1) Remove over-permissive notifications INSERT policy.
-- Cross-user notifications are now written by the `send-notification` edge
-- function using the service role (which bypasses RLS).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- 2) Enforce per-user folder ownership on bounty-screenshots uploads,
-- matching the existing DELETE policy.
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
CREATE POLICY "Users can upload own bounty screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bounty-screenshots'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 3) Pin search_path on internal helper to satisfy the linter.
ALTER FUNCTION public._haversine_m(numeric, numeric, numeric, numeric) SET search_path = public;

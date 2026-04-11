-- 1. Fix telegram_outbound_log: drop the original overly-permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read outbound log" ON public.telegram_outbound_log;

-- 2. Fix greenhouse bucket: drop the unrestricted INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload greenhouse photos" ON storage.objects;

-- 3. Fix telegram_settings: ensure keeper-only access
DROP POLICY IF EXISTS "Authenticated users can update telegram settings" ON public.telegram_settings;
DROP POLICY IF EXISTS "Keepers can update telegram settings" ON public.telegram_settings;

CREATE POLICY "Keepers can update telegram settings"
  ON public.telegram_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Authenticated users can read telegram settings" ON public.telegram_settings;
DROP POLICY IF EXISTS "Keepers can read telegram settings" ON public.telegram_settings;

CREATE POLICY "Keepers can read telegram settings"
  ON public.telegram_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'));
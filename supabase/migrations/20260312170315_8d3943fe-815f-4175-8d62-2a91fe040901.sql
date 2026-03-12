
-- FIX: sky_stamps precise GPS coordinates should not be publicly readable without restriction
-- Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can read sky stamps" ON public.sky_stamps;

CREATE POLICY "Authenticated users can read sky stamps"
  ON public.sky_stamps
  FOR SELECT
  TO authenticated
  USING (true);

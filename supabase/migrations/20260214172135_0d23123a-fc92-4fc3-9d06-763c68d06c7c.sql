
-- Fix overly permissive INSERT policy on site_visits
-- The record_visit() function is SECURITY DEFINER and bypasses RLS,
-- so direct inserts should require authentication at minimum.
DROP POLICY IF EXISTS "Anyone can record a visit" ON public.site_visits;

CREATE POLICY "Authenticated users can record visits"
  ON public.site_visits
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read visits" ON public.site_visits;

-- Authenticated users can view only their own visit records
CREATE POLICY "Users can view their own visits"
  ON public.site_visits
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow anonymous/public to read only anonymous visit records (user_id IS NULL)
-- This preserves the visitor counter functionality without exposing user identities
CREATE POLICY "Public can view anonymous visits"
  ON public.site_visits
  FOR SELECT
  USING (user_id IS NULL);

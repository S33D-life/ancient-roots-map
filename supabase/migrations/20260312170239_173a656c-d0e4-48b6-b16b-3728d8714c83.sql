
-- FIX 1: Private check-ins with GPS are publicly readable
-- Drop the overly permissive public read policy and replace with privacy-aware one
DROP POLICY IF EXISTS "Check-ins are publicly readable" ON public.tree_checkins;

CREATE POLICY "Public check-ins are publicly readable"
  ON public.tree_checkins
  FOR SELECT
  TO anon, authenticated
  USING (privacy = 'public');

-- FIX 2: Remove broad authenticated SELECT on tree_sources that leaks contributor_email
-- Keep only the curator-only policy; general access should use tree_sources_public view
DROP POLICY IF EXISTS "Verified sources readable by authenticated users" ON public.tree_sources;

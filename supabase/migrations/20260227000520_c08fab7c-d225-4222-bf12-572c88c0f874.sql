
-- Fix 1: Drop and recreate view without contributor_email
DROP VIEW IF EXISTS public.tree_sources_public;

CREATE VIEW public.tree_sources_public AS
SELECT
  id, tree_id, research_tree_id, submitted_by, submitted_at,
  verified_by, verified_at, created_at, updated_at,
  source_title, source_type, url, description,
  verification_status, verification_notes, contributor_name
FROM public.tree_sources
WHERE verification_status = 'verified';

-- Fix 2: Restrict tree_checkins to own-user only
DROP POLICY IF EXISTS "Tree checkins are publicly readable" ON public.tree_checkins;

CREATE POLICY "Users can view own checkins"
  ON public.tree_checkins FOR SELECT
  USING (auth.uid() = user_id);

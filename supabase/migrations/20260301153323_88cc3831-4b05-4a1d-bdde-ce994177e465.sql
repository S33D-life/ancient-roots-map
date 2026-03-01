
-- Drop existing view and recreate without contributor_email
DROP VIEW IF EXISTS public.tree_sources_public;

CREATE VIEW public.tree_sources_public
WITH (security_invoker = on) AS
SELECT
  id,
  tree_id,
  research_tree_id,
  source_title,
  source_type,
  url,
  description,
  submitted_by,
  submitted_at,
  verification_status,
  verified_by,
  verified_at,
  verification_notes,
  contributor_name
FROM public.tree_sources;

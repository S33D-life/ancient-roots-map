
-- Create a public view that excludes contributor_email
CREATE VIEW public.tree_sources_public
WITH (security_invoker = on) AS
  SELECT
    id, tree_id, research_tree_id, source_title, source_type,
    url, description, submitted_by, submitted_at,
    verification_status, verified_by, verified_at,
    verification_notes, contributor_name, created_at, updated_at
  FROM public.tree_sources;

-- Drop the policy that exposes verified sources publicly (includes email)
DROP POLICY "Verified sources are publicly readable" ON public.tree_sources;

-- Re-create it so only authenticated users or the submitter can see verified sources on the base table
-- Public access goes through the view which excludes email
CREATE POLICY "Verified sources readable by authenticated users"
  ON public.tree_sources FOR SELECT
  USING (
    verification_status = 'verified' AND auth.uid() IS NOT NULL
  );

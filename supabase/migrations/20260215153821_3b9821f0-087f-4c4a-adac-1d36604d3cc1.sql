
-- Replace overly permissive SELECT policy with author + curator access
DROP POLICY IF EXISTS "Authenticated users can view bug reports" ON public.bug_reports;

CREATE POLICY "Authors and curators can view bug reports"
ON public.bug_reports FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'curator'::app_role)
);


-- Fix: RLS policy for background_jobs (admin-only via has_role)
CREATE POLICY "Only curators can view background jobs"
  ON public.background_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'curator'::app_role));

-- Move materialized view out of public API by revoking anon access
REVOKE SELECT ON public.trees_map_hot FROM anon;
-- The RPC get_trees_in_viewport is SECURITY DEFINER so it can still read the view


-- Digital encounters: lightweight page view tracking for tree pages
CREATE TABLE IF NOT EXISTS public.tree_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick aggregate queries
CREATE INDEX idx_tree_page_views_tree_id ON public.tree_page_views(tree_id);
CREATE INDEX idx_tree_page_views_created_at ON public.tree_page_views(created_at);

-- Enable RLS
ALTER TABLE public.tree_page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a page view (including anonymous)
CREATE POLICY "Anyone can record page views"
  ON public.tree_page_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Only keepers can read raw page views
CREATE POLICY "Keepers can read page views"
  ON public.tree_page_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'));

-- Aggregate function for tree activity stats (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_tree_activity_stats(p_tree_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'physical_visits', (SELECT count(*) FROM tree_checkins WHERE tree_id = p_tree_id),
    'unique_wanderers', (SELECT count(DISTINCT user_id) FROM tree_checkins WHERE tree_id = p_tree_id),
    'digital_encounters', (SELECT count(*) FROM tree_page_views WHERE tree_id = p_tree_id)
  );
$$;

-- Accessibility tier enum
DO $$ BEGIN
  CREATE TYPE public.tree_accessibility_tier AS ENUM ('public', 'visible', 'garden', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns to trees
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS accessibility_tier public.tree_accessibility_tier NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS access_notes text;

CREATE INDEX IF NOT EXISTS idx_trees_accessibility_tier ON public.trees(accessibility_tier);

-- tree_access_grants table — wanderer-specific overrides for private trees
CREATE TABLE IF NOT EXISTS public.tree_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (tree_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tree_access_grants_user ON public.tree_access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_access_grants_tree ON public.tree_access_grants(tree_id);

ALTER TABLE public.tree_access_grants ENABLE ROW LEVEL SECURITY;

-- RLS: A user can see their own grants; tree creators can see grants on their trees; curators can see all.
CREATE POLICY "Users see their own grants"
ON public.tree_access_grants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Tree creators see grants on their trees"
ON public.tree_access_grants FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.created_by = auth.uid())
);

CREATE POLICY "Curators see all grants"
ON public.tree_access_grants FOR SELECT
USING (public.has_role(auth.uid(), 'curator'));

-- Insert: tree creator or curator can grant
CREATE POLICY "Tree creator can grant access"
ON public.tree_access_grants FOR INSERT
WITH CHECK (
  auth.uid() = granted_by
  AND (
    EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.created_by = auth.uid())
    OR public.has_role(auth.uid(), 'curator')
  )
);

-- Delete (revoke): same as insert
CREATE POLICY "Tree creator can revoke access"
ON public.tree_access_grants FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.created_by = auth.uid())
  OR public.has_role(auth.uid(), 'curator')
);

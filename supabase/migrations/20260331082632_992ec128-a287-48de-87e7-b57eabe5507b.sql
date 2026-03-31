
-- Add photo columns to tree_location_refinements
ALTER TABLE public.tree_location_refinements
  ADD COLUMN IF NOT EXISTS trunk_photo_url text,
  ADD COLUMN IF NOT EXISTS context_photo_url text;

-- Create location history table for rollback/lineage tracking
CREATE TABLE IF NOT EXISTS public.tree_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  old_latitude numeric NOT NULL,
  old_longitude numeric NOT NULL,
  new_latitude numeric NOT NULL,
  new_longitude numeric NOT NULL,
  old_confidence text,
  new_confidence text,
  changed_by uuid NOT NULL,
  reason text,
  refinement_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tree_location_history ENABLE ROW LEVEL SECURITY;

-- Curators can read location history
CREATE POLICY "Curators can view location history"
  ON public.tree_location_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'curator'));

-- Curators can insert location history
CREATE POLICY "Curators can insert location history"
  ON public.tree_location_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'curator'));

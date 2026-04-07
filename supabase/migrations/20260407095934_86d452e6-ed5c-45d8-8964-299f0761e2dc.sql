
-- Heart Rooting: tree_value_roots
CREATE TABLE public.tree_value_roots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 's33d_heart',
  amount INTEGER NOT NULL DEFAULT 0,
  species_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accrual_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_visit_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, tree_id, asset_type)
);

-- Indexes
CREATE INDEX idx_tree_value_roots_user ON public.tree_value_roots (user_id);
CREATE INDEX idx_tree_value_roots_tree ON public.tree_value_roots (tree_id);
CREATE INDEX idx_tree_value_roots_species ON public.tree_value_roots (species_key);

-- RLS
ALTER TABLE public.tree_value_roots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roots"
  ON public.tree_value_roots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roots"
  ON public.tree_value_roots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roots"
  ON public.tree_value_roots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roots"
  ON public.tree_value_roots FOR DELETE
  USING (auth.uid() = user_id);

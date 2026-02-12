
-- Planted seeds: tracks the seed economy
CREATE TABLE public.planted_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planter_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  planted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blooms_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  collected_by UUID,
  collected_at TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planted_seeds ENABLE ROW LEVEL SECURITY;

-- Everyone can see seeds (needed for map markers & collection)
CREATE POLICY "Anyone can view seeds"
ON public.planted_seeds
FOR SELECT USING (true);

-- Authenticated users can plant seeds
CREATE POLICY "Users can plant seeds"
ON public.planted_seeds
FOR INSERT WITH CHECK (auth.uid() = planter_id);

-- Anyone (except the planter) can collect a bloomed, uncollected seed
CREATE POLICY "Users can collect bloomed seeds"
ON public.planted_seeds
FOR UPDATE USING (
  collected_by IS NULL
  AND blooms_at <= now()
  AND auth.uid() IS NOT NULL
  AND auth.uid() != planter_id
);

-- Index for efficient queries
CREATE INDEX idx_planted_seeds_tree ON public.planted_seeds(tree_id);
CREATE INDEX idx_planted_seeds_planter ON public.planted_seeds(planter_id);
CREATE INDEX idx_planted_seeds_blooms ON public.planted_seeds(blooms_at) WHERE collected_by IS NULL;

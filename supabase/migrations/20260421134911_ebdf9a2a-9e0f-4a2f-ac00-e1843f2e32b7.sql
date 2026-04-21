-- Add cultivated variety + lineage tracking to trees
-- All fields are optional and backward-compatible.

-- Enum for propagation/lineage type
DO $$ BEGIN
  CREATE TYPE public.propagation_type AS ENUM ('seed', 'graft', 'cutting', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS variety_name TEXT,
  ADD COLUMN IF NOT EXISTS is_orchard BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS propagation_type public.propagation_type,
  ADD COLUMN IF NOT EXISTS parent_tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_description TEXT,
  ADD COLUMN IF NOT EXISTS planted_year INTEGER;

-- Light validation for planted_year (1500..current+1)
DO $$ BEGIN
  ALTER TABLE public.trees
    ADD CONSTRAINT trees_planted_year_range
    CHECK (planted_year IS NULL OR (planted_year >= 1500 AND planted_year <= EXTRACT(YEAR FROM now())::INT + 1));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Helpful indexes for future orchard / variety / lineage views
CREATE INDEX IF NOT EXISTS idx_trees_is_orchard ON public.trees (is_orchard) WHERE is_orchard = true;
CREATE INDEX IF NOT EXISTS idx_trees_variety_name ON public.trees (variety_name) WHERE variety_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trees_parent_tree_id ON public.trees (parent_tree_id) WHERE parent_tree_id IS NOT NULL;
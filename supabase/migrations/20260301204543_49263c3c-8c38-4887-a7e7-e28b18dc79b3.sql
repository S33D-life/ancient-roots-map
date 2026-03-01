
-- 1. Add parent_id for nested bio-regions
ALTER TABLE public.bio_regions
  ADD COLUMN parent_id text REFERENCES public.bio_regions(id);

-- 2. Add indexes for bio_region_trees junction performance
CREATE INDEX IF NOT EXISTS idx_bio_region_trees_bio_region_id ON public.bio_region_trees(bio_region_id);
CREATE INDEX IF NOT EXISTS idx_bio_region_trees_tree_id ON public.bio_region_trees(tree_id);

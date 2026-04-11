
-- Phase 2: Expand species_index to be the canonical bridge
ALTER TABLE public.species_index
  ADD COLUMN IF NOT EXISTS genus text,
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'species',
  ADD COLUMN IF NOT EXISTS gbif_taxon_id bigint,
  ADD COLUMN IF NOT EXISTS normalized_name text,
  ADD COLUMN IF NOT EXISTS canonical_name text,
  ADD COLUMN IF NOT EXISTS synonym_names jsonb DEFAULT '[]'::jsonb;

-- Index for fast normalized lookups
CREATE INDEX IF NOT EXISTS idx_species_index_normalized_name ON public.species_index (normalized_name);
CREATE INDEX IF NOT EXISTS idx_species_index_family ON public.species_index (family);

-- Phase 2b: Expand species_hives with UI metadata
ALTER TABLE public.species_hives
  ADD COLUMN IF NOT EXISTS accent_hsl text,
  ADD COLUMN IF NOT EXISTS representative_species text[] DEFAULT '{}';

-- Phase 4: Add species_key FK on trees (nullable, non-breaking)
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS species_key text;

-- Add index for species_key lookups
CREATE INDEX IF NOT EXISTS idx_trees_species_key ON public.trees (species_key);

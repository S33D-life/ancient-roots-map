
-- Add source attribution columns to trees table
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_id text;

-- Add index for source lookups to prevent duplicates
CREATE INDEX IF NOT EXISTS idx_trees_source ON public.trees (source_name, source_id) WHERE source_name IS NOT NULL;

-- Add a discovery_list column for curated categorization
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS discovery_list text;

COMMENT ON COLUMN public.trees.source_name IS 'External database name: monumental_trees, champion_trees, ancient_tree_inventory';
COMMENT ON COLUMN public.trees.source_url IS 'URL to the original record in the external database';
COMMENT ON COLUMN public.trees.source_id IS 'Unique identifier in the external database';
COMMENT ON COLUMN public.trees.discovery_list IS 'Curated discovery list: global_notable, european_monumental, uk_ancient';

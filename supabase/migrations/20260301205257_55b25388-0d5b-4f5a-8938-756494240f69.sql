
-- Add missing indexes for scale
CREATE INDEX IF NOT EXISTS idx_trees_nation ON public.trees(nation);
CREATE INDEX IF NOT EXISTS idx_trees_species ON public.trees(species);
CREATE INDEX IF NOT EXISTS idx_trees_lat_lon ON public.trees(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_trees_country ON public.research_trees(country);
CREATE INDEX IF NOT EXISTS idx_research_trees_species ON public.research_trees(species_scientific);

-- Create DB function for bio-region tree fetch (single JOIN query)
CREATE OR REPLACE FUNCTION public.get_bio_region_trees(p_bio_region_id text)
RETURNS TABLE(id uuid, name text, species text, latitude numeric, longitude numeric, nation text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.name, t.species, t.latitude, t.longitude, t.nation
  FROM trees t
  JOIN bio_region_trees brt ON brt.tree_id = t.id
  WHERE brt.bio_region_id = p_bio_region_id
  ORDER BY t.name;
$$;

-- Create DB function for tree ecological belonging
CREATE OR REPLACE FUNCTION public.get_tree_bio_regions(p_tree_id uuid)
RETURNS TABLE(id text, name text, type text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT br.id, br.name, br.type
  FROM bio_regions br
  JOIN bio_region_trees brt ON brt.bio_region_id = br.id
  WHERE brt.tree_id = p_tree_id
  ORDER BY br.name;
$$;

-- Create DB function for species bio-region distribution
CREATE OR REPLACE FUNCTION public.get_species_bio_regions(p_species_pattern text)
RETURNS TABLE(bio_region_id text, bio_region_name text, bio_region_type text, tree_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT br.id, br.name, br.type, COUNT(DISTINCT t.id) as tree_count
  FROM bio_regions br
  JOIN bio_region_trees brt ON brt.bio_region_id = br.id
  JOIN trees t ON t.id = brt.tree_id
  WHERE t.species ILIKE '%' || p_species_pattern || '%'
  GROUP BY br.id, br.name, br.type
  ORDER BY tree_count DESC;
$$;


-- Create research_trees table for authoritative external research data
CREATE TABLE public.research_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_program TEXT NOT NULL DEFAULT 'DFFE Champion Trees',
  source_doc_title TEXT NOT NULL,
  source_doc_url TEXT NOT NULL,
  source_doc_year SMALLINT NOT NULL,
  source_row_ref TEXT,
  country TEXT NOT NULL DEFAULT 'South Africa',
  province TEXT,
  locality_text TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  geo_precision TEXT NOT NULL DEFAULT 'unknown' CHECK (geo_precision IN ('exact','approx','unknown')),
  species_scientific TEXT NOT NULL,
  species_common TEXT,
  tree_name TEXT,
  description TEXT,
  height_m NUMERIC,
  girth_or_stem TEXT,
  crown_spread TEXT,
  size_index NUMERIC,
  designation_type TEXT NOT NULL DEFAULT 'Champion Tree' CHECK (designation_type IN ('Champion Tree','Protected Tree Species Context')),
  status TEXT NOT NULL DEFAULT 'research' CHECK (status IN ('research','verified_linked')),
  linked_tree_id UUID REFERENCES public.trees(id),
  user_annotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_trees ENABLE ROW LEVEL SECURITY;

-- Research trees are publicly readable (discovery layer)
CREATE POLICY "Research trees are publicly readable"
  ON public.research_trees FOR SELECT
  USING (true);

-- Only curators can insert/update research trees (data integrity)
CREATE POLICY "Curators can insert research trees"
  ON public.research_trees FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'curator'::app_role));

CREATE POLICY "Curators can update research trees"
  ON public.research_trees FOR UPDATE
  USING (has_role(auth.uid(), 'curator'::app_role));

-- Index for map queries
CREATE INDEX idx_research_trees_coords ON public.research_trees (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_research_trees_species ON public.research_trees (species_scientific);
CREATE INDEX idx_research_trees_status ON public.research_trees (status);

-- Updated_at trigger
CREATE TRIGGER update_research_trees_updated_at
  BEFORE UPDATE ON public.research_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

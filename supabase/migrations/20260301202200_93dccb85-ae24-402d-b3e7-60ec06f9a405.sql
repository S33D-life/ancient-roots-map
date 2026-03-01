CREATE TABLE public.region_notable_trees (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT 'Belluno',
  region TEXT NOT NULL DEFAULT 'Veneto',
  country TEXT NOT NULL DEFAULT 'Italy',
  estimated_age_years INTEGER,
  estimated_age_label TEXT,
  accessibility TEXT DEFAULT 'Accessibile',
  relevance TEXT DEFAULT 'Locale',
  locality TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.region_notable_trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read region_notable_trees"
  ON public.region_notable_trees
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert region_notable_trees"
  ON public.region_notable_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update region_notable_trees"
  ON public.region_notable_trees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
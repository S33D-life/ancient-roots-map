
-- Bio-Regions table
CREATE TABLE public.bio_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Mountain System',
  countries TEXT[] NOT NULL DEFAULT '{}',
  climate_band TEXT,
  elevation_range TEXT,
  dominant_species TEXT[] NOT NULL DEFAULT '{}',
  primary_watersheds TEXT[] NOT NULL DEFAULT '{}',
  biome_description TEXT,
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  boundary_geojson JSONB,
  governance_status TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction: bio_region ↔ trees (many-to-many)
CREATE TABLE public.bio_region_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bio_region_id TEXT NOT NULL REFERENCES public.bio_regions(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bio_region_id, tree_id)
);

-- RLS: public read for bio_regions
ALTER TABLE public.bio_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bio_regions_public_read" ON public.bio_regions FOR SELECT USING (true);

-- RLS: public read for junction
ALTER TABLE public.bio_region_trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bio_region_trees_public_read" ON public.bio_region_trees FOR SELECT USING (true);
CREATE POLICY "bio_region_trees_auth_insert" ON public.bio_region_trees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Seed 3 test bio-regions
INSERT INTO public.bio_regions (id, name, type, countries, climate_band, elevation_range, dominant_species, primary_watersheds, biome_description, center_lat, center_lon, governance_status) VALUES
  ('alps', 'The Alps', 'Mountain System',
   ARRAY['France','Switzerland','Italy','Austria','Germany','Slovenia','Liechtenstein'],
   'Alpine / Subalpine', '400m – 4,800m',
   ARRAY['Larix decidua','Picea abies','Pinus cembra','Fagus sylvatica','Abies alba'],
   ARRAY['Rhine','Danube','Po','Rhône'],
   'Europe''s great mountain arc — 1,200 km of limestone, granite, and glacial valleys stretching from the Ligurian coast to the Vienna Basin. Home to ancient larch, stone pine, and beech forests shaped by altitude, aspect, and millennia of human-forest coexistence.',
   46.8, 9.8, 'seed'),

  ('pantanal', 'Pantanal', 'Wetland System',
   ARRAY['Brazil','Bolivia','Paraguay'],
   'Tropical Wetland', '80m – 150m',
   ARRAY['Tabebuia sp.','Ceiba sp.','Mauritia flexuosa','Vochysia divergens'],
   ARRAY['Paraguay River','Cuiabá River','São Lourenço'],
   'The world''s largest tropical wetland — a seasonal floodplain at the heart of South America where gallery forests, savanna patches, and aquatic ecosystems pulse with the rhythm of wet and dry cycles.',
   -16.5, -56.0, 'seed'),

  ('fenlands', 'The Fenlands', 'Wetland / Lowland Basin',
   ARRAY['United Kingdom'],
   'Temperate maritime', '-3m – 20m',
   ARRAY['Alnus glutinosa','Salix sp.','Quercus robur'],
   ARRAY['Great Ouse','Nene','Welland','Witham'],
   'A vast low-lying basin of peat soils and drainage channels — once the largest wetland in England. Islands of higher ground harbour ancient oaks, while waterways sustain alder and willow groves.',
   52.5, 0.2, 'seed');

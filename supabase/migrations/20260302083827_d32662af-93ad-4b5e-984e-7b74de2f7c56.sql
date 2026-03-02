
-- Species index for normalised species references across Ancient Friends + Seed Cellar
CREATE TABLE public.species_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  species_key TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  family TEXT,
  synonyms TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '🌳',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Phenology signals cache (keyed by region + date, filled by adapters)
CREATE TABLE public.phenology_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bioregion_id TEXT,
  region_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  signal_date DATE NOT NULL,
  species_key TEXT REFERENCES public.species_index(species_key),
  phase TEXT NOT NULL CHECK (phase IN ('dormant','budding','flowering','fruiting','leaf_fall','peak','unknown')),
  confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low','medium','high')),
  source_adapter TEXT NOT NULL DEFAULT 'heuristic',
  typical_window_start SMALLINT,
  typical_window_end SMALLINT,
  metadata JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_phenology_signals_lookup ON public.phenology_signals(species_key, signal_date, bioregion_id);
CREATE INDEX idx_phenology_signals_date ON public.phenology_signals(signal_date);

-- Community phenology observations
CREATE TABLE public.phenology_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID REFERENCES public.trees(id),
  species_key TEXT REFERENCES public.species_index(species_key),
  observation_type TEXT NOT NULL CHECK (observation_type IN ('bud','flower','fruit','leaf_fall','first_frost','bare','other')),
  photo_url TEXT,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_phenology_obs_species ON public.phenology_observations(species_key, observed_at);
CREATE INDEX idx_phenology_obs_user ON public.phenology_observations(user_id);

-- RLS policies
ALTER TABLE public.species_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phenology_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phenology_observations ENABLE ROW LEVEL SECURITY;

-- species_index: public read
CREATE POLICY "Anyone can read species index" ON public.species_index FOR SELECT USING (true);

-- phenology_signals: public read
CREATE POLICY "Anyone can read phenology signals" ON public.phenology_signals FOR SELECT USING (true);

-- phenology_observations: public read, auth insert own
CREATE POLICY "Anyone can read observations" ON public.phenology_observations FOR SELECT USING (true);
CREATE POLICY "Auth users can create observations" ON public.phenology_observations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own observations" ON public.phenology_observations FOR UPDATE USING (auth.uid() = user_id);

-- Seed initial species_index from food_cycles
INSERT INTO public.species_index (species_key, common_name, scientific_name, icon)
SELECT 
  lower(replace(name, ' ', '_')),
  name,
  scientific_name,
  icon
FROM public.food_cycles
ON CONFLICT (species_key) DO NOTHING;

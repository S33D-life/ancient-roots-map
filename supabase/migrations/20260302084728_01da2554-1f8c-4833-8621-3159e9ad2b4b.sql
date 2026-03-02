
-- Add calendar-relevant columns to bio_regions
ALTER TABLE public.bio_regions
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS flagship_species_keys TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hemisphere TEXT DEFAULT 'north',
  ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Bioregion seasonal markers — data-driven calendar events
CREATE TABLE public.bioregion_seasonal_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bioregion_id TEXT NOT NULL REFERENCES public.bio_regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🌿',
  typical_month_start SMALLINT NOT NULL CHECK (typical_month_start BETWEEN 1 AND 12),
  typical_month_end SMALLINT NOT NULL CHECK (typical_month_end BETWEEN 1 AND 12),
  marker_type TEXT NOT NULL DEFAULT 'phenology' CHECK (marker_type IN ('phenology','climate','migration','cultural','harvest','planting')),
  species_keys TEXT[] DEFAULT '{}',
  elevation_band TEXT CHECK (elevation_band IN ('low','mid','high','all')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bioregion_markers_region ON public.bioregion_seasonal_markers(bioregion_id, typical_month_start);

-- Bioregion seed windows — links seed cellar to bioregions
CREATE TABLE public.bioregion_seed_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bioregion_id TEXT NOT NULL REFERENCES public.bio_regions(id) ON DELETE CASCADE,
  species_key TEXT NOT NULL,
  species_name TEXT NOT NULL,
  sow_month_start SMALLINT CHECK (sow_month_start BETWEEN 1 AND 12),
  sow_month_end SMALLINT CHECK (sow_month_end BETWEEN 1 AND 12),
  harvest_month_start SMALLINT CHECK (harvest_month_start BETWEEN 1 AND 12),
  harvest_month_end SMALLINT CHECK (harvest_month_end BETWEEN 1 AND 12),
  dormant_month_start SMALLINT CHECK (dormant_month_start BETWEEN 1 AND 12),
  dormant_month_end SMALLINT CHECK (dormant_month_end BETWEEN 1 AND 12),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bioregion_seeds_region ON public.bioregion_seed_windows(bioregion_id);

-- RLS
ALTER TABLE public.bioregion_seasonal_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bioregion_seed_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seasonal markers" ON public.bioregion_seasonal_markers FOR SELECT USING (true);
CREATE POLICY "Anyone can read seed windows" ON public.bioregion_seed_windows FOR SELECT USING (true);

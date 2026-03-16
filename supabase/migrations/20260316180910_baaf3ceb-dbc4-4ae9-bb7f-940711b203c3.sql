
CREATE TABLE public.dataset_discovery_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_org TEXT,
  country_code TEXT,
  country_name TEXT,
  region_name TEXT,
  dataset_type TEXT NOT NULL DEFAULT 'heritage_trees',
  data_format TEXT NOT NULL DEFAULT 'manual',
  update_frequency TEXT DEFAULT 'static',
  discovery_method TEXT NOT NULL DEFAULT 'manual',
  discovery_confidence TEXT NOT NULL DEFAULT 'medium',
  access_type TEXT NOT NULL DEFAULT 'open',
  license_notes TEXT,
  api_available BOOLEAN NOT NULL DEFAULT false,
  download_available BOOLEAN NOT NULL DEFAULT false,
  geo_available BOOLEAN NOT NULL DEFAULT false,
  individual_trees BOOLEAN NOT NULL DEFAULT false,
  species_detail BOOLEAN NOT NULL DEFAULT false,
  estimated_record_count INTEGER,
  status TEXT NOT NULL DEFAULT 'discovered',
  review_notes TEXT,
  score_official_status INTEGER DEFAULT 0,
  score_geographic_precision INTEGER DEFAULT 0,
  score_individual_records INTEGER DEFAULT 0,
  score_species_detail INTEGER DEFAULT 0,
  score_heritage_value INTEGER DEFAULT 0,
  score_public_accessibility INTEGER DEFAULT 0,
  score_licensing_clarity INTEGER DEFAULT 0,
  score_update_frequency INTEGER DEFAULT 0,
  score_map_compatibility INTEGER DEFAULT 0,
  score_story_value INTEGER DEFAULT 0,
  readiness_score NUMERIC GENERATED ALWAYS AS (
    (COALESCE(score_official_status,0) + COALESCE(score_geographic_precision,0) +
     COALESCE(score_individual_records,0) + COALESCE(score_species_detail,0) +
     COALESCE(score_heritage_value,0) + COALESCE(score_public_accessibility,0) +
     COALESCE(score_licensing_clarity,0) + COALESCE(score_update_frequency,0) +
     COALESCE(score_map_compatibility,0) + COALESCE(score_story_value,0)) / 10.0
  ) STORED,
  priority_tier TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(score_official_status,0) + COALESCE(score_geographic_precision,0) +
            COALESCE(score_individual_records,0) + COALESCE(score_species_detail,0) +
            COALESCE(score_heritage_value,0) + COALESCE(score_public_accessibility,0) +
            COALESCE(score_licensing_clarity,0) + COALESCE(score_update_frequency,0) +
            COALESCE(score_map_compatibility,0) + COALESCE(score_story_value,0)) / 10.0 >= 7 THEN 'high_priority'
      WHEN (COALESCE(score_official_status,0) + COALESCE(score_geographic_precision,0) +
            COALESCE(score_individual_records,0) + COALESCE(score_species_detail,0) +
            COALESCE(score_heritage_value,0) + COALESCE(score_public_accessibility,0) +
            COALESCE(score_licensing_clarity,0) + COALESCE(score_update_frequency,0) +
            COALESCE(score_map_compatibility,0) + COALESCE(score_story_value,0)) / 10.0 >= 5 THEN 'promising'
      WHEN (COALESCE(score_official_status,0) + COALESCE(score_geographic_precision,0) +
            COALESCE(score_individual_records,0) + COALESCE(score_species_detail,0) +
            COALESCE(score_heritage_value,0) + COALESCE(score_public_accessibility,0) +
            COALESCE(score_licensing_clarity,0) + COALESCE(score_update_frequency,0) +
            COALESCE(score_map_compatibility,0) + COALESCE(score_story_value,0)) / 10.0 >= 3 THEN 'research_only'
      ELSE 'not_suitable_yet'
    END
  ) STORED,
  promoted_source_id UUID REFERENCES public.tree_data_sources(id),
  discovered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_discovery_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discoveries"
  ON public.dataset_discovery_queue FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert discoveries"
  ON public.dataset_discovery_queue FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update discoveries"
  ON public.dataset_discovery_queue FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_discovery_queue_status ON public.dataset_discovery_queue(status);
CREATE INDEX idx_discovery_queue_country ON public.dataset_discovery_queue(country_code);

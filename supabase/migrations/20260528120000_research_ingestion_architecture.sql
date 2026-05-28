-- ============================================================
-- Research Ingestion Architecture
-- Safe staging layer for AI-assisted species research.
--
-- Agents NEVER write to production species data directly.
-- All entries flow through research_staging_entries and the
-- research_review_queue before being promoted to
-- tree_species_enrichment (the production knowledge layer).
-- ============================================================

-- ----------------------------------------------------------
-- 1. research_sources
--    Tracks the provenance of every research claim.
--    Reliability tiers keep ecological fact separate from lore.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  url           TEXT,
  source_type   TEXT NOT NULL
                  CHECK (source_type IN ('web','book','paper','database','agent','manual')),
  author        TEXT,
  publication_date DATE,
  -- 1 = high (peer-reviewed / institutional)
  -- 2 = medium (reputable popular / herbarium)
  -- 3 = low (folklore / oral tradition / unverified)
  reliability_tier INTEGER NOT NULL DEFAULT 2
                  CHECK (reliability_tier IN (1, 2, 3)),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
);

ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read; only service role / admin inserts
CREATE POLICY "research_sources_read" ON public.research_sources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "research_sources_insert" ON public.research_sources
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ----------------------------------------------------------
-- 2. tree_families
--    Botanical family layer (Fagaceae, Salicaceae, Taxaceae…)
--    Powers the Arborium Tree Families section and ID flow.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tree_families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_slug   TEXT UNIQUE NOT NULL,  -- 'fagaceae'
  common_name   TEXT NOT NULL,         -- 'Beech & Oak family'
  latin_name    TEXT NOT NULL,         -- 'Fagaceae'
  description   TEXT,
  key_genera    TEXT[],                -- ARRAY['Quercus','Fagus','Castanea']
  ecology_notes TEXT,
  arborium_visible BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tree_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tree_families_read" ON public.tree_families
  FOR SELECT USING (true);

CREATE POLICY "tree_families_write" ON public.tree_families
  FOR ALL USING (auth.role() = 'service_role');

-- ----------------------------------------------------------
-- 3. research_staging_entries
--    The core staging table.  Agents write here; humans review.
--    Production data is NEVER modified by this table directly.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_staging_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Identity ──────────────────────────────────────────────
  entry_type    TEXT NOT NULL DEFAULT 'species'
                  CHECK (entry_type IN ('species','family','ancient_tree','folklore','ecology','medicinal')),
  slug          TEXT,          -- species slug ('oak', 'yew') or family slug
  common_name   TEXT,
  latin_name    TEXT,
  family_slug   TEXT REFERENCES public.tree_families(family_slug),

  -- ── Content layers (all nullable — agents fill what they know) ──
  -- Identification clues as structured JSON:
  --   { "primary": "...", "secondary": ["...","..."], "visual_details": ["..."] }
  identification_clues    JSONB,
  ecology_notes           TEXT,
  habitat_notes           TEXT,
  ancient_tree_relevance  TEXT,  -- Why this species matters to Ancient Friends
  seasonal_notes          TEXT,
  -- KEPT SEPARATE from ecological fact (safety rule §4)
  folklore_mythic_notes   TEXT,
  -- Only included with appropriate cautions (safety rule §2)
  medicinal_edible_notes  TEXT,
  conservation_notes      TEXT,

  -- ── Source provenance ────────────────────────────────────
  source_ids    UUID[],        -- FK refs to research_sources
  source_urls   TEXT[],        -- quick-look URLs (may duplicate source records)
  -- 0.0 = speculation, 0.5 = plausible, 1.0 = well-sourced
  confidence_score NUMERIC(3,2) DEFAULT 0.5
                  CHECK (confidence_score >= 0 AND confidence_score <= 1),
  agent_model   TEXT,          -- 'claude-opus-4', 'gpt-4o', 'manual', …

  -- ── Safety flags ─────────────────────────────────────────
  contains_medical_claims   BOOLEAN NOT NULL DEFAULT false,
  medical_caution_added     BOOLEAN NOT NULL DEFAULT false,
  uncertainty_flagged       BOOLEAN NOT NULL DEFAULT false,
  lore_separated_from_fact  BOOLEAN NOT NULL DEFAULT false,
  unsourced_lore_present    BOOLEAN NOT NULL DEFAULT false,  -- blocks auto-approve

  -- ── Review workflow ──────────────────────────────────────
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','needs_review','approved','rejected','revision_requested')),
  reviewed_by   UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  approved_at   TIMESTAMPTZ,
  rejected_at   TIMESTAMPTZ,
  rejection_reason TEXT,

  -- ── Target integrations ──────────────────────────────────
  target_arborium       BOOLEAN NOT NULL DEFAULT false,
  target_atlas          BOOLEAN NOT NULL DEFAULT false,
  target_id_flow        BOOLEAN NOT NULL DEFAULT false,
  target_ancient_friends BOOLEAN NOT NULL DEFAULT false,

  -- ── Push tracking (set when promoted to enrichment table) ─
  pushed_at     TIMESTAMPTZ,
  pushed_to_enrichment_id UUID,  -- FK to tree_species_enrichment once pushed

  -- ── Metadata ─────────────────────────────────────────────
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID        -- agent UID or human UID
);

ALTER TABLE public.research_staging_entries ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read; agents write via service role
CREATE POLICY "staging_read" ON public.research_staging_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staging_insert" ON public.research_staging_entries
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Only reviewers / service role can update status fields
CREATE POLICY "staging_update" ON public.research_staging_entries
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER staging_updated_at
  BEFORE UPDATE ON public.research_staging_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------
-- 4. research_review_queue
--    Lightweight queue that tracks reviewer assignment and
--    priority ordering.  Entries here reference staging rows.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_review_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID NOT NULL REFERENCES public.research_staging_entries(id) ON DELETE CASCADE,
  priority    INTEGER NOT NULL DEFAULT 5  -- 1 = urgent, 10 = low
                CHECK (priority BETWEEN 1 AND 10),
  assigned_to UUID REFERENCES auth.users(id),
  queued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  action      TEXT CHECK (action IN ('approve','reject','request_revision')),
  notes       TEXT
);

ALTER TABLE public.research_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_read" ON public.research_review_queue
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "queue_write" ON public.research_review_queue
  FOR ALL USING (auth.role() IN ('authenticated', 'service_role'));

-- ----------------------------------------------------------
-- 5. tree_species_enrichment
--    PRODUCTION knowledge layer.  Only promoted from staging
--    after human approval.  The Arborium and Atlas read from here.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tree_species_enrichment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Matches slug keys in STARTER_SPECIES (and future species registry)
  species_slug  TEXT NOT NULL UNIQUE,
  common_name   TEXT,
  latin_name    TEXT,
  family_slug   TEXT REFERENCES public.tree_families(family_slug),

  -- Enriched content (approved, reviewed, sourced)
  identification_clues    JSONB,
  ecology_notes           TEXT,
  habitat_notes           TEXT,
  ancient_tree_relevance  TEXT,
  seasonal_notes          TEXT,
  folklore_mythic_notes   TEXT,   -- kept separate from ecology
  medicinal_edible_notes  TEXT,   -- carries caveats in the UI
  conservation_notes      TEXT,

  -- Full-text search vector (populated by trigger)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(common_name,'') || ' ' ||
      coalesce(latin_name,'')  || ' ' ||
      coalesce(ecology_notes,'') || ' ' ||
      coalesce(habitat_notes,'')
    )
  ) STORED,

  -- Provenance
  source_entry_ids  UUID[],   -- staging entry IDs that contributed
  confidence_score  NUMERIC(3,2),
  approved_by       UUID REFERENCES auth.users(id),

  -- Visibility toggles
  arborium_visible        BOOLEAN NOT NULL DEFAULT true,
  atlas_visible           BOOLEAN NOT NULL DEFAULT true,
  id_flow_eligible        BOOLEAN NOT NULL DEFAULT false,  -- feeds idBranches
  ancient_friends_visible BOOLEAN NOT NULL DEFAULT false,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrichment_search_idx
  ON public.tree_species_enrichment USING GIN (search_vector);

ALTER TABLE public.tree_species_enrichment ENABLE ROW LEVEL SECURITY;

-- Public read (enrichment is not sensitive)
CREATE POLICY "enrichment_read" ON public.tree_species_enrichment
  FOR SELECT USING (true);

-- Only service role promotes to this table (never agents directly)
CREATE POLICY "enrichment_write" ON public.tree_species_enrichment
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER enrichment_updated_at
  BEFORE UPDATE ON public.tree_species_enrichment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------
-- Seed: initial tree families (supports existing STARTER_SPECIES)
-- ----------------------------------------------------------
INSERT INTO public.tree_families (family_slug, common_name, latin_name, key_genera, arborium_visible)
VALUES
  ('fagaceae',   'Beech & Oak family',  'Fagaceae',   ARRAY['Quercus','Fagus','Castanea'], true),
  ('taxaceae',   'Yew family',          'Taxaceae',   ARRAY['Taxus'],                       true),
  ('salicaceae', 'Willow & Poplar family', 'Salicaceae', ARRAY['Salix','Populus'],           true),
  ('rosaceae',   'Rose & Hawthorn family', 'Rosaceae', ARRAY['Crataegus','Rosa','Prunus'],  true)
ON CONFLICT (family_slug) DO NOTHING;

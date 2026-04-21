-- Treeasurus: living species knowledge layer
-- Extends species_index + adds names + lore tables

-- 1. Extend species_index with Treeasurus fields
ALTER TABLE public.species_index
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description_short TEXT,
  ADD COLUMN IF NOT EXISTS description_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS canonical_common_name TEXT;

-- Backfill canonical_common_name from common_name
UPDATE public.species_index
   SET canonical_common_name = common_name
 WHERE canonical_common_name IS NULL;

-- Slug helper
CREATE OR REPLACE FUNCTION public.species_make_slug(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

-- Backfill slug, then de-duplicate by appending a short hash of species_key on collisions
UPDATE public.species_index
   SET slug = public.species_make_slug(coalesce(scientific_name, species_key))
 WHERE slug IS NULL OR slug = '';

-- Resolve duplicate slugs by appending substr(md5(species_key),1,6) to all but the oldest row
WITH ranked AS (
  SELECT id, slug, species_key,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
    FROM public.species_index
   WHERE slug IS NOT NULL
)
UPDATE public.species_index s
   SET slug = ranked.slug || '-' || substr(md5(ranked.species_key), 1, 6)
  FROM ranked
 WHERE s.id = ranked.id
   AND ranked.rn > 1;

-- Now safe to add unique index
CREATE UNIQUE INDEX IF NOT EXISTS species_index_slug_unique
  ON public.species_index (slug)
  WHERE slug IS NOT NULL;

-- Trigger: keep slug populated on insert/update, with collision suffix
CREATE OR REPLACE FUNCTION public.species_index_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.species_make_slug(coalesce(NEW.scientific_name, NEW.species_key));
    candidate := base_slug;
    WHILE attempts < 5 AND EXISTS (
      SELECT 1 FROM public.species_index WHERE slug = candidate AND id <> NEW.id
    ) LOOP
      attempts := attempts + 1;
      candidate := base_slug || '-' || substr(md5(NEW.species_key || attempts::text), 1, 6);
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_species_index_set_slug
    BEFORE INSERT OR UPDATE ON public.species_index
    FOR EACH ROW EXECUTE FUNCTION public.species_index_set_slug();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. tree_species_names — multilingual / regional names
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tree_species_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id UUID NOT NULL REFERENCES public.species_index(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_normalized TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  language_code TEXT,
  language_name TEXT,
  region TEXT,
  country_code TEXT,
  script TEXT,
  transliteration TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  source TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low','unverified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_species_names_species ON public.tree_species_names (species_id);
CREATE INDEX IF NOT EXISTS idx_species_names_lang ON public.tree_species_names (language_code);
CREATE INDEX IF NOT EXISTS idx_species_names_normalized ON public.tree_species_names (name_normalized);
CREATE INDEX IF NOT EXISTS idx_species_names_country ON public.tree_species_names (country_code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_species_names_primary_per_lang
  ON public.tree_species_names (species_id, language_code)
  WHERE is_primary = true;

ALTER TABLE public.tree_species_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Species names are readable by everyone"
  ON public.tree_species_names FOR SELECT
  USING (true);

CREATE POLICY "Curators and species stewards can add names"
  ON public.tree_species_names FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

CREATE POLICY "Curators and species stewards can update names"
  ON public.tree_species_names FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

CREATE POLICY "Curators and species stewards can delete names"
  ON public.tree_species_names FOR DELETE
  USING (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

DO $$ BEGIN
  CREATE TRIGGER trg_species_names_updated_at
    BEFORE UPDATE ON public.tree_species_names
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. tree_species_lore — knowledge entries
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tree_species_lore (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id UUID NOT NULL REFERENCES public.species_index(id) ON DELETE CASCADE,
  geography TEXT,
  country_code TEXT,
  category TEXT NOT NULL CHECK (category IN ('folklore','medicinal','ecological','symbolic','stewardship','food','craft','other')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low','unverified')),
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_species_lore_species ON public.tree_species_lore (species_id);
CREATE INDEX IF NOT EXISTS idx_species_lore_category ON public.tree_species_lore (category);
CREATE INDEX IF NOT EXISTS idx_species_lore_country ON public.tree_species_lore (country_code);

ALTER TABLE public.tree_species_lore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Species lore is readable by everyone"
  ON public.tree_species_lore FOR SELECT
  USING (true);

CREATE POLICY "Curators and species stewards can add lore"
  ON public.tree_species_lore FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

CREATE POLICY "Curators and species stewards can update lore"
  ON public.tree_species_lore FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

CREATE POLICY "Curators and species stewards can delete lore"
  ON public.tree_species_lore FOR DELETE
  USING (
    public.has_role(auth.uid(), 'curator')
    OR public.has_role(auth.uid(), 'species_steward')
  );

DO $$ BEGIN
  CREATE TRIGGER trg_species_lore_updated_at
    BEFORE UPDATE ON public.tree_species_lore
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. Multilingual search RPC
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_species_multilingual(query TEXT, max_results INT DEFAULT 20)
RETURNS TABLE (
  species_id UUID,
  species_key TEXT,
  slug TEXT,
  scientific_name TEXT,
  canonical_common_name TEXT,
  family TEXT,
  matched_name TEXT,
  matched_language TEXT,
  match_kind TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (SELECT lower(trim(query)) AS qn)
  SELECT s.id, s.species_key, s.slug, s.scientific_name, coalesce(s.canonical_common_name, s.common_name) AS canonical_common_name, s.family,
         coalesce(s.canonical_common_name, s.common_name) AS matched_name,
         s.description_language AS matched_language,
         CASE
           WHEN lower(s.scientific_name) = (SELECT qn FROM q) THEN 'scientific_exact'
           WHEN lower(coalesce(s.canonical_common_name, s.common_name)) = (SELECT qn FROM q) THEN 'common_exact'
           WHEN lower(s.scientific_name) LIKE (SELECT qn FROM q) || '%' THEN 'scientific_prefix'
           ELSE 'common_prefix'
         END AS match_kind
    FROM species_index s, q
   WHERE lower(s.scientific_name) LIKE q.qn || '%'
      OR lower(coalesce(s.canonical_common_name, s.common_name)) LIKE q.qn || '%'
   UNION ALL
  SELECT s.id, s.species_key, s.slug, s.scientific_name, coalesce(s.canonical_common_name, s.common_name) AS canonical_common_name, s.family,
         n.name AS matched_name,
         n.language_code AS matched_language,
         CASE WHEN n.name_normalized = (SELECT qn FROM q) THEN 'name_exact' ELSE 'name_prefix' END AS match_kind
    FROM tree_species_names n
    JOIN species_index s ON s.id = n.species_id, q
   WHERE n.name_normalized LIKE q.qn || '%'
   ORDER BY match_kind, scientific_name
   LIMIT max_results;
$$;
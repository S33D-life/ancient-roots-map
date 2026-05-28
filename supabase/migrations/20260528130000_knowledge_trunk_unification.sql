/**
 * Knowledge Trunk Unification
 *
 * Establishes Treeasurus (species_index + tree_species_names + tree_species_lore)
 * as the single canonical source for all tree species knowledge.
 *
 * What this migration does
 * ────────────────────────
 * 1. Drops tree_species_enrichment  — superseded by species_index + tree_species_lore
 * 2. Renames research_sources       → tree_species_sources
 * 3. Renames research_staging_entries → tree_species_research_staging
 * 4. Adds species_id FK on tree_species_research_staging → species_index
 * 5. Extends species_index with arborium / ID-flow / confidence flags
 * 6. Extends tree_species_lore with safety flags + enforced category enum
 * 7. Seeds 5 starter species into species_index (ON CONFLICT DO NOTHING)
 * 8. Seeds tree_families from hive metadata (if table exists)
 *
 * What this migration does NOT do
 * ────────────────────────────────
 * - Does not touch starterSpecies.ts or idBranches.ts (Phase 3)
 * - Does not change any UI component data sources
 * - Does not break existing Arborium, Atlas, or Ancient Friends queries
 */

-- ─── 1. Drop tree_species_enrichment ─────────────────────────────────────────
-- This table was created in 20260528120000 but is superseded by the combination
-- of species_index (identity + flags) and tree_species_lore (knowledge body).
DROP TABLE IF EXISTS public.tree_species_enrichment CASCADE;

-- ─── 2. Rename research_sources → tree_species_sources ───────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'research_sources'
  ) THEN
    ALTER TABLE public.research_sources RENAME TO tree_species_sources;
  END IF;
END $$;

-- ─── 3. Rename research_staging_entries → tree_species_research_staging ───────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'research_staging_entries'
  ) THEN
    ALTER TABLE public.research_staging_entries RENAME TO tree_species_research_staging;
  END IF;
END $$;

-- ─── 4. Add species_id FK to tree_species_research_staging ───────────────────
-- Nullable: agents may propose a brand-new species not yet in species_index.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tree_species_research_staging'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'tree_species_research_staging'
      AND column_name  = 'species_id'
  ) THEN
    ALTER TABLE public.tree_species_research_staging
      ADD COLUMN species_id UUID REFERENCES public.species_index(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_research_staging_species
      ON public.tree_species_research_staging (species_id);

    COMMENT ON COLUMN public.tree_species_research_staging.species_id IS
      'FK to species_index. NULL = agent proposes a species not yet in the trunk.';
  END IF;
END $$;

-- ─── 5. Extend species_index with arborium / ID-flow / confidence flags ───────

ALTER TABLE public.species_index
  ADD COLUMN IF NOT EXISTS arborium_visible       BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_flow_eligible        BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ancient_friends_visible BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starter_species         BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confidence_score        NUMERIC(3,2) DEFAULT 0.5
    CHECK (confidence_score >= 0 AND confidence_score <= 1);

COMMENT ON COLUMN public.species_index.arborium_visible       IS 'Show in Arborium field guide';
COMMENT ON COLUMN public.species_index.id_flow_eligible        IS 'Eligible for the two-step tree ID flow';
COMMENT ON COLUMN public.species_index.ancient_friends_visible IS 'Show in Ancient Friends encounters';
COMMENT ON COLUMN public.species_index.starter_species         IS 'One of the 5 beginner Arborium species (maps to starterSpecies.ts until Phase 3)';
COMMENT ON COLUMN public.species_index.confidence_score        IS 'Data completeness/confidence 0–1';

-- ─── 6. Extend tree_species_lore with safety flags + enforced category ────────

-- 6a. Add safety columns
ALTER TABLE public.tree_species_lore
  ADD COLUMN IF NOT EXISTS contains_medical_claims BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_caution_added   BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tree_species_lore.contains_medical_claims IS
  'True when body contains medicinal or edible claims';
COMMENT ON COLUMN public.tree_species_lore.medical_caution_added IS
  'True when the medical disclaimer has been included in the body';

-- 6b. Normalise existing freeform category values before adding the constraint.
--     Anything not in the known set falls back to ''general''.
UPDATE public.tree_species_lore
SET category = CASE
  WHEN category IN ('ecology', 'habitat', 'seasonal', 'identification',
                    'folklore', 'medicinal', 'ancient_relevance', 'general') THEN category
  WHEN category ILIKE '%ecolog%'    THEN 'ecology'
  WHEN category ILIKE '%habitat%'   THEN 'habitat'
  WHEN category ILIKE '%season%'    THEN 'seasonal'
  WHEN category ILIKE '%ident%'     THEN 'identification'
  WHEN category ILIKE '%folk%'
    OR category ILIKE '%myth%'
    OR category ILIKE '%lore%'      THEN 'folklore'
  WHEN category ILIKE '%medic%'
    OR category ILIKE '%edib%'      THEN 'medicinal'
  WHEN category ILIKE '%ancient%'   THEN 'ancient_relevance'
  ELSE 'general'
END
WHERE category NOT IN ('ecology', 'habitat', 'seasonal', 'identification',
                        'folklore', 'medicinal', 'ancient_relevance', 'general');

-- 6c. Now safe to add the CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name   = 'lore_category_check'
  ) THEN
    ALTER TABLE public.tree_species_lore
      ADD CONSTRAINT lore_category_check
        CHECK (category IN ('ecology', 'habitat', 'seasonal', 'identification',
                            'folklore', 'medicinal', 'ancient_relevance', 'general'));
  END IF;
END $$;

-- ─── 7. Seed the 5 starter species into species_index ────────────────────────
-- These map to the 5 entries in starterSpecies.ts and the 5 slugs in idBranches.ts.
-- ON CONFLICT (species_key) DO NOTHING — won't overwrite GBIF-enriched rows.

INSERT INTO public.species_index
  (species_key, common_name, canonical_common_name, scientific_name,
   family, genus, rank, slug,
   arborium_visible, id_flow_eligible, starter_species, confidence_score,
   created_at, updated_at)
VALUES
  ('Quercus robur',    'English Oak',    'English Oak',    'Quercus robur',
   'Fagaceae',   'Quercus',  'species', 'quercus-robur',
   true, true, true, 0.95, now(), now()),

  ('Taxus baccata',    'English Yew',    'English Yew',    'Taxus baccata',
   'Taxaceae',   'Taxus',    'species', 'taxus-baccata',
   true, true, true, 0.95, now(), now()),

  ('Salix babylonica', 'Weeping Willow', 'Weeping Willow', 'Salix babylonica',
   'Salicaceae', 'Salix',    'species', 'salix-babylonica',
   true, true, true, 0.90, now(), now()),

  ('Fagus sylvatica',  'Common Beech',   'Common Beech',   'Fagus sylvatica',
   'Fagaceae',   'Fagus',    'species', 'fagus-sylvatica',
   true, true, true, 0.95, now(), now()),

  ('Crataegus monogyna', 'Common Hawthorn', 'Common Hawthorn', 'Crataegus monogyna',
   'Rosaceae',   'Crataegus','species', 'crataegus-monogyna',
   true, true, true, 0.95, now(), now())

ON CONFLICT (species_key) DO UPDATE
  SET arborium_visible = true,
      id_flow_eligible  = true,
      starter_species   = true,
      updated_at        = now();

-- ─── 8. Seed tree_families from hiveUtils.ts metadata ────────────────────────
-- Only runs if tree_families exists (created in 20260528120000).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tree_families'
  ) THEN
    INSERT INTO public.tree_families
      (family_slug, common_name, latin_name, key_genera, arborium_visible, created_at, updated_at)
    VALUES
      ('fagaceae',      'Oak & Beech Hive',          'Fagaceae',      ARRAY['Quercus','Fagus','Castanea'],       true,  now(), now()),
      ('pinaceae',      'Pine & Conifer Hive',        'Pinaceae',      ARRAY['Pinus','Picea','Abies','Larix'],    false, now(), now()),
      ('rosaceae',      'Cherry & Rose Hive',         'Rosaceae',      ARRAY['Prunus','Crataegus','Sorbus'],      true,  now(), now()),
      ('betulaceae',    'Birch & Hazel Hive',         'Betulaceae',    ARRAY['Betula','Corylus','Alnus'],         false, now(), now()),
      ('salicaceae',    'Willow & Poplar Hive',       'Salicaceae',    ARRAY['Salix','Populus'],                  true,  now(), now()),
      ('cupressaceae',  'Cypress & Redwood Hive',     'Cupressaceae',  ARRAY['Cupressus','Juniperus','Sequoia'],  false, now(), now()),
      ('sapindaceae',   'Maple & Sycamore Hive',      'Sapindaceae',   ARRAY['Acer'],                             false, now(), now()),
      ('oleaceae',      'Ash & Olive Hive',           'Oleaceae',      ARRAY['Fraxinus','Olea'],                  false, now(), now()),
      ('taxaceae',      'Yew Hive',                   'Taxaceae',      ARRAY['Taxus'],                            true,  now(), now()),
      ('malvaceae',     'Lime & Baobab Hive',         'Malvaceae',     ARRAY['Tilia','Adansonia'],                false, now(), now()),
      ('ulmaceae',      'Elm & Zelkova Hive',         'Ulmaceae',      ARRAY['Ulmus','Zelkova'],                  false, now(), now()),
      ('platanaceae',   'Plane Hive',                 'Platanaceae',   ARRAY['Platanus'],                         false, now(), now()),
      ('moraceae',      'Fig & Banyan Hive',          'Moraceae',      ARRAY['Ficus','Morus'],                    false, now(), now()),
      ('magnoliaceae',  'Magnolia Hive',              'Magnoliaceae',  ARRAY['Magnolia','Liriodendron'],          false, now(), now()),
      ('araucariaceae', 'Monkey Puzzle Hive',         'Araucariaceae', ARRAY['Araucaria','Agathis'],              false, now(), now()),
      ('juglandaceae',  'Walnut Hive',                'Juglandaceae',  ARRAY['Juglans','Carya'],                  false, now(), now()),
      ('myrtaceae',     'Eucalyptus & Pohutukawa Hive','Myrtaceae',    ARRAY['Eucalyptus','Metrosideros'],        false, now(), now()),
      ('ginkgoaceae',   'Ginkgo Hive',                'Ginkgoaceae',   ARRAY['Ginkgo'],                           false, now(), now()),
      ('fabaceae',      'Legume Tree Hive',           'Fabaceae',      ARRAY['Acacia','Albizia','Colophospermum'],false, now(), now()),
      ('lauraceae',     'Camphor & Laurel Hive',      'Lauraceae',     ARRAY['Cinnamomum','Laurus'],              false, now(), now()),
      ('arecaceae',     'Palm Hive',                  'Arecaceae',     ARRAY['Copernicia','Mauritia'],            false, now(), now()),
      ('bignoniaceae',  'Trumpet Tree Hive',          'Bignoniaceae',  ARRAY['Jacaranda'],                        false, now(), now()),
      ('meliaceae',     'Mahogany & Cedar Hive',      'Meliaceae',     ARRAY['Swietenia','Cedrela'],              false, now(), now()),
      ('podocarpaceae', 'Yellowwood Hive',            'Podocarpaceae', ARRAY['Podocarpus','Prumnopitys'],         false, now(), now())

    ON CONFLICT (family_slug) DO NOTHING;
  END IF;
END $$;

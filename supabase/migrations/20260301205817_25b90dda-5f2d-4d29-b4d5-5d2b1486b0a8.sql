
-- ═══════════════════════════════════════════════════════════════
-- 1. COUNCILS table — brings Council of Life into the database
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.councils (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'global',          -- global | country | bio_region | species | city
  scope_ref TEXT,                                 -- e.g. country slug, bio_region id, species family
  meeting_cadence TEXT DEFAULT 'lunar',           -- lunar | monthly | quarterly
  telegram_link TEXT,
  notion_link TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',          -- active | dormant | founding
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction: councils ↔ trees
CREATE TABLE IF NOT EXISTS public.council_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  council_id UUID NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(council_id, tree_id)
);

-- Junction: councils ↔ bio_regions
CREATE TABLE IF NOT EXISTS public.council_bio_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  council_id UUID NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  bio_region_id TEXT NOT NULL REFERENCES public.bio_regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(council_id, bio_region_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_council_trees_council ON public.council_trees(council_id);
CREATE INDEX IF NOT EXISTS idx_council_trees_tree ON public.council_trees(tree_id);
CREATE INDEX IF NOT EXISTS idx_council_bio_regions_council ON public.council_bio_regions(council_id);
CREATE INDEX IF NOT EXISTS idx_councils_scope ON public.councils(scope);

-- ═══════════════════════════════════════════════════════════════
-- 2. SPECIES_HIVES table — normalises hive registry into DB
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.species_hives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  family_name TEXT NOT NULL,                     -- botanical family e.g. Arecaceae
  icon TEXT DEFAULT '🌳',
  description TEXT,
  species_patterns TEXT[] NOT NULL DEFAULT '{}', -- ILIKE patterns for matching trees
  tree_count INTEGER NOT NULL DEFAULT 0,
  governance_status TEXT NOT NULL DEFAULT 'emerging', -- emerging | active | governed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction: species_hives ↔ bio_regions (distribution mapping)
CREATE TABLE IF NOT EXISTS public.hive_bio_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hive_id UUID NOT NULL REFERENCES public.species_hives(id) ON DELETE CASCADE,
  bio_region_id TEXT NOT NULL REFERENCES public.bio_regions(id) ON DELETE CASCADE,
  tree_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hive_id, bio_region_id)
);

CREATE INDEX IF NOT EXISTS idx_hive_bio_regions_hive ON public.hive_bio_regions(hive_id);
CREATE INDEX IF NOT EXISTS idx_species_hives_slug ON public.species_hives(slug);

-- ═══════════════════════════════════════════════════════════════
-- 3. Add comment deprecating trees.bioregion text column
-- ═══════════════════════════════════════════════════════════════
COMMENT ON COLUMN public.trees.bioregion IS 'DEPRECATED: Use bio_region_trees junction table instead. Will be removed in future migration.';

-- ═══════════════════════════════════════════════════════════════
-- 4. RLS policies — public read, authenticated write
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_bio_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_bio_regions ENABLE ROW LEVEL SECURITY;

-- Public read for all
CREATE POLICY "Anyone can read councils" ON public.councils FOR SELECT USING (true);
CREATE POLICY "Anyone can read council_trees" ON public.council_trees FOR SELECT USING (true);
CREATE POLICY "Anyone can read council_bio_regions" ON public.council_bio_regions FOR SELECT USING (true);
CREATE POLICY "Anyone can read species_hives" ON public.species_hives FOR SELECT USING (true);
CREATE POLICY "Anyone can read hive_bio_regions" ON public.hive_bio_regions FOR SELECT USING (true);

-- Authenticated insert for councils/junction
CREATE POLICY "Auth users can create councils" ON public.councils FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can link council trees" ON public.council_trees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can link council bio_regions" ON public.council_bio_regions FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-update timestamp trigger
CREATE TRIGGER councils_updated_at BEFORE UPDATE ON public.councils
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER species_hives_updated_at BEFORE UPDATE ON public.species_hives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

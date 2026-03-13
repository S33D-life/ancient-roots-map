
-- Tree Data Commons: three core tables

-- 1. Data Sources registry
CREATE TABLE public.tree_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  country TEXT,
  scope TEXT NOT NULL DEFAULT 'national',
  source_type TEXT NOT NULL DEFAULT 'mixed',
  data_format TEXT NOT NULL DEFAULT 'manual',
  license TEXT,
  update_frequency TEXT,
  integration_status TEXT NOT NULL DEFAULT 'not_integrated',
  last_checked TIMESTAMPTZ,
  notes TEXT,
  species_keys TEXT[] DEFAULT '{}',
  record_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Datasets (one source can produce multiple datasets)
CREATE TABLE public.tree_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.tree_data_sources(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tree_count INTEGER DEFAULT 0,
  regions_covered TEXT[] DEFAULT '{}',
  species_coverage TEXT[] DEFAULT '{}',
  map_layer_key TEXT,
  map_layer_enabled BOOLEAN DEFAULT false,
  ledger_linked BOOLEAN DEFAULT false,
  last_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crawl / integration tasks
CREATE TABLE public.tree_crawl_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.tree_data_sources(id) ON DELETE CASCADE NOT NULL,
  country TEXT,
  crawl_type TEXT NOT NULL DEFAULT 'manual',
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'discovered',
  last_attempt TIMESTAMPTZ,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tree_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_crawl_tasks ENABLE ROW LEVEL SECURITY;

-- Public read access for all three tables
CREATE POLICY "Public read tree_data_sources" ON public.tree_data_sources FOR SELECT USING (true);
CREATE POLICY "Public read tree_datasets" ON public.tree_datasets FOR SELECT USING (true);
CREATE POLICY "Public read tree_crawl_tasks" ON public.tree_crawl_tasks FOR SELECT USING (true);

-- Authenticated users can insert sources (contribution portal)
CREATE POLICY "Auth insert tree_data_sources" ON public.tree_data_sources FOR INSERT TO authenticated WITH CHECK (true);

-- Only curators can update/delete
CREATE POLICY "Curator update tree_data_sources" ON public.tree_data_sources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Curator delete tree_data_sources" ON public.tree_data_sources FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Curator manage tree_datasets" ON public.tree_datasets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'curator'));
CREATE POLICY "Curator manage tree_crawl_tasks" ON public.tree_crawl_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'curator'));

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_data_source()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.scope NOT IN ('global', 'national', 'regional', 'local') THEN
    RAISE EXCEPTION 'Invalid scope: %', NEW.scope;
  END IF;
  IF NEW.source_type NOT IN ('ancient', 'champion', 'species', 'urban', 'mixed', 'heritage', 'research') THEN
    RAISE EXCEPTION 'Invalid source_type: %', NEW.source_type;
  END IF;
  IF NEW.data_format NOT IN ('api', 'csv', 'json', 'scrape', 'manual', 'geojson') THEN
    RAISE EXCEPTION 'Invalid data_format: %', NEW.data_format;
  END IF;
  IF NEW.integration_status NOT IN ('not_integrated', 'queued', 'crawling', 'parsed', 'normalised', 'geocoded', 'published', 'needs_review') THEN
    RAISE EXCEPTION 'Invalid integration_status: %', NEW.integration_status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_tree_data_source
  BEFORE INSERT OR UPDATE ON public.tree_data_sources
  FOR EACH ROW EXECUTE FUNCTION public.validate_tree_data_source();

CREATE OR REPLACE FUNCTION public.validate_tree_crawl_task()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('discovered', 'queued', 'crawling', 'parsing', 'geocoding', 'species_matching', 'manual_review', 'ready_to_publish') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_tree_crawl_task
  BEFORE INSERT OR UPDATE ON public.tree_crawl_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_tree_crawl_task();

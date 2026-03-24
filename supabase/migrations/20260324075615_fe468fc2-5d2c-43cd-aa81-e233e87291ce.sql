
-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 1: Hot-data view for map browsing (lightweight)
-- ═══════════════════════════════════════════════════════════════════

-- Materialized view: only the columns needed for map markers
CREATE MATERIALIZED VIEW IF NOT EXISTS public.trees_map_hot AS
SELECT
  t.id,
  t.name,
  t.species,
  t.latitude,
  t.longitude,
  t.created_by,
  t.nation,
  t.estimated_age,
  t.what3words,
  t.lineage,
  t.project_name,
  t.photo_thumb_url,
  t.merged_into_tree_id,
  t.girth_cm,
  COALESCE(oc.cnt, 0)::int AS offering_count,
  oc.first_photo AS offering_photo
FROM public.trees t
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt,
         MIN(CASE WHEN o.type = 'photo' AND o.media_url IS NOT NULL THEN o.media_url END) AS first_photo
  FROM public.offerings o WHERE o.tree_id = t.id
) oc ON true
WHERE t.latitude IS NOT NULL
  AND t.longitude IS NOT NULL
  AND t.merged_into_tree_id IS NULL;

-- Spatial index on the materialized view
CREATE INDEX IF NOT EXISTS idx_trees_map_hot_coords
  ON public.trees_map_hot (latitude, longitude);

-- Composite index for bounding-box queries
CREATE INDEX IF NOT EXISTS idx_trees_map_hot_bbox
  ON public.trees_map_hot (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Species index for filtered queries
CREATE INDEX IF NOT EXISTS idx_trees_map_hot_species
  ON public.trees_map_hot (species);

-- Unique index needed for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_trees_map_hot_id
  ON public.trees_map_hot (id);

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 2: Spatial index on main trees table
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_trees_lat_lng
  ON public.trees (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trees_species_lower
  ON public.trees (lower(species));

-- Index for merged tree lookups
CREATE INDEX IF NOT EXISTS idx_trees_merged_into
  ON public.trees (merged_into_tree_id)
  WHERE merged_into_tree_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 3: Viewport-bounded RPC for map queries
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_trees_in_viewport(
  p_south numeric,
  p_west numeric,
  p_north numeric,
  p_east numeric,
  p_limit integer DEFAULT 500
)
RETURNS TABLE(
  id uuid,
  name text,
  species text,
  latitude numeric,
  longitude numeric,
  created_by uuid,
  nation text,
  estimated_age integer,
  what3words text,
  lineage text,
  project_name text,
  photo_thumb_url text,
  girth_cm numeric,
  offering_count integer,
  offering_photo text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    id, name, species, latitude, longitude, created_by, nation,
    estimated_age, what3words, lineage, project_name, photo_thumb_url,
    girth_cm, offering_count, offering_photo
  FROM public.trees_map_hot
  WHERE latitude >= p_south
    AND latitude <= p_north
    AND longitude >= p_west
    AND longitude <= p_east
  LIMIT p_limit;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 4: Background job queue table
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 5,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_pending
  ON public.background_jobs (status, priority, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_background_jobs_type
  ON public.background_jobs (job_type, status);

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 5: Compute metrics tracking
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.compute_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_key text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  metadata jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compute_metrics_type_time
  ON public.compute_metrics (metric_type, recorded_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 6: Function to refresh materialized view
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.refresh_trees_map_hot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.trees_map_hot;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- SCALING LAYER 7: Auto-queue background jobs on tree events
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.queue_tree_background_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Queue materialized view refresh (deduped by scheduled_for window)
  INSERT INTO public.background_jobs (job_type, payload, scheduled_for)
  VALUES ('refresh_map_view', jsonb_build_object('tree_id', NEW.id), now() + interval '30 seconds')
  ON CONFLICT DO NOTHING;

  -- Queue duplicate detection for new trees with coordinates
  IF TG_OP = 'INSERT' AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    INSERT INTO public.background_jobs (job_type, payload, priority)
    VALUES ('duplicate_check', jsonb_build_object(
      'tree_id', NEW.id,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'species', NEW.species,
      'name', NEW.name
    ), 3);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_tree_background_jobs
  AFTER INSERT OR UPDATE ON public.trees
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_tree_background_jobs();

-- Enable RLS on new tables
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_metrics ENABLE ROW LEVEL SECURITY;

-- Background jobs: only system/admin access (no user-facing policies needed)
-- Compute metrics: read-only for authenticated users
CREATE POLICY "Authenticated users can view compute metrics"
  ON public.compute_metrics FOR SELECT TO authenticated
  USING (true);

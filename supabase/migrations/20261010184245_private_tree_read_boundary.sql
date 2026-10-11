BEGIN;

-- Current-caller-only lookup avoids trees -> grants -> trees RLS recursion.
-- No caller-supplied user ID; this returns a permission boolean, never a record.
CREATE FUNCTION public.can_read_tree_record(p_tree_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trees t
    WHERE t.id = p_tree_id AND (
      t.accessibility_tier = 'public'::public.tree_accessibility_tier
      OR (auth.uid() IS NOT NULL AND (
        t.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'curator'::public.app_role)
        OR EXISTS (SELECT 1 FROM public.tree_access_grants g
                   WHERE g.tree_id = t.id AND g.user_id = auth.uid())
      ))
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_read_tree_record(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_tree_record(uuid) TO anon, authenticated;

-- Fail rather than silently leaving an unknown permissive SELECT policy live.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'trees' AND cmd IN ('SELECT', 'ALL')
    AND policyname <> 'Trees are viewable by everyone') THEN
    RAISE EXCEPTION 'Unexpected tree SELECT policy: review before applying';
  END IF;
END $$;
ALTER POLICY "Trees are viewable by everyone" ON public.trees
  TO anon, authenticated USING (public.can_read_tree_record(id));

-- Historical copies must follow the same parent-tree boundary.
ALTER POLICY "Anyone can view tree edit history" ON public.tree_edit_history
  USING (public.can_read_tree_record(tree_id));
ALTER POLICY "Anyone can view change log" ON public.tree_change_log
  USING (public.can_read_tree_record(tree_id));

-- The cache has no RLS and contains unfiltered media. Keep it inaccessible
-- and query current authorized rows so privacy changes take effect immediately.
REVOKE SELECT ON public.trees_map_hot FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.get_trees_in_viewport(
  p_south numeric, p_west numeric, p_north numeric, p_east numeric,
  p_limit integer DEFAULT 500
)
RETURNS TABLE(id uuid, name text, species text, latitude numeric,
  longitude numeric, created_by uuid, nation text, estimated_age integer,
  what3words text, lineage text, project_name text, photo_thumb_url text,
  girth_cm numeric, offering_count integer, offering_photo text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT t.id, t.name, t.species, t.latitude, t.longitude, t.created_by,
    t.nation, t.estimated_age, t.what3words, t.lineage, t.project_name,
    t.photo_thumb_url, t.girth_cm, oc.cnt::integer, oc.first_photo
  FROM public.trees t
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt,
      min(CASE WHEN o.type = 'photo'::public.offering_type
                    AND o.media_url IS NOT NULL THEN o.media_url END) AS first_photo
    FROM public.offerings o WHERE o.tree_id = t.id
  ) oc ON true
  WHERE t.latitude >= p_south AND t.latitude <= p_north
    AND t.longitude >= p_west AND t.longitude <= p_east
    AND t.merged_into_tree_id IS NULL
  LIMIT p_limit;
$$;
ALTER FUNCTION public.get_bio_region_trees(text) SECURITY INVOKER;
ALTER FUNCTION public.get_tree_presence_summary(double precision, double precision,
  double precision, double precision) SECURITY INVOKER;
ALTER POLICY "Authenticated users can view seeds" ON public.planted_seeds
  USING (public.can_read_tree_record(tree_id));

-- A definer proposal routine copies old field values into the author's record.
-- Require existing read authority before either source/merge-target lookup.
DO $$ DECLARE definition text; BEGIN
  SELECT pg_get_functiondef('public.submit_tree_change_proposal(uuid,text,jsonb,text,jsonb,text,uuid,uuid)'::regprocedure)
    INTO definition;
  IF position('SELECT * INTO t FROM public.trees WHERE id = _tree_id;' IN definition) = 0
    OR position('IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = _merge_target_tree_id)' IN definition) = 0 THEN
    RAISE EXCEPTION 'Proposal function differs from reviewed live source';
  END IF;
  definition := replace(definition,
    'SELECT * INTO t FROM public.trees WHERE id = _tree_id;',
    'SELECT * INTO t FROM public.trees WHERE id = _tree_id AND public.can_read_tree_record(id);');
  definition := replace(definition,
    'IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = _merge_target_tree_id)',
    'IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = _merge_target_tree_id AND public.can_read_tree_record(id))');
  EXECUTE definition;
END $$;

COMMIT;

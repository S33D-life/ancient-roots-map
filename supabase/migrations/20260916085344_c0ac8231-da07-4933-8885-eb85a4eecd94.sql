ALTER TABLE public.grove_roots
  ADD COLUMN signature_strokes jsonb;

ALTER TABLE public.grove_roots
  ADD CONSTRAINT grove_roots_signature_strokes_shape
  CHECK (
    signature_strokes IS NULL
    OR (jsonb_typeof(signature_strokes) = 'array' AND octet_length(signature_strokes::text) <= 20000)
  );

CREATE OR REPLACE FUNCTION public.is_valid_root_signature(p_strokes jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  v_stroke jsonb;
  v_point jsonb;
  v_stroke_count integer := 0;
  v_point_count integer := 0;
  v_x numeric;
  v_y numeric;
BEGIN
  IF p_strokes IS NULL THEN RETURN true; END IF;
  IF jsonb_typeof(p_strokes) <> 'array' OR jsonb_array_length(p_strokes) = 0 OR jsonb_array_length(p_strokes) > 12 THEN
    RETURN false;
  END IF;
  FOR v_stroke IN SELECT value FROM jsonb_array_elements(p_strokes)
  LOOP
    v_stroke_count := v_stroke_count + 1;
    IF jsonb_typeof(v_stroke) <> 'array' OR jsonb_array_length(v_stroke) < 2 OR jsonb_array_length(v_stroke) > 200 THEN
      RETURN false;
    END IF;
    FOR v_point IN SELECT value FROM jsonb_array_elements(v_stroke)
    LOOP
      v_point_count := v_point_count + 1;
      IF jsonb_typeof(v_point) <> 'object'
         OR jsonb_typeof(v_point->'x') <> 'number'
         OR jsonb_typeof(v_point->'y') <> 'number' THEN
        RETURN false;
      END IF;
      v_x := (v_point->>'x')::numeric;
      v_y := (v_point->>'y')::numeric;
      IF v_x < 0 OR v_x > 1 OR v_y < 0 OR v_y > 1 THEN RETURN false; END IF;
    END LOOP;
  END LOOP;
  RETURN v_stroke_count > 0 AND v_point_count <= 1200;
EXCEPTION WHEN others THEN
  RETURN false;
END $fn$;

REVOKE ALL ON FUNCTION public.is_valid_root_signature(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_root_signature(jsonb) TO service_role;

DROP FUNCTION IF EXISTS public.create_grove_root(uuid,uuid,text,text,text,text,text,text);
CREATE FUNCTION public.create_grove_root(
  p_grove_id uuid,
  p_tree_id uuid,
  p_inscription_text text DEFAULT NULL,
  p_dedication text DEFAULT NULL,
  p_inscription_visibility text DEFAULT 'private',
  p_portal_disclosure text DEFAULT 'mark_only',
  p_entry_mode text DEFAULT 'members_only',
  p_root_type text DEFAULT 'ancestral',
  p_signature_strokes jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_steward boolean; v_auto boolean; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_steward := public.is_grove_steward(p_grove_id, v_uid);
  IF NOT v_steward AND NOT public.is_grove_contributor(p_grove_id, v_uid) THEN RAISE EXCEPTION 'contributor_only'; END IF;
  IF NOT public.is_valid_root_signature(p_signature_strokes) THEN RAISE EXCEPTION 'invalid_signature'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = p_tree_id AND merged_into_tree_id IS NULL) THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  IF EXISTS (SELECT 1 FROM public.grove_roots WHERE life_grove_id = p_grove_id AND tree_id = p_tree_id AND status IN ('proposed','pending','active')) THEN
    RAISE EXCEPTION 'root_already_exists';
  END IF;

  v_auto := v_steward AND public.is_tree_root_authority(p_tree_id, v_uid);
  v_status := CASE WHEN NOT v_steward THEN 'proposed' WHEN v_auto THEN 'active' ELSE 'pending' END;

  INSERT INTO public.grove_roots (
    life_grove_id, tree_id, root_type, created_by, inscription_text, dedication,
    inscription_visibility, portal_disclosure, entry_mode, signature_strokes,
    status, reviewed_by, reviewed_at)
  VALUES (
    p_grove_id, p_tree_id, COALESCE(p_root_type,'ancestral'), v_uid,
    NULLIF(btrim(p_inscription_text),''), NULLIF(btrim(p_dedication),''),
    COALESCE(p_inscription_visibility,'private'), COALESCE(p_portal_disclosure,'mark_only'),
    COALESCE(p_entry_mode,'members_only'), p_signature_strokes, v_status,
    CASE WHEN v_auto THEN v_uid END, CASE WHEN v_auto THEN now() END)
  RETURNING id INTO v_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
  VALUES (v_id, v_uid,
    CASE WHEN v_status = 'proposed' THEN 'suggested' WHEN v_auto THEN 'created_and_welcomed' ELSE 'created' END,
    jsonb_build_object('tree_id', p_tree_id, 'life_grove_id', p_grove_id, 'status', v_status,
      'has_handwritten_mark', p_signature_strokes IS NOT NULL));
  RETURN v_id;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.create_grove_root(uuid,uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_grove_root(uuid,uuid,text,text,text,text,text,text,jsonb) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.tend_grove_root_inscription(uuid,text,text,text,text,text);
CREATE FUNCTION public.tend_grove_root_inscription(
  p_root_id uuid,
  p_inscription_text text DEFAULT NULL,
  p_dedication text DEFAULT NULL,
  p_inscription_visibility text DEFAULT NULL,
  p_portal_disclosure text DEFAULT NULL,
  p_entry_mode text DEFAULT NULL,
  p_signature_strokes jsonb DEFAULT NULL,
  p_clear_signature boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid := auth.uid(); r record; v_signature_changed boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT public.is_grove_steward(r.life_grove_id, v_uid) THEN RAISE EXCEPTION 'steward_only'; END IF;
  IF r.status NOT IN ('pending','active') THEN RAISE EXCEPTION 'root_not_live'; END IF;
  IF p_signature_strokes IS NOT NULL AND NOT public.is_valid_root_signature(p_signature_strokes) THEN RAISE EXCEPTION 'invalid_signature'; END IF;
  v_signature_changed := p_clear_signature OR p_signature_strokes IS NOT NULL;

  UPDATE public.grove_roots SET
    inscription_text = COALESCE(NULLIF(btrim(p_inscription_text),''), inscription_text),
    dedication = COALESCE(NULLIF(btrim(p_dedication),''), dedication),
    inscription_visibility = COALESCE(p_inscription_visibility, inscription_visibility),
    portal_disclosure = COALESCE(p_portal_disclosure, portal_disclosure),
    entry_mode = COALESCE(p_entry_mode, entry_mode),
    signature_strokes = CASE WHEN p_clear_signature THEN NULL WHEN p_signature_strokes IS NOT NULL THEN p_signature_strokes ELSE signature_strokes END,
    updated_at = now()
  WHERE id = p_root_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
  VALUES (p_root_id, v_uid, 'tended', jsonb_build_object(
    'inscription_text_changed', p_inscription_text IS NOT NULL,
    'handwritten_mark_changed', v_signature_changed,
    'handwritten_mark_removed', p_clear_signature));
END $fn$;

REVOKE EXECUTE ON FUNCTION public.tend_grove_root_inscription(uuid,text,text,text,text,text,jsonb,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tend_grove_root_inscription(uuid,text,text,text,text,text,jsonb,boolean) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.list_tree_inscriptions(uuid);
CREATE FUNCTION public.list_tree_inscriptions(p_tree_id uuid)
RETURNS TABLE (
  root_id uuid, life_grove_id uuid, inscription_text text, inscription_style text,
  signature_strokes jsonb, remembered_name text, grove_title text, dedication text,
  rooted_year int, can_enter boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, r.life_grove_id, COALESCE(NULLIF(btrim(r.inscription_text),''), '·'),
         r.inscription_style, r.signature_strokes,
         CASE WHEN r.portal_disclosure = 'named' OR public.is_grove_contributor(r.life_grove_id, auth.uid()) THEN g.remembered_or_celebrated_name END,
         CASE WHEN r.portal_disclosure = 'named' OR public.is_grove_contributor(r.life_grove_id, auth.uid()) THEN g.grove_title END,
         CASE WHEN r.portal_disclosure = 'named' OR public.is_grove_contributor(r.life_grove_id, auth.uid()) THEN r.dedication END,
         EXTRACT(YEAR FROM r.created_at)::int,
         public.can_view_life_grove(r.life_grove_id, auth.uid())
           AND (r.entry_mode = 'as_grove_permits' OR public.is_grove_contributor(r.life_grove_id, auth.uid()))
  FROM public.grove_roots r
  JOIN public.life_groves g ON g.id = r.life_grove_id
  WHERE r.tree_id = p_tree_id
    AND r.status = 'active'
    AND (r.inscription_visibility = 'public' OR public.is_grove_contributor(r.life_grove_id, auth.uid()))
  ORDER BY r.created_at ASC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.list_tree_inscriptions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tree_inscriptions(uuid) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.list_grove_roots(uuid);
CREATE FUNCTION public.list_grove_roots(p_grove_id uuid)
RETURNS TABLE(
  root_id uuid, tree_id uuid, tree_name text, tree_species text, status text,
  inscription_text text, signature_strokes jsonb, inscription_visibility text,
  portal_disclosure text, entry_mode text, review_note text, created_by uuid, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, r.tree_id, t.name, t.species, r.status, r.inscription_text,
         r.signature_strokes, r.inscription_visibility, r.portal_disclosure, r.entry_mode,
         r.review_note, r.created_by, r.created_at
  FROM public.grove_roots r
  JOIN public.trees t ON t.id = r.tree_id
  WHERE r.life_grove_id = p_grove_id
    AND public.is_grove_contributor(p_grove_id, auth.uid())
    AND r.status <> 'removed'
  ORDER BY r.created_at ASC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.list_grove_roots(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_grove_roots(uuid) TO authenticated, service_role;
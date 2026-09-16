CREATE OR REPLACE FUNCTION public.create_grove_root(
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
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_steward boolean; v_auto boolean; v_status text; v_root_type text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_steward := public.is_grove_steward(p_grove_id, v_uid);
  IF NOT v_steward AND NOT public.is_grove_contributor(p_grove_id, v_uid) THEN RAISE EXCEPTION 'contributor_only'; END IF;
  IF NOT public.is_valid_root_signature(p_signature_strokes) THEN RAISE EXCEPTION 'invalid_signature'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = p_tree_id AND merged_into_tree_id IS NULL) THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  IF EXISTS (SELECT 1 FROM public.grove_roots WHERE life_grove_id = p_grove_id AND tree_id = p_tree_id AND status IN ('proposed','pending','active')) THEN
    RAISE EXCEPTION 'root_already_exists';
  END IF;

  v_root_type := COALESCE(NULLIF(btrim(p_root_type), ''), 'ancestral');
  IF v_root_type NOT IN ('ancestral','family','birth','union','community') THEN
    RAISE EXCEPTION 'invalid_root_type';
  END IF;

  v_auto := v_steward AND public.is_tree_root_authority(p_tree_id, v_uid);
  v_status := CASE WHEN NOT v_steward THEN 'proposed' WHEN v_auto THEN 'active' ELSE 'pending' END;

  INSERT INTO public.grove_roots (
    life_grove_id, tree_id, root_type, created_by, inscription_text, dedication,
    inscription_visibility, portal_disclosure, entry_mode, signature_strokes,
    status, reviewed_by, reviewed_at)
  VALUES (
    p_grove_id, p_tree_id, v_root_type, v_uid,
    NULLIF(btrim(p_inscription_text),''), NULLIF(btrim(p_dedication),''),
    COALESCE(p_inscription_visibility,'private'), COALESCE(p_portal_disclosure,'mark_only'),
    COALESCE(p_entry_mode,'members_only'), p_signature_strokes, v_status,
    CASE WHEN v_auto THEN v_uid END, CASE WHEN v_auto THEN now() END)
  RETURNING id INTO v_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
  VALUES (v_id, v_uid,
    CASE WHEN v_status = 'proposed' THEN 'suggested' WHEN v_auto THEN 'created_and_welcomed' ELSE 'created' END,
    jsonb_build_object('tree_id', p_tree_id, 'life_grove_id', p_grove_id, 'root_type', v_root_type,
      'status', v_status, 'has_handwritten_mark', p_signature_strokes IS NOT NULL));
  RETURN v_id;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.create_grove_root(uuid,uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_grove_root(uuid,uuid,text,text,text,text,text,text,jsonb) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.list_tree_inscriptions(uuid);
CREATE FUNCTION public.list_tree_inscriptions(p_tree_id uuid)
RETURNS TABLE (
  root_id uuid, life_grove_id uuid, root_type text, inscription_text text, inscription_style text,
  signature_strokes jsonb, remembered_name text, grove_title text, dedication text,
  rooted_year int, can_enter boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, r.life_grove_id, r.root_type, COALESCE(NULLIF(btrim(r.inscription_text),''), '·'),
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
  root_id uuid, tree_id uuid, tree_name text, tree_species text, root_type text, status text,
  inscription_text text, signature_strokes jsonb, inscription_visibility text,
  portal_disclosure text, entry_mode text, review_note text, created_by uuid, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, r.tree_id, t.name, t.species, r.root_type, r.status, r.inscription_text,
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
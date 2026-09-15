
-- A suggestion is a root that has not yet been taken up by a steward.
ALTER TABLE public.grove_roots DROP CONSTRAINT grove_roots_status_check;
ALTER TABLE public.grove_roots ADD CONSTRAINT grove_roots_status_check
  CHECK (status = ANY (ARRAY['proposed','pending','active','declined','removed']));

DROP INDEX IF EXISTS public.grove_roots_live_pair_idx;
CREATE UNIQUE INDEX grove_roots_live_pair_idx ON public.grove_roots (life_grove_id, tree_id)
  WHERE status IN ('proposed','pending','active');

-- Creation: stewards begin a root; other welcomed contributors suggest one.
CREATE OR REPLACE FUNCTION public.create_grove_root(
  p_grove_id uuid, p_tree_id uuid,
  p_inscription_text text DEFAULT NULL, p_dedication text DEFAULT NULL,
  p_inscription_visibility text DEFAULT 'private',
  p_portal_disclosure text DEFAULT 'mark_only',
  p_entry_mode text DEFAULT 'members_only',
  p_root_type text DEFAULT 'ancestral')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_steward boolean; v_auto boolean; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_steward := public.is_grove_steward(p_grove_id, v_uid);
  IF NOT v_steward AND NOT public.is_grove_contributor(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'contributor_only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = p_tree_id AND merged_into_tree_id IS NULL) THEN
    RAISE EXCEPTION 'tree_not_found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.grove_roots
              WHERE life_grove_id = p_grove_id AND tree_id = p_tree_id
                AND status IN ('proposed','pending','active')) THEN
    RAISE EXCEPTION 'root_already_exists';
  END IF;

  -- Only a steward's own root may travel on at once, and only reaches the
  -- Ancient Friend straight away when that steward already keeps it.
  v_auto := v_steward AND public.is_tree_root_authority(p_tree_id, v_uid);
  v_status := CASE WHEN NOT v_steward THEN 'proposed'
                   WHEN v_auto THEN 'active' ELSE 'pending' END;

  INSERT INTO public.grove_roots (
    life_grove_id, tree_id, root_type, created_by,
    inscription_text, dedication,
    inscription_visibility, portal_disclosure, entry_mode,
    status, reviewed_by, reviewed_at)
  VALUES (
    p_grove_id, p_tree_id, COALESCE(p_root_type,'ancestral'), v_uid,
    NULLIF(btrim(p_inscription_text),''), NULLIF(btrim(p_dedication),''),
    COALESCE(p_inscription_visibility,'private'),
    COALESCE(p_portal_disclosure,'mark_only'),
    COALESCE(p_entry_mode,'members_only'),
    v_status,
    CASE WHEN v_auto THEN v_uid END,
    CASE WHEN v_auto THEN now() END)
  RETURNING id INTO v_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
  VALUES (v_id, v_uid,
          CASE WHEN v_status = 'proposed' THEN 'suggested'
               WHEN v_auto THEN 'created_and_welcomed' ELSE 'created' END,
          jsonb_build_object('tree_id', p_tree_id, 'life_grove_id', p_grove_id, 'status', v_status));
  RETURN v_id;
END $fn$;

-- A grove steward takes up, or sets aside, a suggested root.
CREATE OR REPLACE FUNCTION public.review_grove_root_proposal(
  p_root_id uuid, p_decision text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid := auth.uid(); r record; v_auto boolean; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_decision NOT IN ('accept','decline') THEN RAISE EXCEPTION 'bad_decision'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT public.is_grove_steward(r.life_grove_id, v_uid) THEN RAISE EXCEPTION 'steward_only'; END IF;
  IF r.status <> 'proposed' THEN RAISE EXCEPTION 'not_a_suggestion'; END IF;
  IF p_decision = 'decline' AND COALESCE(btrim(p_note),'') = '' THEN RAISE EXCEPTION 'reason_required'; END IF;

  IF p_decision = 'decline' THEN
    UPDATE public.grove_roots
       SET status = 'declined', reviewed_by = v_uid, reviewed_at = now(),
           review_note = NULLIF(btrim(p_note),''), updated_at = now()
     WHERE id = p_root_id;
    INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, note, detail)
    VALUES (p_root_id, v_uid, 'suggestion_declined', NULLIF(btrim(p_note),''),
            jsonb_build_object('from','proposed'));
    RETURN;
  END IF;

  -- Taken up. It reaches the Ancient Friend at once only where this steward
  -- independently keeps that tree; otherwise it waits to be welcomed.
  v_auto := public.is_tree_root_authority(r.tree_id, v_uid);
  v_status := CASE WHEN v_auto THEN 'active' ELSE 'pending' END;

  UPDATE public.grove_roots
     SET status = v_status,
         reviewed_by = CASE WHEN v_auto THEN v_uid ELSE NULL END,
         reviewed_at = CASE WHEN v_auto THEN now() ELSE NULL END,
         review_note = NULLIF(btrim(p_note),''), updated_at = now()
   WHERE id = p_root_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, note, detail)
  VALUES (p_root_id, v_uid,
          CASE WHEN v_auto THEN 'suggestion_taken_up_and_welcomed' ELSE 'suggestion_taken_up' END,
          NULLIF(btrim(p_note),''), jsonb_build_object('from','proposed','status',v_status));
END $fn$;

-- Withdrawal: a person may let go of their own suggestion.
CREATE OR REPLACE FUNCTION public.remove_grove_root(p_root_id uuid, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_uid uuid := auth.uid(); r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT (public.is_grove_steward(r.life_grove_id, v_uid)
          OR public.is_tree_root_authority(r.tree_id, v_uid)
          OR (r.status = 'proposed' AND r.created_by = v_uid)) THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF r.status = 'removed' THEN RETURN; END IF;

  UPDATE public.grove_roots SET status = 'removed', updated_at = now() WHERE id = p_root_id;
  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, note, detail)
  VALUES (p_root_id, v_uid,
          CASE WHEN r.status = 'proposed' AND r.created_by = v_uid THEN 'suggestion_withdrawn'
               ELSE 'removed' END,
          NULLIF(btrim(p_note),''), jsonb_build_object('from', r.status));
END $fn$;

-- The grove's own view now names who suggested each root.
DROP FUNCTION IF EXISTS public.list_grove_roots(uuid);
CREATE FUNCTION public.list_grove_roots(p_grove_id uuid)
RETURNS TABLE(root_id uuid, tree_id uuid, tree_name text, tree_species text, status text,
              inscription_text text, inscription_visibility text, portal_disclosure text,
              entry_mode text, review_note text, created_by uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT r.id, r.tree_id, t.name, t.species, r.status, r.inscription_text,
         r.inscription_visibility, r.portal_disclosure, r.entry_mode,
         r.review_note, r.created_by, r.created_at
  FROM public.grove_roots r
  JOIN public.trees t ON t.id = r.tree_id
  WHERE r.life_grove_id = p_grove_id
    AND public.is_grove_contributor(p_grove_id, auth.uid())
    AND r.status <> 'removed'
  ORDER BY r.created_at ASC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.list_grove_roots(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_grove_root_proposal(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_grove_roots(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_grove_root_proposal(uuid, text, text) TO authenticated;

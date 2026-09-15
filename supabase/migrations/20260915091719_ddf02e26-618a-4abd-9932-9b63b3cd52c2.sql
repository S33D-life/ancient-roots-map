
CREATE OR REPLACE FUNCTION public.apply_tree_direct_edit(
  _tree_id uuid, _changes jsonb, _reason text DEFAULT NULL, _base_updated_at timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); t record; tj jsonb; k text; v text; v_old text; elig jsonb; res jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO t FROM public.trees WHERE id = _tree_id FOR UPDATE;
  IF t IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  tj := to_jsonb(t);
  elig := public.tree_edit_eligibility(_tree_id, v_uid);
  IF NOT (elig ->> 'can_direct_edit')::boolean THEN RAISE EXCEPTION 'review_required'; END IF;
  IF _base_updated_at IS NOT NULL AND t.updated_at > _base_updated_at + interval '1 second' THEN
    RAISE EXCEPTION 'stale_edit';
  END IF;

  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(_changes) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    v_old := tj ->> k;
    EXECUTE format('UPDATE public.trees SET %I = $1, updated_at = now() WHERE id = $2', k)
      USING NULLIF(v, ''), _tree_id;
    INSERT INTO public.tree_edit_history (tree_id, user_id, field_name, old_value, new_value, edit_reason, edit_type)
    VALUES (_tree_id, v_uid, k, v_old, NULLIF(v, ''), NULLIF(_reason, ''), 'direct');
  END LOOP;

  SELECT to_jsonb(x) INTO res FROM (SELECT * FROM public.trees WHERE id = _tree_id) x;
  RETURN res;
END; $$;

CREATE OR REPLACE FUNCTION public.review_tree_change_proposal(
  _proposal_id uuid, _decision text, _note text DEFAULT NULL,
  _overrides jsonb DEFAULT NULL, _acknowledge_conflict boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; t record; tj jsonb; k text; v text; v_old text;
        v_changes jsonb; v_prev jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid,'curator'::app_role) OR public.has_role(v_uid,'keeper'::app_role))
    THEN RAISE EXCEPTION 'curator_only'; END IF;
  IF _decision NOT IN ('approve','decline','needs_more_info') THEN RAISE EXCEPTION 'bad_decision'; END IF;
  IF _decision <> 'approve' AND COALESCE(btrim(_note),'') = '' THEN RAISE EXCEPTION 'note_required'; END IF;

  SELECT * INTO p FROM public.tree_edit_proposals WHERE id = _proposal_id FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'proposal_not_found'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'already_reviewed'; END IF;
  IF p.proposal_type = 'merge' AND _decision = 'approve' THEN RAISE EXCEPTION 'use_merge_review'; END IF;

  IF _decision <> 'approve' THEN
    UPDATE public.tree_edit_proposals
       SET status = CASE WHEN _decision = 'decline' THEN 'rejected' ELSE 'needs_more_info' END,
           reviewer_id = v_uid, reviewer_note = btrim(_note), reviewed_at = now(), updated_at = now()
     WHERE id = _proposal_id;
    RETURN jsonb_build_object('status', CASE WHEN _decision='decline' THEN 'rejected' ELSE 'needs_more_info' END);
  END IF;

  SELECT * INTO t FROM public.trees WHERE id = p.tree_id FOR UPDATE;
  IF t IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  tj := to_jsonb(t);
  IF NOT _acknowledge_conflict AND p.base_updated_at IS NOT NULL
     AND t.updated_at > p.base_updated_at + interval '1 second' THEN
    RAISE EXCEPTION 'stale_proposal';
  END IF;

  v_changes := COALESCE(_overrides, p.proposed_changes);
  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(v_changes) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    v_old := tj ->> k;
    v_prev := v_prev || jsonb_build_object(k, v_old);
    EXECUTE format('UPDATE public.trees SET %I = $1, updated_at = now() WHERE id = $2', k)
      USING NULLIF(v, ''), p.tree_id;
    INSERT INTO public.tree_edit_history (tree_id, user_id, field_name, old_value, new_value, edit_reason, edit_type, proposal_id)
    VALUES (p.tree_id, v_uid, k, v_old, NULLIF(v,''), COALESCE(NULLIF(btrim(_note),''), p.reason), 'proposal_accepted', p.id);
  END LOOP;

  INSERT INTO public.tree_change_log (tree_id, change_set, previous_values, merged_from_proposal_id, merged_by)
  VALUES (p.tree_id, v_changes, v_prev, p.id, v_uid);

  UPDATE public.tree_edit_proposals
     SET status = 'accepted', reviewer_id = v_uid, reviewer_note = NULLIF(btrim(_note),''),
         reviewed_at = now(), updated_at = now()
   WHERE id = _proposal_id;

  RETURN jsonb_build_object('status', 'accepted', 'applied', v_changes);
END; $$;

CREATE OR REPLACE FUNCTION public.approve_tree_merge(
  _proposal_id uuid, _surviving_tree_id uuid, _field_resolutions jsonb DEFAULT '{}'::jsonb,
  _note text DEFAULT NULL, _acknowledge_conflict boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; keep record; keepj jsonb; drop_id uuid; dropped record;
        k text; v text; v_old text; v_moved jsonb := '{}'::jsonb; n int; tbl text;
        v_tables text[] := ARRAY['offerings','birdsong_offerings','bloom_offerings','tree_checkins',
          'tree_contributions','tree_location_refinements','tree_page_views','phenology_observations',
          'stewardship_actions','tree_sources','tree_presence_completions','heart_transactions',
          'tree_growth_events','harvest_listings','nftree_mints','root_mail','meetings'];
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid,'curator'::app_role) OR public.has_role(v_uid,'keeper'::app_role))
    THEN RAISE EXCEPTION 'curator_only'; END IF;

  SELECT * INTO p FROM public.tree_edit_proposals WHERE id = _proposal_id FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'proposal_not_found'; END IF;
  IF p.proposal_type <> 'merge' THEN RAISE EXCEPTION 'not_a_merge'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'already_reviewed'; END IF;
  IF _surviving_tree_id NOT IN (p.tree_id, p.merge_target_tree_id) THEN RAISE EXCEPTION 'bad_surviving_tree'; END IF;

  drop_id := CASE WHEN _surviving_tree_id = p.tree_id THEN p.merge_target_tree_id ELSE p.tree_id END;
  SELECT * INTO keep FROM public.trees WHERE id = _surviving_tree_id FOR UPDATE;
  SELECT * INTO dropped FROM public.trees WHERE id = drop_id FOR UPDATE;
  IF keep IS NULL OR dropped IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  keepj := to_jsonb(keep);
  IF keep.merged_into_tree_id IS NOT NULL OR dropped.merged_into_tree_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_merged';
  END IF;
  IF NOT _acknowledge_conflict AND p.base_updated_at IS NOT NULL
     AND (keep.updated_at > p.base_updated_at + interval '1 second'
       OR dropped.updated_at > p.base_updated_at + interval '1 second') THEN
    RAISE EXCEPTION 'stale_proposal';
  END IF;

  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(COALESCE(_field_resolutions,'{}'::jsonb)) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    v_old := keepj ->> k;
    EXECUTE format('UPDATE public.trees SET %I = $1, updated_at = now() WHERE id = $2', k)
      USING NULLIF(v,''), _surviving_tree_id;
    INSERT INTO public.tree_edit_history (tree_id, user_id, field_name, old_value, new_value, edit_reason, edit_type, proposal_id)
    VALUES (_surviving_tree_id, v_uid, k, v_old, NULLIF(v,''), COALESCE(NULLIF(btrim(_note),''), p.reason), 'merge', p.id);
  END LOOP;

  FOREACH tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('UPDATE public.%I SET tree_id = $1 WHERE tree_id = $2', tbl)
        USING _surviving_tree_id, drop_id;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN v_moved := v_moved || jsonb_build_object(tbl, n); END IF;
    END IF;
  END LOOP;

  UPDATE public.tree_guardians g SET tree_id = _surviving_tree_id
   WHERE g.tree_id = drop_id AND NOT EXISTS (
     SELECT 1 FROM public.tree_guardians x WHERE x.tree_id = _surviving_tree_id AND x.user_id = g.user_id AND x.role = g.role);
  UPDATE public.tree_wishlist w SET tree_id = _surviving_tree_id
   WHERE w.tree_id = drop_id AND NOT EXISTS (
     SELECT 1 FROM public.tree_wishlist x WHERE x.tree_id = _surviving_tree_id AND x.user_id = w.user_id);

  UPDATE public.trees SET merged_into_tree_id = _surviving_tree_id, updated_at = now() WHERE id = drop_id;

  INSERT INTO public.tree_merge_history (primary_tree_id, secondary_tree_id, merged_by, merge_reason, data_migrated)
  VALUES (_surviving_tree_id, drop_id, v_uid,
          COALESCE(NULLIF(btrim(_note),''), p.reason),
          v_moved || jsonb_build_object('proposal_id', p.id,
            'secondary_snapshot', to_jsonb(dropped), 'primary_snapshot', keepj));

  UPDATE public.tree_edit_proposals
     SET status = 'accepted', reviewer_id = v_uid, reviewer_note = NULLIF(btrim(_note),''),
         reviewed_at = now(), updated_at = now()
   WHERE id = _proposal_id;

  UPDATE public.tree_edit_proposals
     SET status = 'superseded', reviewer_id = v_uid, reviewed_at = now(), updated_at = now(),
         reviewer_note = COALESCE(reviewer_note, 'Tree merged into another record — please review afresh.')
   WHERE tree_id = drop_id AND status = 'pending' AND id <> _proposal_id;

  RETURN jsonb_build_object('surviving_tree_id', _surviving_tree_id, 'merged_tree_id', drop_id, 'moved', v_moved);
END; $$;

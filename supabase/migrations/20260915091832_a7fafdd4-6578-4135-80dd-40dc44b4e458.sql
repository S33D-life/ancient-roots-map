
CREATE OR REPLACE FUNCTION public.approve_tree_merge(
  _proposal_id uuid, _surviving_tree_id uuid, _field_resolutions jsonb DEFAULT '{}'::jsonb,
  _note text DEFAULT NULL, _acknowledge_conflict boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; keep record; keepj jsonb; drop_id uuid; dropped record;
        k text; v text; v_old text; v_moved jsonb := '{}'::jsonb; v_kept jsonb := '{}'::jsonb;
        n int; n_skip int; tbl text; rec record;
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

  -- Move linked content. Where a record may only exist once per person and tree,
  -- the conflicting row stays with the superseded record rather than being lost
  -- or duplicated; the count is written into the merge log.
  FOREACH tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      BEGIN
        EXECUTE format('UPDATE public.%I SET tree_id = $1 WHERE tree_id = $2', tbl)
          USING _surviving_tree_id, drop_id;
        GET DIAGNOSTICS n = ROW_COUNT;
      EXCEPTION WHEN unique_violation THEN
        n := 0; n_skip := 0;
        FOR rec IN EXECUTE format('SELECT ctid AS c FROM public.%I WHERE tree_id = $1', tbl) USING drop_id LOOP
          BEGIN
            EXECUTE format('UPDATE public.%I SET tree_id = $1 WHERE ctid = $2', tbl)
              USING _surviving_tree_id, rec.c;
            n := n + 1;
          EXCEPTION WHEN unique_violation THEN n_skip := n_skip + 1;
          END;
        END LOOP;
        IF n_skip > 0 THEN v_kept := v_kept || jsonb_build_object(tbl, n_skip); END IF;
      END;
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
          v_moved || jsonb_build_object('proposal_id', p.id, 'kept_with_superseded', v_kept,
            'secondary_snapshot', to_jsonb(dropped), 'primary_snapshot', keepj));

  UPDATE public.tree_edit_proposals
     SET status = 'accepted', reviewer_id = v_uid, reviewer_note = NULLIF(btrim(_note),''),
         reviewed_at = now(), updated_at = now()
   WHERE id = _proposal_id;

  UPDATE public.tree_edit_proposals
     SET status = 'superseded', reviewer_id = v_uid, reviewed_at = now(), updated_at = now(),
         reviewer_note = COALESCE(reviewer_note, 'Tree merged into another record — please review afresh.')
   WHERE tree_id = drop_id AND status = 'pending' AND id <> _proposal_id;

  RETURN jsonb_build_object('surviving_tree_id', _surviving_tree_id, 'merged_tree_id', drop_id,
                            'moved', v_moved, 'kept_with_superseded', v_kept);
END; $$;

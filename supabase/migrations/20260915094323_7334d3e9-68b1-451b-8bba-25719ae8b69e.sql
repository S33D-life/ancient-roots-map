
CREATE OR REPLACE FUNCTION public.tree_column_type(_field text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT format_type(a.atttypid, a.atttypmod)
    FROM pg_attribute a
   WHERE a.attrelid = 'public.trees'::regclass AND a.attname = _field AND a.attnum > 0
$$;

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
    EXECUTE format('UPDATE public.trees SET %I = NULLIF($1, %L)::%s, updated_at = now() WHERE id = $2',
                   k, '', public.tree_column_type(k))
      USING v, _tree_id;
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
    EXECUTE format('UPDATE public.trees SET %I = NULLIF($1, %L)::%s, updated_at = now() WHERE id = $2',
                   k, '', public.tree_column_type(k))
      USING v, p.tree_id;
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

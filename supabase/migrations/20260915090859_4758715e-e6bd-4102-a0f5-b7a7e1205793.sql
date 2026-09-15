
-- 1. Append-only ledger of meaningful contributions to a tree ---------------
CREATE TABLE IF NOT EXISTS public.tree_growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  actor_user_id uuid,
  event_type text NOT NULL,
  source_table text NOT NULL,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tree_growth_events_tree_idx ON public.tree_growth_events(tree_id);
CREATE UNIQUE INDEX IF NOT EXISTS tree_growth_events_src_idx
  ON public.tree_growth_events(source_table, source_id) WHERE source_id IS NOT NULL;

GRANT SELECT ON public.tree_growth_events TO authenticated, anon;
GRANT ALL ON public.tree_growth_events TO service_role;
ALTER TABLE public.tree_growth_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read growth events" ON public.tree_growth_events;
CREATE POLICY "Anyone can read growth events" ON public.tree_growth_events FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.record_tree_growth_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid;
BEGIN
  BEGIN v_actor := (to_jsonb(NEW) ->> TG_ARGV[1])::uuid; EXCEPTION WHEN others THEN v_actor := NULL; END;
  IF NEW.tree_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id)
  VALUES (NEW.tree_id, v_actor, TG_ARGV[0], TG_TABLE_NAME, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_growth_offerings ON public.offerings;
CREATE TRIGGER trg_growth_offerings AFTER INSERT ON public.offerings
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('offering', 'created_by');

DROP TRIGGER IF EXISTS trg_growth_checkins ON public.tree_checkins;
CREATE TRIGGER trg_growth_checkins AFTER INSERT ON public.tree_checkins
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('checkin', 'user_id');

DROP TRIGGER IF EXISTS trg_growth_contributions ON public.tree_contributions;
CREATE TRIGGER trg_growth_contributions AFTER INSERT ON public.tree_contributions
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('contribution', 'user_id');

DROP TRIGGER IF EXISTS trg_growth_refinements ON public.tree_location_refinements;
CREATE TRIGGER trg_growth_refinements AFTER INSERT ON public.tree_location_refinements
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('location_refinement', 'user_id');

DROP TRIGGER IF EXISTS trg_growth_phenology ON public.phenology_observations;
CREATE TRIGGER trg_growth_phenology AFTER INSERT ON public.phenology_observations
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('observation', 'user_id');

DROP TRIGGER IF EXISTS trg_growth_stewardship ON public.stewardship_actions;
CREATE TRIGGER trg_growth_stewardship AFTER INSERT ON public.stewardship_actions
  FOR EACH ROW EXECUTE FUNCTION public.record_tree_growth_event('stewardship_action', 'user_id');

-- Backfill from existing rows (idempotent)
INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id, created_at)
SELECT o.tree_id, o.created_by, 'offering', 'offerings', o.id, o.created_at FROM public.offerings o WHERE o.tree_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id, created_at)
SELECT c.tree_id, c.user_id, 'checkin', 'tree_checkins', c.id, c.created_at FROM public.tree_checkins c WHERE c.tree_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id, created_at)
SELECT t.tree_id, t.user_id, 'contribution', 'tree_contributions', t.id, t.created_at FROM public.tree_contributions t
ON CONFLICT DO NOTHING;
INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id, created_at)
SELECT r.tree_id, r.user_id, 'location_refinement', 'tree_location_refinements', r.id, r.created_at FROM public.tree_location_refinements r
ON CONFLICT DO NOTHING;
INSERT INTO public.tree_growth_events (tree_id, actor_user_id, event_type, source_table, source_id, created_at)
SELECT h.tree_id, h.user_id, 'accepted_edit', 'tree_edit_history', h.id, h.created_at FROM public.tree_edit_history h
ON CONFLICT DO NOTHING;

-- 2. Proposal shape ---------------------------------------------------------
ALTER TABLE public.tree_edit_proposals
  ADD COLUMN IF NOT EXISTS proposal_type text NOT NULL DEFAULT 'edit',
  ADD COLUMN IF NOT EXISTS base_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS base_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS merge_target_tree_id uuid,
  ADD COLUMN IF NOT EXISTS merge_preferred_tree_id uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DROP POLICY IF EXISTS "Keepers can view all proposals" ON public.tree_edit_proposals;
CREATE POLICY "Keepers can view all proposals" ON public.tree_edit_proposals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'keeper'::app_role));

-- 3. Eligibility ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tree_edit_eligibility(_tree_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE t record; v_foreign int := 0; v_curator boolean := false;
BEGIN
  SELECT id, created_by, updated_at, merged_into_tree_id INTO t FROM public.trees WHERE id = _tree_id;
  IF t IS NULL THEN RETURN jsonb_build_object('exists', false); END IF;
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('exists', true, 'signed_in', false, 'is_creator', false,
      'can_direct_edit', false, 'other_contributors', 0, 'reason', 'signed_out',
      'tree_updated_at', t.updated_at);
  END IF;
  v_curator := public.has_role(_user_id, 'curator'::app_role) OR public.has_role(_user_id, 'keeper'::app_role);
  SELECT count(*) INTO v_foreign FROM public.tree_growth_events g
   WHERE g.tree_id = _tree_id AND g.actor_user_id IS NOT NULL
     AND g.actor_user_id <> COALESCE(t.created_by, '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN jsonb_build_object(
    'exists', true,
    'signed_in', true,
    'is_creator', t.created_by = _user_id,
    'is_curator', v_curator,
    'other_contributors', v_foreign,
    'merged', t.merged_into_tree_id IS NOT NULL,
    'tree_updated_at', t.updated_at,
    'can_direct_edit', t.merged_into_tree_id IS NULL
      AND (v_curator OR (t.created_by = _user_id AND v_foreign = 0)),
    'reason', CASE
      WHEN t.merged_into_tree_id IS NOT NULL THEN 'merged'
      WHEN v_curator THEN 'curator'
      WHEN t.created_by IS DISTINCT FROM _user_id THEN 'not_creator'
      WHEN v_foreign > 0 THEN 'others_contributed'
      ELSE 'creator_sole' END
  );
END; $$;

CREATE OR REPLACE FUNCTION public.tree_editable_fields()
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT ARRAY['name','species','description','lore_text','estimated_age','latitude',
               'longitude','what3words','access_notes','girth_cm','planted_year','variety_name']::text[]
$$;

-- 4. Direct edit ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_tree_direct_edit(
  _tree_id uuid, _changes jsonb, _reason text DEFAULT NULL, _base_updated_at timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); t record; k text; v text; v_old text; elig jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO t FROM public.trees WHERE id = _tree_id FOR UPDATE;
  IF t IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  elig := public.tree_edit_eligibility(_tree_id, v_uid);
  IF NOT (elig ->> 'can_direct_edit')::boolean THEN RAISE EXCEPTION 'review_required'; END IF;
  IF _base_updated_at IS NOT NULL AND t.updated_at > _base_updated_at + interval '1 second' THEN
    RAISE EXCEPTION 'stale_edit';
  END IF;

  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(_changes) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    EXECUTE format('SELECT ($1.%I)::text', k) INTO v_old USING t;
    EXECUTE format('UPDATE public.trees SET %I = $1, updated_at = now() WHERE id = $2', k)
      USING NULLIF(v, ''), _tree_id;
    INSERT INTO public.tree_edit_history (tree_id, user_id, field_name, old_value, new_value, edit_reason, edit_type)
    VALUES (_tree_id, v_uid, k, v_old, NULLIF(v, ''), NULLIF(_reason, ''), 'direct');
  END LOOP;

  SELECT to_jsonb(x) INTO elig FROM (SELECT * FROM public.trees WHERE id = _tree_id) x;
  RETURN elig;
END; $$;

-- 5. Submit a proposal ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_tree_change_proposal(
  _tree_id uuid, _proposal_type text, _changes jsonb, _reason text,
  _evidence jsonb DEFAULT '[]'::jsonb, _confidence text DEFAULT 'medium',
  _merge_target_tree_id uuid DEFAULT NULL, _merge_preferred_tree_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); t record; v_id uuid; v_base jsonb := '{}'::jsonb; k text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  IF _proposal_type NOT IN ('edit','location','merge') THEN RAISE EXCEPTION 'bad_proposal_type'; END IF;
  IF COALESCE(btrim(_reason), '') = '' THEN RAISE EXCEPTION 'reason_required'; END IF;
  SELECT * INTO t FROM public.trees WHERE id = _tree_id;
  IF t IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;

  IF _proposal_type = 'merge' THEN
    IF _merge_target_tree_id IS NULL OR _merge_target_tree_id = _tree_id THEN RAISE EXCEPTION 'bad_merge_target'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = _merge_target_tree_id) THEN RAISE EXCEPTION 'merge_target_not_found'; END IF;
    IF EXISTS (
      SELECT 1 FROM public.tree_edit_proposals p
       WHERE p.status = 'pending' AND p.proposal_type = 'merge'
         AND ((p.tree_id = _tree_id AND p.merge_target_tree_id = _merge_target_tree_id)
           OR (p.tree_id = _merge_target_tree_id AND p.merge_target_tree_id = _tree_id))
    ) THEN RAISE EXCEPTION 'duplicate_pending_merge'; END IF;
  ELSE
    FOR k IN SELECT key FROM jsonb_each(_changes) LOOP
      IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
      v_base := v_base || jsonb_build_object(k, to_jsonb(t) -> k);
    END LOOP;
    IF _changes = '{}'::jsonb THEN RAISE EXCEPTION 'no_changes'; END IF;
  END IF;

  INSERT INTO public.tree_edit_proposals
    (tree_id, proposed_by, proposed_changes, reason, evidence, confidence, status,
     proposal_type, base_updated_at, base_values, merge_target_tree_id, merge_preferred_tree_id)
  VALUES (_tree_id, v_uid, COALESCE(_changes, '{}'::jsonb), btrim(_reason), COALESCE(_evidence, '[]'::jsonb),
          COALESCE(_confidence, 'medium'), 'pending', _proposal_type, t.updated_at, v_base,
          _merge_target_tree_id, _merge_preferred_tree_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- 6. Curator review of edit / location proposals ----------------------------
CREATE OR REPLACE FUNCTION public.review_tree_change_proposal(
  _proposal_id uuid, _decision text, _note text DEFAULT NULL,
  _overrides jsonb DEFAULT NULL, _acknowledge_conflict boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; t record; k text; v text; v_old text;
        v_changes jsonb; v_prev jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid,'curator'::app_role) OR public.has_role(v_uid,'keeper'::app_role))
    THEN RAISE EXCEPTION 'curator_only'; END IF;
  IF _decision NOT IN ('approve','decline','needs_more_info') THEN RAISE EXCEPTION 'bad_decision'; END IF;
  IF _decision <> 'approve' AND COALESCE(btrim(_note),'') = '' THEN RAISE EXCEPTION 'note_required'; END IF;

  SELECT * INTO p FROM public.tree_edit_proposals WHERE id = _proposal_id FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'proposal_not_found'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'already_reviewed'; END IF;
  IF p.proposal_type = 'merge' THEN RAISE EXCEPTION 'use_merge_review'; END IF;

  IF _decision <> 'approve' THEN
    UPDATE public.tree_edit_proposals
       SET status = CASE WHEN _decision = 'decline' THEN 'rejected' ELSE 'needs_more_info' END,
           reviewer_id = v_uid, reviewer_note = btrim(_note), reviewed_at = now(), updated_at = now()
     WHERE id = _proposal_id;
    RETURN jsonb_build_object('status', CASE WHEN _decision='decline' THEN 'rejected' ELSE 'needs_more_info' END);
  END IF;

  SELECT * INTO t FROM public.trees WHERE id = p.tree_id FOR UPDATE;
  IF t IS NULL THEN RAISE EXCEPTION 'tree_not_found'; END IF;
  IF NOT _acknowledge_conflict AND p.base_updated_at IS NOT NULL
     AND t.updated_at > p.base_updated_at + interval '1 second' THEN
    RAISE EXCEPTION 'stale_proposal';
  END IF;

  v_changes := COALESCE(_overrides, p.proposed_changes);
  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(v_changes) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    EXECUTE format('SELECT ($1.%I)::text', k) INTO v_old USING t;
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

-- 7. Curator merge ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_tree_merge(
  _proposal_id uuid, _surviving_tree_id uuid, _field_resolutions jsonb DEFAULT '{}'::jsonb,
  _note text DEFAULT NULL, _acknowledge_conflict boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; keep record; drop_id uuid; dropped record;
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
  IF keep.merged_into_tree_id IS NOT NULL OR dropped.merged_into_tree_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_merged';
  END IF;
  IF NOT _acknowledge_conflict AND p.base_updated_at IS NOT NULL
     AND (keep.updated_at > p.base_updated_at + interval '1 second'
       OR dropped.updated_at > p.base_updated_at + interval '1 second') THEN
    RAISE EXCEPTION 'stale_proposal';
  END IF;

  -- resolve conflicting fields on the surviving record
  FOR k, v IN SELECT key, value #>> '{}' FROM jsonb_each(COALESCE(_field_resolutions,'{}'::jsonb)) LOOP
    IF NOT (k = ANY (public.tree_editable_fields())) THEN RAISE EXCEPTION 'field_not_editable: %', k; END IF;
    EXECUTE format('SELECT ($1.%I)::text', k) INTO v_old USING keep;
    EXECUTE format('UPDATE public.trees SET %I = $1, updated_at = now() WHERE id = $2', k)
      USING NULLIF(v,''), _surviving_tree_id;
    INSERT INTO public.tree_edit_history (tree_id, user_id, field_name, old_value, new_value, edit_reason, edit_type, proposal_id)
    VALUES (_surviving_tree_id, v_uid, k, v_old, NULLIF(v,''), COALESCE(NULLIF(btrim(_note),''), p.reason), 'merge', p.id);
  END LOOP;

  -- move linked content, preserving original authorship and timestamps
  FOREACH tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('UPDATE public.%I SET tree_id = $1 WHERE tree_id = $2', tbl)
        USING _surviving_tree_id, drop_id;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN v_moved := v_moved || jsonb_build_object(tbl, n); END IF;
    END IF;
  END LOOP;

  -- conflict-safe moves (skip rows that would duplicate an existing relationship)
  UPDATE public.tree_guardians g SET tree_id = _surviving_tree_id
   WHERE g.tree_id = drop_id AND NOT EXISTS (
     SELECT 1 FROM public.tree_guardians x WHERE x.tree_id = _surviving_tree_id AND x.user_id = g.user_id AND x.role = g.role);
  UPDATE public.tree_wishlist w SET tree_id = _surviving_tree_id
   WHERE w.tree_id = drop_id AND NOT EXISTS (
     SELECT 1 FROM public.tree_wishlist x WHERE x.tree_id = _surviving_tree_id AND x.user_id = w.user_id);

  -- archive the superseded record (never deleted)
  UPDATE public.trees SET merged_into_tree_id = _surviving_tree_id, updated_at = now() WHERE id = drop_id;

  INSERT INTO public.tree_merge_history (primary_tree_id, secondary_tree_id, merged_by, merge_reason, data_migrated)
  VALUES (_surviving_tree_id, drop_id, v_uid,
          COALESCE(NULLIF(btrim(_note),''), p.reason),
          v_moved || jsonb_build_object('proposal_id', p.id,
            'secondary_snapshot', to_jsonb(dropped), 'primary_snapshot', to_jsonb(keep)));

  UPDATE public.tree_edit_proposals
     SET status = 'accepted', reviewer_id = v_uid, reviewer_note = NULLIF(btrim(_note),''),
         reviewed_at = now(), updated_at = now()
   WHERE id = _proposal_id;

  -- other pending proposals on the superseded record are parked, never auto-applied
  UPDATE public.tree_edit_proposals
     SET status = 'superseded', reviewer_id = v_uid, reviewed_at = now(), updated_at = now(),
         reviewer_note = COALESCE(reviewer_note, 'Tree merged into another record — please review afresh.')
   WHERE tree_id = drop_id AND status = 'pending' AND id <> _proposal_id;

  RETURN jsonb_build_object('surviving_tree_id', _surviving_tree_id, 'merged_tree_id', drop_id, 'moved', v_moved);
END; $$;

REVOKE ALL ON FUNCTION public.apply_tree_direct_edit(uuid, jsonb, text, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.submit_tree_change_proposal(uuid, text, jsonb, text, jsonb, text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.review_tree_change_proposal(uuid, text, text, jsonb, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.approve_tree_merge(uuid, uuid, jsonb, text, boolean) FROM anon;

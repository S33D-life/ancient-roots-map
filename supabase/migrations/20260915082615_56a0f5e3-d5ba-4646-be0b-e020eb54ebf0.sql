
-- =============================================================
-- Life Groves: membership, stewardship, proposals, tending history
-- Additive only. Existing grove + offering data untouched.
-- =============================================================

-- ---------- 1. Offerings: additive columns ----------
ALTER TABLE public.life_grove_offerings
  ADD COLUMN IF NOT EXISTS media_metadata jsonb,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

-- ---------- 2. Membership (contributor capability) ----------
CREATE TABLE IF NOT EXISTS public.life_grove_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_grove_id uuid NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_via text NOT NULL DEFAULT 'invite_token',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (life_grove_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_grove_members TO authenticated;
GRANT ALL ON public.life_grove_members TO service_role;
ALTER TABLE public.life_grove_members ENABLE ROW LEVEL SECURITY;

-- ---------- 3. Stewardship (explicit authority, succession-ready) ----------
CREATE TABLE IF NOT EXISTS public.life_grove_stewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_grove_id uuid NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  -- generic grantor: NOT assumed to be life_groves.created_by forever
  granted_by uuid,
  steward_role text NOT NULL DEFAULT 'steward',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS life_grove_stewards_active_uniq
  ON public.life_grove_stewards (life_grove_id, user_id)
  WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_grove_stewards TO authenticated;
GRANT ALL ON public.life_grove_stewards TO service_role;
ALTER TABLE public.life_grove_stewards ENABLE ROW LEVEL SECURITY;

-- ---------- 4. Proposals ----------
CREATE TABLE IF NOT EXISTS public.life_grove_edit_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_grove_id uuid NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL,
  field_name text NOT NULL,
  current_value text,
  proposed_value text,
  explanation text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_grove_edit_proposals TO authenticated;
GRANT ALL ON public.life_grove_edit_proposals TO service_role;
ALTER TABLE public.life_grove_edit_proposals ENABLE ROW LEVEL SECURITY;

-- ---------- 5. Tending history (append-only) ----------
CREATE TABLE IF NOT EXISTS public.life_grove_tending_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_grove_id uuid NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  actor_user_id uuid,
  source text NOT NULL DEFAULT 'steward_tending',
  proposal_id uuid REFERENCES public.life_grove_edit_proposals(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- append-only from the client: no UPDATE / DELETE grant at all
GRANT SELECT, INSERT ON public.life_grove_tending_history TO authenticated;
GRANT ALL ON public.life_grove_tending_history TO service_role;
ALTER TABLE public.life_grove_tending_history ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Authority helpers (SECURITY DEFINER to avoid RLS recursion)
-- =============================================================

-- Primary steward = life_groves.created_by. Resolved here rather than
-- duplicated as a row, so there is exactly one owner fact in the schema.
CREATE OR REPLACE FUNCTION public.is_grove_steward(_grove_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.life_groves g
            WHERE g.id = _grove_id AND g.created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.life_grove_stewards s
               WHERE s.life_grove_id = _grove_id AND s.user_id = _user_id
                 AND s.revoked_at IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_grove_primary_steward(_grove_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.life_groves g
    WHERE g.id = _grove_id AND g.created_by = _user_id
  );
$$;

-- Contributor = steward OR active member. Never conferred by token possession
-- alone: a token must first be redeemed into a membership row.
CREATE OR REPLACE FUNCTION public.is_grove_contributor(_grove_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.is_grove_steward(_grove_id, _user_id)
    OR EXISTS (SELECT 1 FROM public.life_grove_members m
               WHERE m.life_grove_id = _grove_id AND m.user_id = _user_id
                 AND m.revoked_at IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_life_grove(_grove_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.life_groves g
                 WHERE g.id = _grove_id AND g.privacy = 'public')
    OR public.is_grove_contributor(_grove_id, _user_id);
$$;

-- Allow-list of proposable / tendable grove content fields.
CREATE OR REPLACE FUNCTION public.life_grove_content_fields()
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT ARRAY[
    'grove_title','remembered_or_celebrated_name','relationship_label',
    'tree_name','tree_archetype_species','tree_species_detail',
    'story_intro','location_text','event_date','birth_date','passing_date',
    'grove_type','cover_photo_url','planted_tree_location_text','planting_notes'
  ]::text[];
$$;

-- =============================================================
-- RLS policies
-- =============================================================

-- ---- life_groves ----
DROP POLICY IF EXISTS "Public groves are readable by anyone" ON public.life_groves;
CREATE POLICY "Grove visible to public, members and stewards"
ON public.life_groves FOR SELECT
USING (privacy = 'public' OR public.is_grove_contributor(id, auth.uid()));

DROP POLICY IF EXISTS "Owners can update their own groves" ON public.life_groves;
CREATE POLICY "Stewards can tend their grove"
ON public.life_groves FOR UPDATE TO authenticated
USING (public.is_grove_steward(id, auth.uid()))
WITH CHECK (public.is_grove_steward(id, auth.uid()));

-- ---- life_grove_members ----
CREATE POLICY "Members and stewards can read grove membership"
ON public.life_grove_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_grove_steward(life_grove_id, auth.uid()));

CREATE POLICY "Stewards can add grove members"
ON public.life_grove_members FOR INSERT TO authenticated
WITH CHECK (public.is_grove_steward(life_grove_id, auth.uid()));

CREATE POLICY "Stewards can update grove membership"
ON public.life_grove_members FOR UPDATE TO authenticated
USING (public.is_grove_steward(life_grove_id, auth.uid()))
WITH CHECK (public.is_grove_steward(life_grove_id, auth.uid()));

-- ---- life_grove_stewards ----
CREATE POLICY "Grove people can see who stewards it"
ON public.life_grove_stewards FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_grove_contributor(life_grove_id, auth.uid()));

-- Granting/revoking happens only through the SECURITY DEFINER RPCs below.
CREATE POLICY "Service role manages stewardship rows"
ON public.life_grove_stewards FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ---- proposals ----
CREATE POLICY "Contributors propose edits to groves they belong to"
ON public.life_grove_edit_proposals FOR INSERT TO authenticated
WITH CHECK (
  proposed_by = auth.uid()
  AND public.is_grove_contributor(life_grove_id, auth.uid())
  AND field_name = ANY (public.life_grove_content_fields())
  AND status = 'pending'
);

CREATE POLICY "Proposers and stewards can read proposals"
ON public.life_grove_edit_proposals FOR SELECT TO authenticated
USING (proposed_by = auth.uid() OR public.is_grove_steward(life_grove_id, auth.uid()));

-- Proposers may withdraw their own pending proposal; stewards may decline.
CREATE POLICY "Stewards review, proposers withdraw"
ON public.life_grove_edit_proposals FOR UPDATE TO authenticated
USING (
  public.is_grove_steward(life_grove_id, auth.uid())
  OR (proposed_by = auth.uid() AND status = 'pending')
)
WITH CHECK (
  public.is_grove_steward(life_grove_id, auth.uid())
  OR (proposed_by = auth.uid() AND status IN ('pending','withdrawn'))
);

-- ---- tending history (append-only) ----
CREATE POLICY "Grove people can read tending history"
ON public.life_grove_tending_history FOR SELECT TO authenticated
USING (public.is_grove_contributor(life_grove_id, auth.uid()));

CREATE POLICY "Stewards record tending entries"
ON public.life_grove_tending_history FOR INSERT TO authenticated
WITH CHECK (
  actor_user_id = auth.uid()
  AND public.is_grove_steward(life_grove_id, auth.uid())
);
-- No UPDATE or DELETE policy: history cannot be rewritten from the client.

-- ---- offerings ----
DROP POLICY IF EXISTS "Authenticated users can leave an offering on accessible grove" ON public.life_grove_offerings;
CREATE POLICY "Contributors can hang an offering"
ON public.life_grove_offerings FOR INSERT TO authenticated
WITH CHECK (
  contributor_user_id = auth.uid()
  AND (
    public.is_grove_contributor(life_grove_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.life_groves g
               WHERE g.id = life_grove_id AND g.privacy = 'public')
  )
);

DROP POLICY IF EXISTS "Grove owner reads all offerings on their grove" ON public.life_grove_offerings;
CREATE POLICY "Grove people read offerings of their grove"
ON public.life_grove_offerings FOR SELECT TO authenticated
USING (
  contributor_user_id = auth.uid()
  OR public.is_grove_contributor(life_grove_id, auth.uid())
);

CREATE POLICY "Authors edit their own offering"
ON public.life_grove_offerings FOR UPDATE TO authenticated
USING (contributor_user_id = auth.uid())
WITH CHECK (contributor_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete offerings on their grove" ON public.life_grove_offerings;
CREATE POLICY "Authors and stewards can remove an offering"
ON public.life_grove_offerings FOR DELETE TO authenticated
USING (
  contributor_user_id = auth.uid()
  OR public.is_grove_steward(life_grove_id, auth.uid())
);

-- =============================================================
-- RPCs
-- =============================================================

-- Redeem an ordinary grove invitation: grants CONTRIBUTOR capability only.
CREATE OR REPLACE FUNCTION public.join_life_grove_with_token(p_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grove uuid; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to accept this invitation'; END IF;
  SELECT id INTO v_grove FROM public.life_groves WHERE invite_token = p_token;
  IF v_grove IS NULL THEN RAISE EXCEPTION 'This invitation could not bloom'; END IF;

  INSERT INTO public.life_grove_members (life_grove_id, user_id, joined_via)
  VALUES (v_grove, v_uid, 'invite_token')
  ON CONFLICT (life_grove_id, user_id)
  DO UPDATE SET revoked_at = NULL;

  RETURN v_grove;
END; $$;

-- Grant stewardship. Today only the primary steward may grant; the schema
-- does not assume that forever (granted_by is a plain actor reference).
CREATE OR REPLACE FUNCTION public.grant_grove_steward(p_grove_id uuid, p_user_id uuid, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF NOT public.is_grove_primary_steward(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Only the primary steward may grant stewardship';
  END IF;

  INSERT INTO public.life_grove_stewards (life_grove_id, user_id, granted_by, note)
  VALUES (p_grove_id, p_user_id, v_uid, p_note)
  ON CONFLICT (life_grove_id, user_id) WHERE revoked_at IS NULL
  DO UPDATE SET note = EXCLUDED.note, updated_at = now()
  RETURNING id INTO v_id;

  -- a steward is also a contributor of the grove
  INSERT INTO public.life_grove_members (life_grove_id, user_id, joined_via, invited_by)
  VALUES (p_grove_id, p_user_id, 'steward_grant', v_uid)
  ON CONFLICT (life_grove_id, user_id) DO UPDATE SET revoked_at = NULL;

  INSERT INTO public.life_grove_tending_history
    (life_grove_id, field_name, old_value, new_value, actor_user_id, source, note)
  VALUES (p_grove_id, 'stewardship', NULL, p_user_id::text, v_uid, 'steward_grant', p_note);

  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_grove_steward(p_grove_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.is_grove_primary_steward(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Only the primary steward may withdraw stewardship';
  END IF;

  UPDATE public.life_grove_stewards
     SET revoked_at = now(), revoked_by = v_uid, updated_at = now()
   WHERE life_grove_id = p_grove_id AND user_id = p_user_id AND revoked_at IS NULL;

  INSERT INTO public.life_grove_tending_history
    (life_grove_id, field_name, old_value, new_value, actor_user_id, source)
  VALUES (p_grove_id, 'stewardship', p_user_id::text, NULL, v_uid, 'steward_revoke');
END; $$;

-- Steward tending of one allow-listed content field, with history.
CREATE OR REPLACE FUNCTION public.tend_grove_field(p_grove_id uuid, p_field text, p_value text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_old text;
BEGIN
  IF v_uid IS NULL OR NOT public.is_grove_steward(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Only a steward may tend this grove';
  END IF;
  IF NOT (p_field = ANY (public.life_grove_content_fields())) THEN
    RAISE EXCEPTION 'That is not a tendable field';
  END IF;

  EXECUTE format('SELECT ($1.%I)::text', p_field)
    INTO v_old USING (SELECT g FROM public.life_groves g WHERE g.id = p_grove_id);

  EXECUTE format('UPDATE public.life_groves SET %I = $1, updated_at = now() WHERE id = $2', p_field)
    USING p_value, p_grove_id;

  INSERT INTO public.life_grove_tending_history
    (life_grove_id, field_name, old_value, new_value, actor_user_id, source, note)
  VALUES (p_grove_id, p_field, v_old, p_value, v_uid, 'steward_tending', p_note);
END; $$;

-- Rooted Tree relationship: stewards only, validated tree id, always recorded.
CREATE OR REPLACE FUNCTION public.set_grove_rooted_tree(p_grove_id uuid, p_tree_id uuid, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_old uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.is_grove_steward(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Only a steward may change the rooted tree';
  END IF;
  IF p_tree_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.trees t WHERE t.id = p_tree_id) THEN
    RAISE EXCEPTION 'That Ancient Friend could not be found';
  END IF;

  SELECT linked_tree_id INTO v_old FROM public.life_groves WHERE id = p_grove_id;

  UPDATE public.life_groves
     SET linked_tree_id = p_tree_id,
         tree_link_type = CASE WHEN p_tree_id IS NULL THEN 'symbolic_only' ELSE 'link_ancient_friend' END,
         updated_at = now()
   WHERE id = p_grove_id;

  INSERT INTO public.life_grove_tending_history
    (life_grove_id, field_name, old_value, new_value, actor_user_id, source, note)
  VALUES (p_grove_id, 'linked_tree_id', v_old::text, p_tree_id::text, v_uid, 'rooted_tree_change', p_note);
END; $$;

-- Accept a proposal: allow-listed fields only; proposer cannot self-accept
-- unless independently a steward. Rooted Tree is never applied this way.
CREATE OR REPLACE FUNCTION public.apply_grove_proposal(p_proposal_id uuid, p_override_value text DEFAULT NULL, p_reviewer_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); p record; v_old text; v_new text;
BEGIN
  SELECT * INTO p FROM public.life_grove_edit_proposals WHERE id = p_proposal_id;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF v_uid IS NULL OR NOT public.is_grove_steward(p.life_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Only a steward may accept a proposal';
  END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'This proposal has already been reviewed'; END IF;
  IF NOT (p.field_name = ANY (public.life_grove_content_fields())) THEN
    RAISE EXCEPTION 'That is not a tendable field';
  END IF;

  v_new := COALESCE(p_override_value, p.proposed_value);

  EXECUTE format('SELECT ($1.%I)::text', p.field_name)
    INTO v_old USING (SELECT g FROM public.life_groves g WHERE g.id = p.life_grove_id);

  EXECUTE format('UPDATE public.life_groves SET %I = $1, updated_at = now() WHERE id = $2', p.field_name)
    USING v_new, p.life_grove_id;

  UPDATE public.life_grove_edit_proposals
     SET status = CASE WHEN p_override_value IS NULL THEN 'accepted' ELSE 'edited_and_accepted' END,
         reviewer_id = v_uid, reviewer_note = p_reviewer_note,
         reviewed_at = now(), updated_at = now()
   WHERE id = p_proposal_id;

  INSERT INTO public.life_grove_tending_history
    (life_grove_id, field_name, old_value, new_value, actor_user_id, source, proposal_id, note)
  VALUES (p.life_grove_id, p.field_name, v_old, v_new, v_uid, 'accepted_proposal', p_proposal_id, p_reviewer_note);
END; $$;

-- Contributor identities for a grove. Email ONLY to stewards of THAT grove.
CREATE OR REPLACE FUNCTION public.get_life_grove_contributors(p_grove_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_steward boolean;
BEGIN
  IF NOT public.can_view_life_grove(p_grove_id, v_uid) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  v_steward := public.is_grove_steward(p_grove_id, v_uid);

  RETURN QUERY
  SELECT DISTINCT pr.id,
         COALESCE(NULLIF(pr.full_name, ''), 'A Wanderer'),
         pr.avatar_url,
         CASE WHEN v_steward THEN u.email::text ELSE NULL END
  FROM public.life_grove_offerings o
  JOIN public.profiles pr ON pr.id = o.contributor_user_id
  LEFT JOIN auth.users u ON u.id = pr.id
  WHERE o.life_grove_id = p_grove_id;
END; $$;

-- Presentation identities for offerings (no email, ever).
CREATE OR REPLACE FUNCTION public.get_life_grove_offering_identities(p_grove_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT pr.id,
         COALESCE(NULLIF(pr.full_name, ''), 'A Wanderer'),
         pr.avatar_url
  FROM public.life_grove_offerings o
  JOIN public.profiles pr ON pr.id = o.contributor_user_id
  WHERE o.life_grove_id = p_grove_id
    AND public.can_view_life_grove(p_grove_id, auth.uid());
$$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS lg_offerings_updated_at ON public.life_grove_offerings;
CREATE TRIGGER lg_offerings_updated_at BEFORE UPDATE ON public.life_grove_offerings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS lg_proposals_updated_at ON public.life_grove_edit_proposals;
CREATE TRIGGER lg_proposals_updated_at BEFORE UPDATE ON public.life_grove_edit_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

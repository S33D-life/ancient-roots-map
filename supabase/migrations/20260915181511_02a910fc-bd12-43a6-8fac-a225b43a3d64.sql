
-- ============ Ancestral Roots =============================================
-- A Root is the relationship. An Inscription is the mark it leaves.

CREATE TABLE public.grove_roots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_grove_id uuid NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  root_type text NOT NULL DEFAULT 'ancestral'
    CHECK (root_type IN ('ancestral','family','birth','union','community','other')),
  created_by uuid NOT NULL,
  -- the visible mark
  inscription_text text CHECK (inscription_text IS NULL OR char_length(btrim(inscription_text)) BETWEEN 1 AND 48),
  dedication text CHECK (dedication IS NULL OR char_length(dedication) <= 280),
  inscription_date_text text CHECK (inscription_date_text IS NULL OR char_length(inscription_date_text) <= 40),
  signature_url text,           -- reserved for handwritten marks (not yet used)
  inscription_style text NOT NULL DEFAULT 'incised',
  position_data jsonb,          -- reserved for richer digital twins
  -- three distinct disclosures
  inscription_visibility text NOT NULL DEFAULT 'private'
    CHECK (inscription_visibility IN ('private','public')),
  portal_disclosure text NOT NULL DEFAULT 'mark_only'
    CHECK (portal_disclosure IN ('mark_only','named')),
  entry_mode text NOT NULL DEFAULT 'members_only'
    CHECK (entry_mode IN ('members_only','as_grove_permits')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','declined','removed')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX grove_roots_live_pair_idx
  ON public.grove_roots (life_grove_id, tree_id)
  WHERE status IN ('pending','active');
CREATE INDEX grove_roots_tree_idx ON public.grove_roots (tree_id) WHERE status = 'active';
CREATE INDEX grove_roots_grove_idx ON public.grove_roots (life_grove_id);

CREATE TABLE public.grove_root_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_root_id uuid NOT NULL REFERENCES public.grove_roots(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  detail jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grove_root_history_root_idx ON public.grove_root_history (grove_root_id, created_at DESC);

GRANT SELECT ON public.grove_roots TO authenticated;
GRANT ALL ON public.grove_roots TO service_role;
GRANT SELECT ON public.grove_root_history TO authenticated;
GRANT ALL ON public.grove_root_history TO service_role;

ALTER TABLE public.grove_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grove_root_history ENABLE ROW LEVEL SECURITY;

-- Authority on the Ancient Friend side.
CREATE OR REPLACE FUNCTION public.is_tree_root_authority(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.has_role(_user_id, 'curator'::app_role)
    OR public.has_role(_user_id, 'keeper'::app_role)
    OR EXISTS (SELECT 1 FROM public.trees t WHERE t.id = _tree_id AND t.created_by = _user_id)
  )
$$;

-- Reading: grove people see their grove's roots; tree authorities see roots on
-- their tree; everyone else only ever reads through the safe RPC below.
CREATE POLICY "Grove people and tree authorities read roots"
ON public.grove_roots FOR SELECT TO authenticated
USING (
  public.is_grove_contributor(life_grove_id, auth.uid())
  OR public.is_tree_root_authority(tree_id, auth.uid())
);

CREATE POLICY "Root history follows the root"
ON public.grove_root_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.grove_roots r
  WHERE r.id = grove_root_id
    AND (public.is_grove_contributor(r.life_grove_id, auth.uid())
      OR public.is_tree_root_authority(r.tree_id, auth.uid()))
));

-- No client writes at all: every change runs through the functions below.

-- ---------------------------------------------------------------- establish
CREATE OR REPLACE FUNCTION public.create_grove_root(
  p_grove_id uuid,
  p_tree_id uuid,
  p_inscription_text text DEFAULT NULL,
  p_dedication text DEFAULT NULL,
  p_inscription_visibility text DEFAULT 'private',
  p_portal_disclosure text DEFAULT 'mark_only',
  p_entry_mode text DEFAULT 'members_only',
  p_root_type text DEFAULT 'ancestral'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_auto boolean; v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_grove_steward(p_grove_id, v_uid) THEN RAISE EXCEPTION 'steward_only'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trees WHERE id = p_tree_id AND merged_into_tree_id IS NULL) THEN
    RAISE EXCEPTION 'tree_not_found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.grove_roots
              WHERE life_grove_id = p_grove_id AND tree_id = p_tree_id
                AND status IN ('pending','active')) THEN
    RAISE EXCEPTION 'root_already_exists';
  END IF;

  v_auto := public.is_tree_root_authority(p_tree_id, v_uid);
  v_status := CASE WHEN v_auto THEN 'active' ELSE 'pending' END;

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
  VALUES (v_id, v_uid, CASE WHEN v_auto THEN 'created_and_welcomed' ELSE 'created' END,
          jsonb_build_object('tree_id', p_tree_id, 'life_grove_id', p_grove_id, 'status', v_status));
  RETURN v_id;
END $$;

-- ------------------------------------------------------------------- review
CREATE OR REPLACE FUNCTION public.review_grove_root(
  p_root_id uuid, p_decision text, p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_decision NOT IN ('active','declined') THEN RAISE EXCEPTION 'bad_decision'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT public.is_tree_root_authority(r.tree_id, v_uid) THEN RAISE EXCEPTION 'tree_authority_only'; END IF;
  IF r.status NOT IN ('pending','active') THEN RAISE EXCEPTION 'already_reviewed'; END IF;
  IF p_decision = 'declined' AND COALESCE(btrim(p_note),'') = '' THEN RAISE EXCEPTION 'reason_required'; END IF;

  UPDATE public.grove_roots
     SET status = p_decision, reviewed_by = v_uid, reviewed_at = now(),
         review_note = NULLIF(btrim(p_note),''), updated_at = now()
   WHERE id = p_root_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, note, detail)
  VALUES (p_root_id, v_uid, CASE WHEN p_decision = 'active' THEN 'welcomed' ELSE 'declined' END,
          NULLIF(btrim(p_note),''), jsonb_build_object('from', r.status));
END $$;

-- ------------------------------------------------------------------- remove
CREATE OR REPLACE FUNCTION public.remove_grove_root(p_root_id uuid, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT (public.is_grove_steward(r.life_grove_id, v_uid)
          OR public.is_tree_root_authority(r.tree_id, v_uid)) THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF r.status = 'removed' THEN RETURN; END IF;

  UPDATE public.grove_roots SET status = 'removed', updated_at = now() WHERE id = p_root_id;
  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, note, detail)
  VALUES (p_root_id, v_uid, 'removed', NULLIF(btrim(p_note),''), jsonb_build_object('from', r.status));
END $$;

-- ------------------------------------------------------- tend the inscription
CREATE OR REPLACE FUNCTION public.tend_grove_root_inscription(
  p_root_id uuid,
  p_inscription_text text DEFAULT NULL,
  p_dedication text DEFAULT NULL,
  p_inscription_visibility text DEFAULT NULL,
  p_portal_disclosure text DEFAULT NULL,
  p_entry_mode text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO r FROM public.grove_roots WHERE id = p_root_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'root_not_found'; END IF;
  IF NOT public.is_grove_steward(r.life_grove_id, v_uid) THEN RAISE EXCEPTION 'steward_only'; END IF;
  IF r.status NOT IN ('pending','active') THEN RAISE EXCEPTION 'root_not_live'; END IF;

  UPDATE public.grove_roots SET
    inscription_text = COALESCE(NULLIF(btrim(p_inscription_text),''), inscription_text),
    dedication = COALESCE(NULLIF(btrim(p_dedication),''), dedication),
    inscription_visibility = COALESCE(p_inscription_visibility, inscription_visibility),
    portal_disclosure = COALESCE(p_portal_disclosure, portal_disclosure),
    entry_mode = COALESCE(p_entry_mode, entry_mode),
    updated_at = now()
  WHERE id = p_root_id;

  INSERT INTO public.grove_root_history (grove_root_id, actor_id, action, detail)
  VALUES (p_root_id, v_uid, 'tended', jsonb_build_object('inscription_text', p_inscription_text));
END $$;

-- -------------------------------------------- safe reading of a tree's marks
CREATE OR REPLACE FUNCTION public.list_tree_inscriptions(p_tree_id uuid)
RETURNS TABLE (
  root_id uuid,
  life_grove_id uuid,
  inscription_text text,
  inscription_style text,
  remembered_name text,
  grove_title text,
  dedication text,
  rooted_year int,
  can_enter boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id,
         r.life_grove_id,
         COALESCE(NULLIF(btrim(r.inscription_text),''), '·'),
         r.inscription_style,
         CASE WHEN r.portal_disclosure = 'named'
                OR public.is_grove_contributor(r.life_grove_id, auth.uid())
              THEN g.remembered_or_celebrated_name END,
         CASE WHEN r.portal_disclosure = 'named'
                OR public.is_grove_contributor(r.life_grove_id, auth.uid())
              THEN g.grove_title END,
         CASE WHEN r.portal_disclosure = 'named'
                OR public.is_grove_contributor(r.life_grove_id, auth.uid())
              THEN r.dedication END,
         EXTRACT(YEAR FROM r.created_at)::int,
         public.can_view_life_grove(r.life_grove_id, auth.uid())
           AND (r.entry_mode = 'as_grove_permits'
                OR public.is_grove_contributor(r.life_grove_id, auth.uid()))
  FROM public.grove_roots r
  JOIN public.life_groves g ON g.id = r.life_grove_id
  WHERE r.tree_id = p_tree_id
    AND r.status = 'active'
    AND (r.inscription_visibility = 'public'
         OR public.is_grove_contributor(r.life_grove_id, auth.uid()))
  ORDER BY r.created_at ASC;
$$;

-- ------------------------------------------------- a grove's roots, for kin
CREATE OR REPLACE FUNCTION public.list_grove_roots(p_grove_id uuid)
RETURNS TABLE (
  root_id uuid,
  tree_id uuid,
  tree_name text,
  tree_species text,
  status text,
  inscription_text text,
  inscription_visibility text,
  portal_disclosure text,
  entry_mode text,
  review_note text,
  created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.tree_id, t.name, t.species, r.status, r.inscription_text,
         r.inscription_visibility, r.portal_disclosure, r.entry_mode,
         r.review_note, r.created_at
  FROM public.grove_roots r
  JOIN public.trees t ON t.id = r.tree_id
  WHERE r.life_grove_id = p_grove_id
    AND public.is_grove_contributor(p_grove_id, auth.uid())
    AND r.status <> 'removed'
  ORDER BY r.created_at ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.create_grove_root(uuid,uuid,text,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_grove_root(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_grove_root(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.tend_grove_root_inscription(uuid,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_grove_roots(uuid) FROM anon;

-- ─── 1. presence_config: single-row tunable proximity settings ───────────────
CREATE TABLE IF NOT EXISTS public.presence_config (
  id                       smallint PRIMARY KEY DEFAULT 1,
  radius_m                 numeric  NOT NULL DEFAULT 100,
  accuracy_factor          numeric  NOT NULL DEFAULT 0.5,
  accuracy_tolerance_max_m numeric  NOT NULL DEFAULT 40,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  updated_by               uuid,
  CONSTRAINT presence_config_singleton CHECK (id = 1)
);

INSERT INTO public.presence_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.presence_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed in can read presence_config" ON public.presence_config;
CREATE POLICY "Anyone signed in can read presence_config"
ON public.presence_config FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Keepers can update presence_config" ON public.presence_config;
CREATE POLICY "Keepers can update presence_config"
ON public.presence_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'keeper'))
WITH CHECK (public.has_role(auth.uid(), 'keeper'));

-- ─── 2. helper: haversine distance in metres ─────────────────────────────────
CREATE OR REPLACE FUNCTION public._haversine_m(
  lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT (2 * 6371000 * asin(sqrt(
    sin(radians(($3 - $1) / 2)) ^ 2
    + cos(radians($1)) * cos(radians($3))
    * sin(radians(($4 - $2) / 2)) ^ 2
  )))::numeric
$$;

-- ─── 3. gating helper returning rich jsonb ───────────────────────────────────
CREATE OR REPLACE FUNCTION public._gate_proximity(
  p_user_lat numeric, p_user_lng numeric, p_accuracy numeric,
  p_target_lat numeric, p_target_lng numeric,
  p_override boolean DEFAULT false,
  p_is_keeper boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg          public.presence_config%ROWTYPE;
  dist         numeric;
  slack        numeric;
  effective    numeric;
  override_ok  boolean := p_override AND p_is_keeper;
BEGIN
  IF p_user_lat IS NULL OR p_user_lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_user_coords');
  END IF;
  IF p_target_lat IS NULL OR p_target_lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_target_coords');
  END IF;

  SELECT * INTO cfg FROM public.presence_config WHERE id = 1;

  dist := public._haversine_m(p_user_lat, p_user_lng, p_target_lat, p_target_lng);
  slack := LEAST(COALESCE(p_accuracy, 0) * cfg.accuracy_factor, cfg.accuracy_tolerance_max_m);
  effective := GREATEST(0, dist - slack);

  RETURN jsonb_build_object(
    'ok',                 (effective <= cfg.radius_m) OR override_ok,
    'distance',           dist,
    'effective_distance', effective,
    'tolerance_applied',  slack,
    'accuracy',           p_accuracy,
    'radius_m',           cfg.radius_m,
    'override_used',      override_ok,
    'reason',             CASE WHEN (effective <= cfg.radius_m) OR override_ok THEN NULL ELSE 'too_far' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public._gate_proximity(numeric, numeric, numeric, numeric, numeric, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._gate_proximity(numeric, numeric, numeric, numeric, numeric, boolean, boolean) TO authenticated;

-- ─── 4. plant_seed_with_proximity ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.plant_seed_with_proximity(
  p_tree_id uuid,
  p_user_lat numeric,
  p_user_lng numeric,
  p_user_accuracy numeric DEFAULT NULL,
  p_override boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user        uuid := auth.uid();
  v_tree_lat    numeric;
  v_tree_lng    numeric;
  v_is_keeper   boolean := false;
  v_seed_id     uuid;
  v_gate        jsonb;
  v_today_count int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_user');
  END IF;

  SELECT latitude, longitude INTO v_tree_lat, v_tree_lng
  FROM public.trees WHERE id = p_tree_id;

  IF v_tree_lat IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tree_missing');
  END IF;

  v_is_keeper := public.has_role(v_user, 'keeper');

  -- Per-tree daily limit (best-effort; trigger remains the hard guard)
  SELECT count(*) INTO v_today_count
  FROM public.planted_seeds
  WHERE planter_id = v_user
    AND tree_id = p_tree_id
    AND planted_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
  IF v_today_count >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'per_tree_limit');
  END IF;

  v_gate := public._gate_proximity(
    p_user_lat, p_user_lng, p_user_accuracy,
    v_tree_lat, v_tree_lng,
    p_override, v_is_keeper
  );

  IF NOT (v_gate->>'ok')::boolean THEN
    RETURN v_gate || jsonb_build_object(
      'tree_lat', v_tree_lat, 'tree_lng', v_tree_lng
    );
  END IF;

  INSERT INTO public.planted_seeds (planter_id, tree_id, latitude, longitude)
  VALUES (v_user, p_tree_id, v_tree_lat, v_tree_lng)
  RETURNING id INTO v_seed_id;

  IF (v_gate->>'override_used')::boolean THEN
    RAISE WARNING '[s33d] keeper override used: plant_seed user=% tree=% dist=%',
      v_user, p_tree_id, v_gate->>'distance';
  END IF;

  RETURN v_gate || jsonb_build_object(
    'ok', true, 'seed_id', v_seed_id,
    'tree_lat', v_tree_lat, 'tree_lng', v_tree_lng
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'rpc_error', 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.plant_seed_with_proximity(uuid, numeric, numeric, numeric, boolean) TO authenticated;

-- ─── 5. collect_planted_heart_with_proximity ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.collect_planted_heart_with_proximity(
  p_seed_id uuid,
  p_user_lat numeric,
  p_user_lng numeric,
  p_user_accuracy numeric DEFAULT NULL,
  p_override boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user        uuid := auth.uid();
  v_seed        public.planted_seeds%ROWTYPE;
  v_target_lat  numeric;
  v_target_lng  numeric;
  v_is_keeper   boolean := false;
  v_gate        jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_user');
  END IF;

  SELECT * INTO v_seed FROM public.planted_seeds WHERE id = p_seed_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'seed_missing');
  END IF;
  IF v_seed.collected_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_collected');
  END IF;
  IF v_seed.planter_id = v_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'own_seed');
  END IF;
  IF v_seed.blooms_at > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_bloomed');
  END IF;

  -- Prefer the seed's own coords, fall back to the tree's
  v_target_lat := v_seed.latitude;
  v_target_lng := v_seed.longitude;
  IF v_target_lat IS NULL OR v_target_lng IS NULL THEN
    SELECT latitude, longitude INTO v_target_lat, v_target_lng
    FROM public.trees WHERE id = v_seed.tree_id;
  END IF;
  IF v_target_lat IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_seed_coords');
  END IF;

  v_is_keeper := public.has_role(v_user, 'keeper');

  v_gate := public._gate_proximity(
    p_user_lat, p_user_lng, p_user_accuracy,
    v_target_lat, v_target_lng,
    p_override, v_is_keeper
  );

  IF NOT (v_gate->>'ok')::boolean THEN
    RETURN v_gate || jsonb_build_object(
      'tree_lat', v_target_lat, 'tree_lng', v_target_lng
    );
  END IF;

  UPDATE public.planted_seeds
     SET collected_by = v_user, collected_at = now()
   WHERE id = p_seed_id
     AND collected_by IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_collected');
  END IF;

  IF (v_gate->>'override_used')::boolean THEN
    RAISE WARNING '[s33d] keeper override used: collect_heart user=% seed=% dist=%',
      v_user, p_seed_id, v_gate->>'distance';
  END IF;

  RETURN v_gate || jsonb_build_object(
    'ok', true, 'seed_id', p_seed_id,
    'tree_lat', v_target_lat, 'tree_lng', v_target_lng
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'rpc_error', 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.collect_planted_heart_with_proximity(uuid, numeric, numeric, numeric, boolean) TO authenticated;
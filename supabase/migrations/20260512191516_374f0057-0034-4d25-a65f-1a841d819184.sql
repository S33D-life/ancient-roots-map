
-- 1. Extend presence_config
ALTER TABLE public.presence_config
  ADD COLUMN IF NOT EXISTS manual_override_radius_m numeric NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS manual_override_enabled  boolean NOT NULL DEFAULT true;

-- 2. Audit log table
CREATE TABLE IF NOT EXISTS public.proximity_override_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  action      text NOT NULL,            -- 'plant_seed' | 'collect_heart'
  tree_id     uuid,
  seed_id     uuid,
  distance_m  numeric,
  accuracy_m  numeric,
  is_keeper   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proximity_override_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Keepers read override log" ON public.proximity_override_log;
CREATE POLICY "Keepers read override log"
ON public.proximity_override_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'keeper'));

CREATE INDEX IF NOT EXISTS idx_override_log_user_created
  ON public.proximity_override_log (user_id, created_at DESC);

-- 3. Updated gate: allow manual override for everyone within manual_override_radius_m
CREATE OR REPLACE FUNCTION public._gate_proximity(
  p_user_lat numeric, p_user_lng numeric, p_accuracy numeric,
  p_target_lat numeric, p_target_lng numeric,
  p_override boolean DEFAULT false,
  p_is_keeper boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cfg            public.presence_config%ROWTYPE;
  dist           numeric;
  slack          numeric;
  effective      numeric;
  manual_ok      boolean := false;
  keeper_ok      boolean := false;
  override_used  boolean := false;
  passes_radius  boolean;
BEGIN
  IF p_user_lat IS NULL OR p_user_lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_user_coords');
  END IF;
  IF p_target_lat IS NULL OR p_target_lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_target_coords');
  END IF;

  SELECT * INTO cfg FROM public.presence_config WHERE id = 1;

  dist  := public._haversine_m(p_user_lat, p_user_lng, p_target_lat, p_target_lng);
  slack := LEAST(COALESCE(p_accuracy, 0) * cfg.accuracy_factor, cfg.accuracy_tolerance_max_m);
  effective := GREATEST(0, dist - slack);

  passes_radius := effective <= cfg.radius_m;

  IF p_override AND NOT passes_radius THEN
    keeper_ok := p_is_keeper;
    manual_ok := (NOT p_is_keeper)
                 AND COALESCE(cfg.manual_override_enabled, true)
                 AND dist <= COALESCE(cfg.manual_override_radius_m, 500);
    override_used := keeper_ok OR manual_ok;
  END IF;

  RETURN jsonb_build_object(
    'ok',                  passes_radius OR override_used,
    'distance',            dist,
    'effective_distance',  effective,
    'tolerance_applied',   slack,
    'accuracy',            p_accuracy,
    'radius_m',            cfg.radius_m,
    'manual_override_radius_m', cfg.manual_override_radius_m,
    'override_used',       override_used,
    'override_kind',       CASE
                             WHEN keeper_ok THEN 'keeper'
                             WHEN manual_ok THEN 'manual'
                             ELSE NULL
                           END,
    'reason',              CASE
                             WHEN passes_radius OR override_used THEN NULL
                             WHEN p_override AND NOT COALESCE(cfg.manual_override_enabled, true) THEN 'override_disabled'
                             WHEN p_override AND dist > COALESCE(cfg.manual_override_radius_m, 500) THEN 'override_too_far'
                             ELSE 'too_far'
                           END
  );
END;
$$;

-- 4. plant_seed_with_proximity — log overrides
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
    RETURN v_gate || jsonb_build_object('tree_lat', v_tree_lat, 'tree_lng', v_tree_lng);
  END IF;

  INSERT INTO public.planted_seeds (planter_id, tree_id, latitude, longitude)
  VALUES (v_user, p_tree_id, v_tree_lat, v_tree_lng)
  RETURNING id INTO v_seed_id;

  IF (v_gate->>'override_used')::boolean THEN
    INSERT INTO public.proximity_override_log
      (user_id, action, tree_id, seed_id, distance_m, accuracy_m, is_keeper)
    VALUES
      (v_user, 'plant_seed', p_tree_id, v_seed_id,
       (v_gate->>'distance')::numeric, p_user_accuracy, v_is_keeper);
    RAISE WARNING '[s33d] override used (%): plant_seed user=% tree=% dist=%',
      v_gate->>'override_kind', v_user, p_tree_id, v_gate->>'distance';
  END IF;

  RETURN v_gate || jsonb_build_object(
    'ok', true, 'seed_id', v_seed_id,
    'tree_lat', v_tree_lat, 'tree_lng', v_tree_lng
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'rpc_error', 'error', SQLERRM);
END;
$$;

-- 5. collect_planted_heart_with_proximity — log overrides
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
    RETURN v_gate || jsonb_build_object('tree_lat', v_target_lat, 'tree_lng', v_target_lng);
  END IF;

  UPDATE public.planted_seeds
     SET collected_by = v_user, collected_at = now()
   WHERE id = p_seed_id
     AND collected_by IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_collected');
  END IF;

  IF (v_gate->>'override_used')::boolean THEN
    INSERT INTO public.proximity_override_log
      (user_id, action, tree_id, seed_id, distance_m, accuracy_m, is_keeper)
    VALUES
      (v_user, 'collect_heart', v_seed.tree_id, p_seed_id,
       (v_gate->>'distance')::numeric, p_user_accuracy, v_is_keeper);
    RAISE WARNING '[s33d] override used (%): collect_heart user=% seed=% dist=%',
      v_gate->>'override_kind', v_user, p_seed_id, v_gate->>'distance';
  END IF;

  RETURN v_gate || jsonb_build_object(
    'ok', true, 'seed_id', p_seed_id,
    'tree_lat', v_target_lat, 'tree_lng', v_target_lng
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'rpc_error', 'error', SQLERRM);
END;
$$;

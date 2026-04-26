-- ─── TASK 1: 33/33/33 seed heart split ──────────────────────
CREATE OR REPLACE FUNCTION public.distribute_seed_hearts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_planter_id UUID;
  v_tree_id UUID;
  v_pool_total INTEGER;
  v_windfalls_done INTEGER;
  v_next_threshold INTEGER;
  v_top_year UUID;
  v_top_month UUID;
  v_random_visitor UUID;
BEGIN
  IF OLD.collected_by IS NOT NULL OR NEW.collected_by IS NULL THEN
    RETURN NEW;
  END IF;

  v_planter_id := NEW.planter_id;
  v_tree_id := NEW.tree_id;

  -- 33/33/33 split (was 11/11/11) — total 99 hearts per collection
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NEW.collected_by, v_tree_id, NEW.id, 'wanderer', 33);

  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (v_planter_id, v_tree_id, NEW.id, 'sower', 33);

  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NULL, v_tree_id, NEW.id, 'tree', 33);

  INSERT INTO tree_heart_pools (tree_id, total_hearts, windfall_count, updated_at)
  VALUES (v_tree_id, 33, 0, now())
  ON CONFLICT (tree_id) DO UPDATE
  SET total_hearts = tree_heart_pools.total_hearts + 33,
      updated_at = now();

  SELECT total_hearts, windfall_count INTO v_pool_total, v_windfalls_done
  FROM tree_heart_pools WHERE tree_id = v_tree_id;

  v_next_threshold := (v_windfalls_done + 1) * 144;

  IF v_pool_total >= v_next_threshold THEN
    SELECT sv.user_id INTO v_top_year
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    GROUP BY sv.user_id ORDER BY count(*) DESC LIMIT 1;

    SELECT sv.user_id INTO v_top_month
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= date_trunc('month', now())
    GROUP BY sv.user_id ORDER BY count(*) DESC LIMIT 1;

    SELECT sv.user_id INTO v_random_visitor
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    ORDER BY random() LIMIT 1;

    INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
    VALUES (NULL, v_tree_id, 'windfall_pending', 3);

    IF v_top_year IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_top_year, v_tree_id, 'windfall', 3);
    END IF;
    IF v_top_month IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_top_month, v_tree_id, 'windfall', 3);
    END IF;
    IF v_random_visitor IS NOT NULL THEN
      INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
      VALUES (v_random_visitor, v_tree_id, 'windfall', 3);
    END IF;

    UPDATE tree_heart_pools
    SET windfall_count = v_windfalls_done + 1,
        last_windfall_at = now(),
        updated_at = now()
    WHERE tree_id = v_tree_id;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.distribute_seed_hearts() IS
'Canonical seed-collection reward distributor. 33/33/33 split (collector / planter / tree pool). Windfall threshold every 144 tree hearts.';

-- ─── TASK 2: atomic heart staking with structured errors ────
-- Drop old version (return type changes from SETOF tree_value_roots → jsonb)
DROP FUNCTION IF EXISTS public.plant_hearts_at_tree(uuid, uuid, integer, text, text);

CREATE OR REPLACE FUNCTION public.plant_hearts_at_tree(
  p_user_id uuid,
  p_tree_id uuid,
  p_amount integer,
  p_species_key text DEFAULT NULL,
  p_asset_type text DEFAULT 's33d_heart'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance integer;
  v_root tree_value_roots%ROWTYPE;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR v_caller <> p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trees WHERE id = p_tree_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tree_not_found');
  END IF;

  SELECT COALESCE(s33d_hearts, 0) INTO v_balance
  FROM user_heart_balances
  WHERE user_id = p_user_id;

  IF COALESCE(v_balance, 0) < p_amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'insufficient_hearts',
      'balance', COALESCE(v_balance, 0),
      'required', p_amount
    );
  END IF;

  -- Atomic: debit + stake in one transaction
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (p_user_id, p_tree_id, 'spend_plant_hearts', -p_amount);

  INSERT INTO public.tree_value_roots (
    user_id, tree_id, asset_type, amount, species_key, last_accrual_at, last_visit_at
  )
  VALUES (
    p_user_id, p_tree_id, p_asset_type, p_amount, p_species_key, now(), now()
  )
  ON CONFLICT (user_id, tree_id, asset_type)
  DO UPDATE SET
    amount = tree_value_roots.amount + p_amount,
    species_key = COALESCE(p_species_key, tree_value_roots.species_key),
    last_visit_at = now()
  RETURNING * INTO v_root;

  RETURN jsonb_build_object(
    'ok', true,
    'error', null,
    'root', to_jsonb(v_root)
  );
END;
$function$;

COMMENT ON FUNCTION public.plant_hearts_at_tree(uuid, uuid, integer, text, text) IS
'Atomically debits caller hearts and stakes them on a tree. Returns JSONB with structured error codes: unauthenticated, invalid_amount, tree_not_found, insufficient_hearts.';

-- ─── TASK 3: drop unused habitat_pool_ledger ────────────────
-- NOTE: heart_claims left intact (referenced by src/lib/heartService.ts)
DROP POLICY IF EXISTS "Anyone can read habitat pool" ON public.habitat_pool_ledger;
DROP POLICY IF EXISTS "Curators can insert habitat pool entries" ON public.habitat_pool_ledger;
DROP TABLE IF EXISTS public.habitat_pool_ledger CASCADE;

-- ─── TASK 4: deduplicate triggers + cron ────────────────────
-- (a) Two triggers using distribute_seed_hearts → keep `trg_distribute_seed_hearts`
DROP TRIGGER IF EXISTS on_seed_collected ON public.planted_seeds;

-- (b) Two daily-limit triggers → keep `enforce_seed_plant_limit`
DROP TRIGGER IF EXISTS enforce_seed_limit ON public.planted_seeds;
DROP FUNCTION IF EXISTS public.enforce_daily_seed_limit() CASCADE;

COMMENT ON TRIGGER trg_distribute_seed_hearts ON public.planted_seeds IS
'Canonical heart-distribution trigger on seed collection. Replaced duplicate `on_seed_collected`.';

COMMENT ON TRIGGER enforce_seed_plant_limit ON public.planted_seeds IS
'Canonical 3-seed daily plant limit. Replaced duplicate `enforce_seed_limit` + `enforce_daily_seed_limit()`.';

-- (c) Duplicate phenology cron — keep `aggregate-phenology-daily`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-phenology-aggregation') THEN
    PERFORM cron.unschedule('daily-phenology-aggregation');
  END IF;
END $$;

-- ─── TASK 5: tighten planted_seeds RLS ──────────────────────
DROP POLICY IF EXISTS "Users can plant seeds" ON public.planted_seeds;
DROP POLICY IF EXISTS "Users can collect bloomed seeds" ON public.planted_seeds;

CREATE POLICY "Users can plant seeds"
ON public.planted_seeds
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = planter_id);

CREATE POLICY "Users can collect bloomed seeds"
ON public.planted_seeds
FOR UPDATE
TO authenticated
USING (
  collected_by IS NULL
  AND blooms_at <= now()
  AND auth.uid() IS NOT NULL
  AND auth.uid() <> planter_id
);

-- ─── TASK 7: tighten market_seed_stakes RLS ─────────────────
DROP POLICY IF EXISTS "System can update stakes on resolution" ON public.market_seed_stakes;
DROP POLICY IF EXISTS "Users can stake seeds" ON public.market_seed_stakes;

CREATE POLICY "Users can stake seeds"
ON public.market_seed_stakes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stakes"
ON public.market_seed_stakes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ─── TASK 8: windfall pending index ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_heart_tx_windfall_pending
ON public.heart_transactions (heart_type)
WHERE user_id IS NULL AND heart_type = 'windfall_pending';
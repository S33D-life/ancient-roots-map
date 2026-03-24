-- Update enforce_daily_seed_limit: 33 → 3 seeds per day
CREATE OR REPLACE FUNCTION public.enforce_daily_seed_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM planted_seeds
  WHERE planter_id = NEW.planter_id
    AND planted_at::date = CURRENT_DATE;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Daily seed limit reached (max 3 per day)';
  END IF;

  -- Prevent self-collection at insert time
  IF NEW.collected_by = NEW.planter_id THEN
    RAISE EXCEPTION 'Cannot collect your own seed';
  END IF;

  RETURN NEW;
END;
$function$;

-- Update distribute_seed_hearts: 1/1/1 → 11/11/11 hearts
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
  v_next_visitor UUID;
  v_top_year UUID;
  v_top_month UUID;
  v_random_visitor UUID;
BEGIN
  -- Only fire when collected_by is newly set
  IF OLD.collected_by IS NOT NULL OR NEW.collected_by IS NULL THEN
    RETURN NEW;
  END IF;

  v_planter_id := NEW.planter_id;
  v_tree_id := NEW.tree_id;

  -- 1. Wanderer Heart → collector (11 hearts)
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NEW.collected_by, v_tree_id, NEW.id, 'wanderer', 11);

  -- 2. Sower Heart → planter (11 hearts)
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (v_planter_id, v_tree_id, NEW.id, 'sower', 11);

  -- 3. Tree Heart → pool (11 hearts)
  INSERT INTO heart_transactions (user_id, tree_id, seed_id, heart_type, amount)
  VALUES (NULL, v_tree_id, NEW.id, 'tree', 11);

  -- Update tree pool
  INSERT INTO tree_heart_pools (tree_id, total_hearts, windfall_count, updated_at)
  VALUES (v_tree_id, 11, 0, now())
  ON CONFLICT (tree_id) DO UPDATE
  SET total_hearts = tree_heart_pools.total_hearts + 11,
      updated_at = now();

  -- Check windfall threshold (every 144 tree hearts → 12 bonus)
  SELECT total_hearts, windfall_count INTO v_pool_total, v_windfalls_done
  FROM tree_heart_pools WHERE tree_id = v_tree_id;

  v_next_threshold := (v_windfalls_done + 1) * 144;

  IF v_pool_total >= v_next_threshold THEN
    SELECT sv.user_id INTO v_top_year
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    GROUP BY sv.user_id
    ORDER BY count(*) DESC
    LIMIT 1;

    SELECT sv.user_id INTO v_top_month
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= date_trunc('month', now())
    GROUP BY sv.user_id
    ORDER BY count(*) DESC
    LIMIT 1;

    SELECT sv.user_id INTO v_random_visitor
    FROM site_visits sv
    WHERE sv.user_id IS NOT NULL
      AND sv.created_at >= (now() - interval '1 year')
    ORDER BY random()
    LIMIT 1;

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
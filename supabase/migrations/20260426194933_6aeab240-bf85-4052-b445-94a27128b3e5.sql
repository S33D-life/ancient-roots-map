
-- Fix: align execute_lottery_draw ticket exclusion list with get_my_lottery_stats.
-- Previously lunar_prize and solar_prize counted as tickets, creating a feedback loop
-- where winning a prize granted you tickets in the next draw.
CREATE OR REPLACE FUNCTION public.execute_lottery_draw(p_draw_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_draw lottery_draws%ROWTYPE;
  v_cfg lottery_config%ROWTYPE;
  v_yield_bps integer;
  v_prize_amount integer;
  v_prize_count integer;
  v_window_days integer;
  v_window_start timestamptz;
  v_seed text;
  v_seed_float double precision;
  v_total_yield integer := 0;
  v_total_prizes integer := 0;
  v_total_entries integer := 0;
  v_total_tickets bigint := 0;
  v_winners jsonb := '[]'::jsonb;
  r record;
  v_ledger_id uuid;
  v_winner_user uuid;
  v_rank integer := 1;
BEGIN
  SELECT * INTO v_draw FROM lottery_draws WHERE id = p_draw_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'draw_not_found');
  END IF;
  IF v_draw.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'draw_not_pending', 'status', v_draw.status);
  END IF;

  UPDATE lottery_draws SET status = 'executing' WHERE id = p_draw_id;

  SELECT * INTO v_cfg FROM lottery_config WHERE id = 1;
  v_window_days := COALESCE(v_cfg.ticket_window_days, 14);

  IF v_draw.draw_type LIKE 'lunar_%' THEN
    v_yield_bps := v_cfg.lunar_yield_bps;
    v_prize_amount := v_cfg.lunar_prize_amount;
    v_prize_count := v_cfg.lunar_prize_count;
  ELSE
    v_yield_bps := v_cfg.solar_yield_bps;
    v_prize_amount := v_cfg.solar_prize_amount;
    v_prize_count := v_cfg.solar_prize_count;
  END IF;

  v_window_start := v_draw.scheduled_at - (v_window_days || ' days')::interval;

  v_seed := encode(
    digest(
      v_draw.id::text || ':' || v_draw.scheduled_at::text || ':' || clock_timestamp()::text,
      'sha256'
    ),
    'hex'
  );

  v_seed_float := (('x' || substr(v_seed, 1, 8))::bit(32)::int)::double precision / 2147483647.0;
  IF v_seed_float > 1 THEN v_seed_float := v_seed_float - 2; END IF;
  PERFORM setseed(LEAST(0.999999, GREATEST(-0.999999, v_seed_float)));

  -- ─── 1. STAKING YIELD ────────────────────────────────────
  FOR r IN
    SELECT user_id, SUM(amount)::integer AS staked
    FROM tree_value_roots
    WHERE asset_type = 's33d_heart' AND amount > 0
    GROUP BY user_id
    HAVING SUM(amount) > 0
  LOOP
    DECLARE
      v_yield integer := FLOOR(r.staked::numeric * v_yield_bps / 10000.0);
    BEGIN
      IF v_yield > 0 THEN
        INSERT INTO heart_transactions (user_id, heart_type, amount)
        VALUES (r.user_id, 'lunar_yield', v_yield)
        RETURNING id INTO v_ledger_id;

        INSERT INTO staking_yield_payouts (draw_id, user_id, staked_amount, yield_amount, ledger_entry_id)
        VALUES (p_draw_id, r.user_id, r.staked, v_yield, v_ledger_id)
        ON CONFLICT (draw_id, user_id) DO NOTHING;

        v_total_yield := v_total_yield + v_yield;
      END IF;
    END;
  END LOOP;

  -- ─── 2. TALLY TICKETS ────────────────────────────────────
  -- Hotfix: also exclude lunar_prize / solar_prize so winning a prize does
  -- not grant tickets in subsequent draws (feedback loop). This now matches
  -- the exclusion list in get_my_lottery_stats.
  INSERT INTO lottery_entries (draw_id, user_id, ticket_count)
  SELECT
    p_draw_id, user_id, SUM(amount)::integer
  FROM heart_transactions
  WHERE created_at > v_window_start
    AND created_at <= v_draw.scheduled_at
    AND user_id IS NOT NULL
    AND amount > 0
    AND heart_type NOT IN (
      'lunar_yield', 'solar_yield',
      'windfall_pending',
      'spend_plant_hearts',
      'lunar_prize', 'solar_prize'
    )
    AND heart_type NOT LIKE 'spend_%'
    AND heart_type NOT LIKE 'refund%'
  GROUP BY user_id
  HAVING SUM(amount) > 0
  ON CONFLICT (draw_id, user_id) DO UPDATE
    SET ticket_count = EXCLUDED.ticket_count;

  SELECT COUNT(*), COALESCE(SUM(ticket_count), 0)
    INTO v_total_entries, v_total_tickets
  FROM lottery_entries WHERE draw_id = p_draw_id;

  -- ─── 3. PICK WINNERS ────────────────────────────────────
  IF v_total_entries > 0 AND v_total_tickets > 0 THEN
    FOR v_rank IN 1..v_prize_count LOOP
      SELECT user_id INTO v_winner_user
      FROM lottery_entries
      WHERE draw_id = p_draw_id
        AND user_id NOT IN (
          SELECT user_id FROM lottery_winners WHERE draw_id = p_draw_id
        )
      ORDER BY (-ln(random()) / GREATEST(ticket_count, 1))
      LIMIT 1;

      EXIT WHEN v_winner_user IS NULL;

      INSERT INTO heart_transactions (user_id, heart_type, amount)
      VALUES (v_winner_user, 'lunar_prize', v_prize_amount)
      RETURNING id INTO v_ledger_id;

      INSERT INTO lottery_winners (draw_id, user_id, prize_rank, prize_amount, ledger_entry_id)
      VALUES (p_draw_id, v_winner_user, v_rank, v_prize_amount, v_ledger_id);

      v_total_prizes := v_total_prizes + v_prize_amount;
      v_winners := v_winners || jsonb_build_object(
        'rank', v_rank, 'user_id', v_winner_user, 'amount', v_prize_amount
      );
    END LOOP;
  END IF;

  UPDATE lottery_draws
  SET status = 'complete', executed_at = now(),
      yield_paid_total = v_total_yield,
      prize_pool_total = v_total_prizes,
      entries_total = v_total_entries,
      random_seed = v_seed
  WHERE id = p_draw_id;

  RETURN jsonb_build_object(
    'ok', true, 'draw_id', p_draw_id,
    'yield_paid_total', v_total_yield,
    'prizes_paid_total', v_total_prizes,
    'entries_total', v_total_entries,
    'tickets_total', v_total_tickets,
    'winners', v_winners,
    'random_seed', v_seed
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE lottery_draws SET status = 'failed', error_message = SQLERRM WHERE id = p_draw_id;
  RETURN jsonb_build_object('ok', false, 'error', 'execution_failed', 'message', SQLERRM);
END;
$function$;

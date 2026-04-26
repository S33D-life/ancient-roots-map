-- ════════════════════════════════════════════════════════════
-- LUNAR LOTTERY — schema + engine
-- ════════════════════════════════════════════════════════════

-- ─── 1. lottery_config (single row, id=1) ────────────────────
CREATE TABLE IF NOT EXISTS public.lottery_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  lunar_yield_bps integer NOT NULL DEFAULT 330,
  lunar_prize_amount integer NOT NULL DEFAULT 333,
  lunar_prize_count integer NOT NULL DEFAULT 3,
  solar_yield_bps integer NOT NULL DEFAULT 990,
  solar_prize_amount integer NOT NULL DEFAULT 999,
  solar_prize_count integer NOT NULL DEFAULT 3,
  ticket_window_days integer NOT NULL DEFAULT 14,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

INSERT INTO public.lottery_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lottery_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lottery config"
  ON public.lottery_config FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Curators can update lottery config"
  ON public.lottery_config FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'curator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'curator'::app_role));

-- ─── 2. lottery_draws ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lottery_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_type text NOT NULL CHECK (draw_type IN (
    'lunar_new','lunar_full',
    'solar_equinox_spring','solar_equinox_autumn',
    'solar_solstice_summer','solar_solstice_winter'
  )),
  scheduled_at timestamptz NOT NULL,
  executed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','executing','complete','failed')),
  yield_paid_total integer NOT NULL DEFAULT 0,
  prize_pool_total integer NOT NULL DEFAULT 0,
  entries_total integer NOT NULL DEFAULT 0,
  random_seed text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draw_type, scheduled_at)
);

CREATE INDEX IF NOT EXISTS idx_lottery_draws_status_scheduled
  ON public.lottery_draws (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_scheduled
  ON public.lottery_draws (scheduled_at DESC);

ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read draws"
  ON public.lottery_draws FOR SELECT TO authenticated, anon USING (true);
-- No INSERT/UPDATE/DELETE policies → only SECURITY DEFINER RPCs can write.

-- ─── 3. lottery_entries ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lottery_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lottery_entries_user ON public.lottery_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_lottery_entries_draw ON public.lottery_entries (draw_id);

ALTER TABLE public.lottery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own entries"
  ON public.lottery_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ─── 4. lottery_winners (public, transparency) ───────────────
CREATE TABLE IF NOT EXISTS public.lottery_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_rank integer NOT NULL CHECK (prize_rank >= 1),
  prize_amount integer NOT NULL CHECK (prize_amount > 0),
  ledger_entry_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draw_id, prize_rank),
  UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lottery_winners_user ON public.lottery_winners (user_id);
CREATE INDEX IF NOT EXISTS idx_lottery_winners_draw ON public.lottery_winners (draw_id);

ALTER TABLE public.lottery_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read winners"
  ON public.lottery_winners FOR SELECT TO authenticated, anon USING (true);

-- ─── 5. staking_yield_payouts ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staking_yield_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staked_amount integer NOT NULL,
  yield_amount integer NOT NULL,
  ledger_entry_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_yield_payouts_user ON public.staking_yield_payouts (user_id);
CREATE INDEX IF NOT EXISTS idx_yield_payouts_draw ON public.staking_yield_payouts (draw_id);

ALTER TABLE public.staking_yield_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own yield payouts"
  ON public.staking_yield_payouts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- RPCs
-- ════════════════════════════════════════════════════════════

-- ─── execute_lottery_draw(draw_id) ───────────────────────────
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
  -- Load draw with FOR UPDATE so concurrent runs cannot collide
  SELECT * INTO v_draw FROM lottery_draws
  WHERE id = p_draw_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'draw_not_found');
  END IF;

  IF v_draw.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'draw_not_pending', 'status', v_draw.status);
  END IF;

  -- Mark executing
  UPDATE lottery_draws SET status = 'executing' WHERE id = p_draw_id;

  -- Load config
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

  -- Generate audit seed (sha256 of draw_id + scheduled_at + clock_timestamp)
  v_seed := encode(
    digest(
      v_draw.id::text || ':' || v_draw.scheduled_at::text || ':' || clock_timestamp()::text,
      'sha256'
    ),
    'hex'
  );

  -- Convert hex seed to deterministic float in (-1, 1) for setseed
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
  -- 1 ticket per heart earned through action in window.
  -- EXCLUDES: yield types (lunar_yield, solar_yield), pending placeholders,
  -- spend types (negative amounts), windfall_pending.
  INSERT INTO lottery_entries (draw_id, user_id, ticket_count)
  SELECT
    p_draw_id,
    user_id,
    SUM(amount)::integer
  FROM heart_transactions
  WHERE created_at > v_window_start
    AND created_at <= v_draw.scheduled_at
    AND user_id IS NOT NULL
    AND amount > 0
    AND heart_type NOT IN ('lunar_yield', 'solar_yield', 'windfall_pending', 'spend_plant_hearts')
    AND heart_type NOT LIKE 'spend_%'
    AND heart_type NOT LIKE 'refund%'
  GROUP BY user_id
  HAVING SUM(amount) > 0
  ON CONFLICT (draw_id, user_id) DO UPDATE
    SET ticket_count = EXCLUDED.ticket_count;

  SELECT COUNT(*), COALESCE(SUM(ticket_count), 0)
    INTO v_total_entries, v_total_tickets
  FROM lottery_entries WHERE draw_id = p_draw_id;

  -- ─── 3. PICK WINNERS (weighted random, distinct) ─────────
  IF v_total_entries > 0 AND v_total_tickets > 0 THEN
    FOR v_rank IN 1..v_prize_count LOOP
      -- Weighted pick: ORDER BY -ln(random()) / weight (Efraimidis-Spirakis)
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
        'rank', v_rank,
        'user_id', v_winner_user,
        'amount', v_prize_amount
      );
    END LOOP;
  END IF;

  -- ─── 4. FINALIZE ─────────────────────────────────────────
  UPDATE lottery_draws
  SET status = 'complete',
      executed_at = now(),
      yield_paid_total = v_total_yield,
      prize_pool_total = v_total_prizes,
      entries_total = v_total_entries,
      random_seed = v_seed
  WHERE id = p_draw_id;

  RETURN jsonb_build_object(
    'ok', true,
    'draw_id', p_draw_id,
    'yield_paid_total', v_total_yield,
    'prizes_paid_total', v_total_prizes,
    'entries_total', v_total_entries,
    'tickets_total', v_total_tickets,
    'winners', v_winners,
    'random_seed', v_seed
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE lottery_draws
  SET status = 'failed', error_message = SQLERRM
  WHERE id = p_draw_id;
  RETURN jsonb_build_object('ok', false, 'error', 'execution_failed', 'message', SQLERRM);
END;
$function$;

-- Lock down so only service role / scheduler can call
REVOKE EXECUTE ON FUNCTION public.execute_lottery_draw(uuid) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.execute_lottery_draw(uuid) IS
'Executes a pending lottery draw: pays staking yield, tallies tickets (heart_transactions earned in window, excluding yield), and picks N distinct weighted-random winners. Logs random_seed for audit.';

-- ─── schedule_next_lunar_draws (idempotent batch insert) ────
CREATE OR REPLACE FUNCTION public.schedule_lottery_draw(
  p_draw_type text,
  p_scheduled_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO lottery_draws (draw_type, scheduled_at, status)
  VALUES (p_draw_type, p_scheduled_at, 'pending')
  ON CONFLICT (draw_type, scheduled_at) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM lottery_draws
    WHERE draw_type = p_draw_type AND scheduled_at = p_scheduled_at;
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.schedule_lottery_draw(text, timestamptz)
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.schedule_lottery_draw(text, timestamptz) IS
'Idempotently inserts a pending lottery draw. Called by the scheduler edge function with astronomically computed timestamps.';

-- ─── get_my_lottery_stats (caller-scoped) ───────────────────
CREATE OR REPLACE FUNCTION public.get_my_lottery_stats(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := COALESCE(p_user_id, auth.uid());
  v_cfg lottery_config%ROWTYPE;
  v_window_start timestamptz;
  v_next_draw lottery_draws%ROWTYPE;
  v_tickets integer := 0;
  v_breakdown jsonb;
  v_lifetime_prizes integer := 0;
  v_lifetime_yield integer := 0;
  v_total_staked integer := 0;
  v_estimated_yield integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  -- Caller may only see their own stats
  IF auth.uid() IS NULL OR auth.uid() <> v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_cfg FROM lottery_config WHERE id = 1;

  -- Next pending draw
  SELECT * INTO v_next_draw FROM lottery_draws
  WHERE status = 'pending'
  ORDER BY scheduled_at ASC
  LIMIT 1;

  v_window_start := COALESCE(v_next_draw.scheduled_at, now())
    - (COALESCE(v_cfg.ticket_window_days, 14) || ' days')::interval;

  -- Current cycle ticket count + breakdown
  SELECT
    COALESCE(SUM(amount), 0)::integer,
    jsonb_build_object(
      'collections', COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('wanderer','sower')), 0),
      'tree_pool',   COALESCE(SUM(amount) FILTER (WHERE heart_type = 'tree'), 0),
      'windfalls',   COALESCE(SUM(amount) FILTER (WHERE heart_type = 'windfall'), 0),
      'offerings',   COALESCE(SUM(amount) FILTER (WHERE heart_type LIKE 'earn_%' OR heart_type LIKE 'offering%'), 0),
      'other',       COALESCE(SUM(amount) FILTER (WHERE heart_type NOT IN ('wanderer','sower','tree','windfall')
                                                  AND heart_type NOT LIKE 'earn_%'
                                                  AND heart_type NOT LIKE 'offering%'), 0)
    )
  INTO v_tickets, v_breakdown
  FROM heart_transactions
  WHERE user_id = v_user
    AND amount > 0
    AND created_at > v_window_start
    AND heart_type NOT IN ('lunar_yield', 'solar_yield', 'windfall_pending', 'lunar_prize', 'solar_prize');

  -- Lifetime totals
  SELECT COALESCE(SUM(prize_amount), 0)::integer INTO v_lifetime_prizes
  FROM lottery_winners WHERE user_id = v_user;

  SELECT COALESCE(SUM(yield_amount), 0)::integer INTO v_lifetime_yield
  FROM staking_yield_payouts WHERE user_id = v_user;

  -- Total staked
  SELECT COALESCE(SUM(amount), 0)::integer INTO v_total_staked
  FROM tree_value_roots
  WHERE user_id = v_user AND asset_type = 's33d_heart';

  -- Estimated yield at next draw
  v_estimated_yield := FLOOR(v_total_staked::numeric * v_cfg.lunar_yield_bps / 10000.0);

  RETURN jsonb_build_object(
    'ok', true,
    'tickets', v_tickets,
    'tickets_breakdown', v_breakdown,
    'total_staked', v_total_staked,
    'lifetime_prizes', v_lifetime_prizes,
    'lifetime_yield', v_lifetime_yield,
    'estimated_yield_next', v_estimated_yield,
    'next_draw', CASE WHEN v_next_draw.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_next_draw.id,
      'draw_type', v_next_draw.draw_type,
      'scheduled_at', v_next_draw.scheduled_at,
      'prize_amount', v_cfg.lunar_prize_amount,
      'prize_count', v_cfg.lunar_prize_count,
      'yield_bps', v_cfg.lunar_yield_bps
    ) END
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_lottery_stats(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_my_lottery_stats(uuid) IS
'Returns the calling user''s tickets in the current cycle, lifetime prizes, lifetime yield, total staked, and the next draw timestamp.';
-- ─────────────────────────────────────────────────────────────
-- TASK 1 — Council hearts: dual-write to heart_transactions
-- BUG: claim_council_participation only wrote to heart_ledger,
-- so user_heart_balances never incremented.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_council_participation(p_session_key text, p_hearts integer DEFAULT 11)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.user_council_participation%ROWTYPE;
  v_ledger_id uuid;
  v_hearts integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'unauthenticated', 'message', 'Sign in to record your council presence.');
  END IF;

  IF p_session_key IS NULL OR length(trim(p_session_key)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_session', 'message', 'No council session was provided.');
  END IF;

  v_hearts := GREATEST(1, LEAST(COALESCE(p_hearts, 11), 100));

  SELECT * INTO v_existing
    FROM public.user_council_participation
   WHERE user_id = v_user_id AND session_key = p_session_key
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 'code', 'already_claimed',
      'message', 'Your presence is already recorded for this gathering.',
      'hearts_awarded', v_existing.hearts_awarded,
      'ledger_entry_id', v_existing.ledger_entry_id,
      'claimed_at', v_existing.created_at
    );
  END IF;

  INSERT INTO public.heart_ledger (
    user_id, amount, transaction_type, currency_type, source,
    entity_type, entity_id, status, chain_state, idempotency_key, metadata
  ) VALUES (
    v_user_id, v_hearts, 'earn_council', 'S33D', 'council_participation',
    'council_session', NULL, 'confirmed', 'offchain',
    'council:' || p_session_key || ':' || v_user_id::text,
    jsonb_build_object('session_key', p_session_key)
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_ledger_id;

  IF v_ledger_id IS NULL THEN
    SELECT id INTO v_ledger_id
      FROM public.heart_ledger
     WHERE idempotency_key = 'council:' || p_session_key || ':' || v_user_id::text
     LIMIT 1;
  END IF;

  -- HOTFIX: mirror to heart_transactions so update_heart_balance_on_insert fires.
  -- 'council' is added to enforce_daily_heart_cap skip list below (ceremonial, not farmable).
  INSERT INTO public.heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (v_user_id, NULL, 'council', v_hearts);

  INSERT INTO public.user_council_participation (
    user_id, session_key, hearts_awarded, ledger_entry_id, source
  ) VALUES (
    v_user_id, p_session_key, v_hearts, v_ledger_id, 'session_page'
  )
  ON CONFLICT (user_id, session_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true, 'code', 'claimed',
    'message', 'Presence recorded. Hearts will flow to you.',
    'hearts_awarded', v_hearts,
    'ledger_entry_id', v_ledger_id,
    'claimed_at', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'server_error', 'message', SQLERRM);
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- TASKS 1+2+7 — enforce_daily_heart_cap skip list expansion
-- BUG: ceremonial / paid / windfall types must not be capped,
-- and we now write windfall via INSERT (Task 3) so cap could bite.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_daily_heart_cap()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_daily_total integer;
BEGIN
  -- Skip system / ceremonial / paid / reward types that should not count toward the daily cap.
  -- Hotfix additions: 'council' (ceremonial), 'support_gratitude' (paid), 'root_growth' (passive accrual).
  IF NEW.heart_type IN (
    'windfall', 'windfall_pending', 'tree', 'bug_report',
    'patron_claim', 'task_completion', 'canopy_bonus',
    'council', 'support_gratitude', 'root_growth',
    'lunar_yield', 'lunar_prize', 'solar_yield', 'solar_prize'
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM heart_transactions
  WHERE user_id = NEW.user_id
    AND amount > 0
    AND created_at::date = CURRENT_DATE;

  IF v_daily_total + NEW.amount > 100 THEN
    RAISE EXCEPTION 'Daily heart earning cap reached (100 hearts/day)';
  END IF;

  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- TASK 7 — prevent_duplicate_heart_transaction skip list
-- BUG: after Task 3, claim_windfall_hearts INSERTs. Two windfalls
-- claimed at the same tree within 60s would otherwise be blocked.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_duplicate_heart_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_exists boolean;
BEGIN
  -- Skip system-generated and idempotency-protected types.
  -- Hotfix: added 'council' and 'support_gratitude' (idempotency-keyed in source RPC/webhook),
  -- and kept 'windfall' (one-claim-per-pending-row enforced by claim_windfall_hearts business logic).
  IF NEW.heart_type IN (
    'windfall', 'windfall_pending', 'tree',
    'council', 'support_gratitude',
    'lunar_yield', 'lunar_prize', 'solar_yield', 'solar_prize'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM heart_transactions
    WHERE user_id = NEW.user_id
      AND tree_id = NEW.tree_id
      AND heart_type = NEW.heart_type
      AND amount = NEW.amount
      AND created_at > now() - interval '60 seconds'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Duplicate heart transaction detected (anti-inflation guard)';
  END IF;

  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- TASK 3 — claim_windfall_hearts: replace UPDATE with INSERT
-- BUG: UPDATE doesn't fire AFTER INSERT balance trigger,
-- so claimed windfalls never credited the user's balance.
-- FIX OPTION A: delete the placeholder, insert a fresh row
-- under the claimer so update_heart_balance_on_insert fires.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_windfall_hearts(p_tree_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending_id UUID;
  v_amount INTEGER;
  v_created_at timestamptz;
BEGIN
  -- Find oldest unclaimed windfall_pending for this tree
  SELECT id, amount, created_at INTO v_pending_id, v_amount, v_created_at
  FROM heart_transactions
  WHERE tree_id = p_tree_id
    AND heart_type = 'windfall_pending'
    AND user_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_pending_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Consume the placeholder so it cannot be claimed twice.
  DELETE FROM heart_transactions WHERE id = v_pending_id;

  -- Insert a fresh row under the claimer so the AFTER INSERT
  -- balance trigger (update_heart_balance_on_insert) actually fires.
  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount, created_at)
  VALUES (p_user_id, p_tree_id, 'windfall', v_amount, v_created_at);

  RETURN v_amount;
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- TASK 5 — get_my_lottery_stats: real heart_type vocabulary
-- BUG: breakdown used heart_type LIKE 'earn_%' / 'offering%',
-- but heart_transactions uses bare strings. Buckets read 0.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_lottery_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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

  IF auth.uid() IS NULL OR auth.uid() <> v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_cfg FROM lottery_config WHERE id = 1;

  SELECT * INTO v_next_draw FROM lottery_draws
  WHERE status = 'pending'
  ORDER BY scheduled_at ASC
  LIMIT 1;

  v_window_start := COALESCE(v_next_draw.scheduled_at, now())
    - (COALESCE(v_cfg.ticket_window_days, 14) || ' days')::interval;

  -- Hotfix: align breakdown filters with the bare-string heart_type
  -- vocabulary actually written across the codebase (see discovery report §6).
  SELECT
    COALESCE(SUM(amount), 0)::integer,
    jsonb_build_object(
      'collections',   COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('wanderer','sower')), 0),
      'tree_pool',     COALESCE(SUM(amount) FILTER (WHERE heart_type = 'tree'), 0),
      'windfalls',     COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('windfall','windfall_pending')), 0),
      'offerings',     COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('offering','curation','source_verified','gift','time_tree')), 0),
      'presence',      COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('checkin','checkin_offering_bonus','checkin_witness_bonus','canopy_bonus','streak_bonus','streak_7','streak_33','milestone_33','mapping')), 0),
      'council',       COALESCE(SUM(amount) FILTER (WHERE heart_type = 'council'), 0),
      'contributions', COALESCE(SUM(amount) FILTER (WHERE heart_type IN ('support_gratitude','bug_report','task_completion','market_win','volume_ring','volume_ripple','root_growth')), 0),
      'other',         COALESCE(SUM(amount) FILTER (WHERE heart_type NOT IN (
                          'wanderer','sower','tree',
                          'windfall','windfall_pending',
                          'offering','curation','source_verified','gift','time_tree',
                          'checkin','checkin_offering_bonus','checkin_witness_bonus','canopy_bonus','streak_bonus','streak_7','streak_33','milestone_33','mapping',
                          'council',
                          'support_gratitude','bug_report','task_completion','market_win','volume_ring','volume_ripple','root_growth',
                          'lunar_yield','solar_yield','windfall_pending','lunar_prize','solar_prize'
                       )), 0)
    )
  INTO v_tickets, v_breakdown
  FROM heart_transactions
  WHERE user_id = v_user
    AND amount > 0
    AND created_at > v_window_start
    AND heart_type NOT IN ('lunar_yield','solar_yield','windfall_pending','lunar_prize','solar_prize');

  SELECT COALESCE(SUM(prize_amount), 0)::integer INTO v_lifetime_prizes
  FROM lottery_winners WHERE user_id = v_user;

  SELECT COALESCE(SUM(yield_amount), 0)::integer INTO v_lifetime_yield
  FROM staking_yield_payouts WHERE user_id = v_user;

  SELECT COALESCE(SUM(amount), 0)::integer INTO v_total_staked
  FROM tree_value_roots
  WHERE user_id = v_user AND asset_type = 's33d_heart';

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

-- ─────────────────────────────────────────────────────────────
-- TASK 6 — Drop heart_ledger UPDATE policy (security hole)
-- BUG: users could mutate their own confirmed ledger amounts.
-- Legitimate state changes go through SECURITY DEFINER RPCs.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own ledger entries" ON public.heart_ledger;

-- ─────────────────────────────────────────────────────────────
-- TASK 8 — Drop duplicate indexes on heart_transactions
-- Keep the more-used index in each pair (per pg_stat_user_indexes).
-- ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_heart_transactions_user_id;  -- 1354 scans, kept _user (7653)
DROP INDEX IF EXISTS public.idx_heart_transactions_tree;     -- 25 scans,   kept _tree_id (2082)

-- ─────────────────────────────────────────────────────────────
-- TASK 9 — Drop redundant public-read policy on species_heart_transactions
-- BUG: anonymous SELECT was allowed alongside authenticated SELECT.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view species heart transactions" ON public.species_heart_transactions;

-- ─────────────────────────────────────────────────────────────
-- BACKFILL (Task 2) — past stripe gratitude entries
-- Mirror every heart_ledger row of type 'earn_support_gratitude'
-- that has no corresponding heart_transactions 'support_gratitude'
-- row for the same (user_id, amount, created_at) into heart_transactions.
-- This restores the visible balance for already-paying users.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.heart_transactions (user_id, tree_id, heart_type, amount, created_at)
SELECT hl.user_id, NULL::uuid, 'support_gratitude', hl.amount, hl.created_at
FROM public.heart_ledger hl
WHERE hl.transaction_type = 'earn_support_gratitude'
  AND hl.status = 'confirmed'
  AND hl.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.heart_transactions ht
    WHERE ht.user_id = hl.user_id
      AND ht.heart_type = 'support_gratitude'
      AND ht.amount = hl.amount
      AND abs(extract(epoch FROM (ht.created_at - hl.created_at))) < 5
  );

-- ─────────────────────────────────────────────────────────────
-- BACKFILL (Task 3) — past windfall claims that never credited balance
-- Existing 'windfall' rows in heart_transactions were created via the
-- old UPDATE path (NULL → user_id), so update_heart_balance_on_insert
-- never fired. Reconcile user_heart_balances by adding the missing
-- amounts directly. New windfalls (post-this-migration) will credit
-- correctly via the new INSERT path.
-- ─────────────────────────────────────────────────────────────
WITH owed AS (
  SELECT user_id, SUM(amount)::integer AS missed
  FROM public.heart_transactions
  WHERE heart_type = 'windfall'
    AND user_id IS NOT NULL
  GROUP BY user_id
)
INSERT INTO public.user_heart_balances (user_id, s33d_hearts, lifetime_earned, last_earned_at, updated_at)
SELECT o.user_id, o.missed, o.missed, now(), now()
FROM owed o
ON CONFLICT (user_id) DO UPDATE
  SET s33d_hearts    = user_heart_balances.s33d_hearts + EXCLUDED.s33d_hearts,
      lifetime_earned = user_heart_balances.lifetime_earned + EXCLUDED.lifetime_earned,
      updated_at     = now();
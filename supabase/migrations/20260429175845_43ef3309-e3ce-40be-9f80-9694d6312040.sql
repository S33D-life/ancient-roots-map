
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
  v_is_solar boolean := false;
  v_prize_amount integer;
  v_prize_count integer;
  v_yield_bps integer;
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

  v_is_solar := v_next_draw.draw_type LIKE 'solar_%';

  IF v_is_solar THEN
    v_prize_amount := v_cfg.solar_prize_amount;
    v_prize_count  := v_cfg.solar_prize_count;
    v_yield_bps    := v_cfg.solar_yield_bps;
  ELSE
    v_prize_amount := v_cfg.lunar_prize_amount;
    v_prize_count  := v_cfg.lunar_prize_count;
    v_yield_bps    := v_cfg.lunar_yield_bps;
  END IF;

  -- Estimate yield based on the actual next draw's rate
  v_estimated_yield := FLOOR(v_total_staked::numeric * v_yield_bps / 10000.0);

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
      'prize_amount', v_prize_amount,
      'prize_count', v_prize_count,
      'yield_bps', v_yield_bps
    ) END
  );
END;
$function$;

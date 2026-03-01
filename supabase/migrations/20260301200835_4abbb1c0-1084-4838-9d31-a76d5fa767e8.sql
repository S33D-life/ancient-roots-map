
-- Atomic RPC: cast_influence_vote
-- Validates budget, inserts vote, updates budget in one transaction
CREATE OR REPLACE FUNCTION public.cast_influence_vote(
  p_offering_id UUID,
  p_user_id UUID,
  p_scope_type TEXT,
  p_scope_key TEXT,
  p_weight NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_spent NUMERIC;
  v_remaining NUMERIC;
  v_capped_weight NUMERIC;
  v_vote_id UUID;
  v_daily_budget CONSTANT NUMERIC := 50;
BEGIN
  -- Validate inputs
  IF p_scope_type NOT IN ('tree', 'species', 'place') THEN
    RAISE EXCEPTION 'Invalid scope_type: %', p_scope_type;
  END IF;
  IF p_weight <= 0 OR p_weight > 10 THEN
    RAISE EXCEPTION 'weight must be between 0 and 10';
  END IF;

  -- Check for existing active vote in same scope
  IF EXISTS (
    SELECT 1 FROM influence_votes
    WHERE offering_id = p_offering_id
      AND user_id = p_user_id
      AND scope_key = p_scope_key
      AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Already voted in this scope';
  END IF;

  -- Get current daily spend (with row lock)
  SELECT COALESCE(spent, 0) INTO v_spent
  FROM influence_vote_budgets
  WHERE user_id = p_user_id AND vote_date = v_today
  FOR UPDATE;

  IF v_spent IS NULL THEN
    v_spent := 0;
  END IF;

  v_remaining := v_daily_budget - v_spent;
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Daily influence budget exhausted';
  END IF;

  v_capped_weight := LEAST(p_weight, v_remaining);

  -- Insert vote
  INSERT INTO influence_votes (offering_id, user_id, scope_type, scope_key, weight_applied)
  VALUES (p_offering_id, p_user_id, p_scope_type, p_scope_key, v_capped_weight)
  RETURNING id INTO v_vote_id;

  -- Upsert budget
  INSERT INTO influence_vote_budgets (user_id, vote_date, spent)
  VALUES (p_user_id, v_today, v_spent + v_capped_weight)
  ON CONFLICT (user_id, vote_date) DO UPDATE
  SET spent = v_spent + v_capped_weight;

  RETURN v_vote_id;
END;
$function$;

-- Atomic RPC: retract_influence_vote
CREATE OR REPLACE FUNCTION public.retract_influence_vote(
  p_vote_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_weight NUMERIC;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get vote weight and verify ownership
  SELECT weight_applied INTO v_weight
  FROM influence_votes
  WHERE id = p_vote_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;

  IF v_weight IS NULL THEN
    RAISE EXCEPTION 'Vote not found or already revoked';
  END IF;

  -- Revoke vote
  UPDATE influence_votes
  SET revoked_at = now()
  WHERE id = p_vote_id;

  -- Refund budget
  UPDATE influence_vote_budgets
  SET spent = GREATEST(0, spent - v_weight)
  WHERE user_id = p_user_id AND vote_date = v_today;
END;
$function$;


-- ═══ HEART ECONOMY HARDENING ═══

-- 1. Add lifetime tracking columns to user_heart_balances
ALTER TABLE public.user_heart_balances
  ADD COLUMN IF NOT EXISTS lifetime_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_earned_at timestamptz;

-- 2. Backfill lifetime_earned from existing heart_transactions
UPDATE user_heart_balances uhb
SET lifetime_earned = COALESCE((
  SELECT SUM(amount) FROM heart_transactions ht
  WHERE ht.user_id = uhb.user_id AND ht.amount > 0
), 0),
lifetime_spent = COALESCE((
  SELECT ABS(SUM(amount)) FROM heart_transactions ht
  WHERE ht.user_id = uhb.user_id AND ht.amount < 0
), 0),
last_earned_at = (
  SELECT MAX(created_at) FROM heart_transactions ht
  WHERE ht.user_id = uhb.user_id AND ht.amount > 0
);

-- 3. Update the balance trigger to track lifetime columns
CREATE OR REPLACE FUNCTION public.update_heart_balance_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO user_heart_balances (user_id, s33d_hearts, lifetime_earned, lifetime_spent, last_earned_at, updated_at)
    VALUES (
      NEW.user_id,
      NEW.amount,
      CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
      CASE WHEN NEW.amount > 0 THEN now() ELSE NULL END,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET s33d_hearts = user_heart_balances.s33d_hearts + NEW.amount,
        lifetime_earned = user_heart_balances.lifetime_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        lifetime_spent = user_heart_balances.lifetime_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
        last_earned_at = CASE WHEN NEW.amount > 0 THEN now() ELSE user_heart_balances.last_earned_at END,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Prevent duplicate offering hearts (same user, same tree, same type within 60 seconds)
CREATE OR REPLACE FUNCTION public.prevent_duplicate_heart_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_exists boolean;
BEGIN
  -- Skip for system-generated types (windfall, tree, windfall_pending)
  IF NEW.heart_type IN ('windfall', 'windfall_pending', 'tree') THEN
    RETURN NEW;
  END IF;

  -- Check for duplicate: same user, tree, type within 60 seconds
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
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_hearts ON public.heart_transactions;
CREATE TRIGGER prevent_duplicate_hearts
BEFORE INSERT ON public.heart_transactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_heart_transaction();

-- 5. Enforce server-side daily seed planting limit (max 3)
CREATE OR REPLACE FUNCTION public.enforce_daily_seed_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

DROP TRIGGER IF EXISTS enforce_seed_limit ON public.planted_seeds;
CREATE TRIGGER enforce_seed_limit
BEFORE INSERT ON public.planted_seeds
FOR EACH ROW
EXECUTE FUNCTION public.enforce_daily_seed_limit();

-- 6. Prevent self-collection on update
CREATE OR REPLACE FUNCTION public.enforce_seed_collection_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only check when collected_by is being set
  IF OLD.collected_by IS NULL AND NEW.collected_by IS NOT NULL THEN
    -- Cannot collect own seed
    IF NEW.collected_by = NEW.planter_id THEN
      RAISE EXCEPTION 'Cannot collect your own seed';
    END IF;
    -- Must be bloomed
    IF NEW.blooms_at > now() THEN
      RAISE EXCEPTION 'Seed has not bloomed yet';
    END IF;
    -- Cannot re-collect
    IF OLD.collected_at IS NOT NULL THEN
      RAISE EXCEPTION 'Seed already collected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_seed_collection ON public.planted_seeds;
CREATE TRIGGER enforce_seed_collection
BEFORE UPDATE ON public.planted_seeds
FOR EACH ROW
EXECUTE FUNCTION public.enforce_seed_collection_rules();

-- 7. Daily heart earning cap per user (max 100 hearts/day to prevent farming)
CREATE OR REPLACE FUNCTION public.enforce_daily_heart_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_daily_total integer;
BEGIN
  -- Skip system types
  IF NEW.heart_type IN ('windfall', 'windfall_pending', 'tree', 'bug_report') THEN
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
$$;

DROP TRIGGER IF EXISTS enforce_heart_cap ON public.heart_transactions;
CREATE TRIGGER enforce_heart_cap
BEFORE INSERT ON public.heart_transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_daily_heart_cap();

-- 8. Offering duplicate detection (same user, same tree, same content within 5 minutes)
CREATE OR REPLACE FUNCTION public.prevent_duplicate_offering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM offerings
    WHERE created_by = NEW.created_by
      AND tree_id = NEW.tree_id
      AND type = NEW.type
      AND created_at > now() - interval '5 minutes'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Duplicate offering detected. Please wait before submitting again.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_dup_offering ON public.offerings;
CREATE TRIGGER prevent_dup_offering
BEFORE INSERT ON public.offerings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_offering();

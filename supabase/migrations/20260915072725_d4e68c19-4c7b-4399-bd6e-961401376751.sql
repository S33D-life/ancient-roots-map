
-- Helper: balance read + row lock, isolated so the guard itself can run
-- as the caller (SECURITY INVOKER) and still serialise concurrent spends.
CREATE OR REPLACE FUNCTION public.locked_own_heart_balance()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_bal integer; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  SELECT s33d_hearts INTO v_bal FROM public.user_heart_balances WHERE user_id = v_uid FOR UPDATE;
  RETURN COALESCE(v_bal, 0);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.locked_own_heart_balance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.locked_own_heart_balance() TO authenticated, service_role;

-- The trust test must observe the *caller's* role, so it runs as invoker
-- and must be callable by the roles whose writes it polices.
CREATE OR REPLACE FUNCTION public.is_untrusted_heart_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$ SELECT current_user IN ('authenticated', 'anon') $$;

GRANT EXECUTE ON FUNCTION public.is_untrusted_heart_writer() TO anon, authenticated, service_role;

-- ── heart_transactions guard (now SECURITY INVOKER) ──
CREATE OR REPLACE FUNCTION public.enforce_heart_transaction_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rule   public.heart_award_rules%ROWTYPE;
  v_uid    uuid := auth.uid();
  v_bal    integer;
  v_cap    constant integer := 10;
BEGIN
  IF NOT public.is_untrusted_heart_writer() THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hearts may only be recorded for a signed-in Wanderer';
  END IF;
  IF NEW.user_id IS NULL OR NEW.user_id <> v_uid THEN
    RAISE EXCEPTION 'Hearts may only be recorded for your own account';
  END IF;
  IF NEW.amount IS NULL OR NEW.amount = 0 THEN
    RAISE EXCEPTION 'Heart amount must be non-zero';
  END IF;

  SELECT * INTO v_rule FROM public.heart_award_rules WHERE heart_type = NEW.heart_type;

  IF NEW.amount > 0 THEN
    IF v_rule.heart_type IS NOT NULL AND NOT v_rule.client_allowed THEN
      RAISE EXCEPTION 'Heart type % is issued by the grove itself, not by a Wanderer', NEW.heart_type;
    END IF;
    IF NEW.amount > COALESCE(v_rule.max_amount, v_cap) THEN
      RAISE EXCEPTION 'Heart amount % exceeds the allowance for %', NEW.amount, NEW.heart_type;
    END IF;
  ELSE
    IF NEW.heart_type IS NULL OR NEW.heart_type NOT LIKE 'spend\_%' THEN
      RAISE EXCEPTION 'Only spend_* transactions may carry a negative amount';
    END IF;
    v_bal := public.locked_own_heart_balance();
    IF v_bal < ABS(NEW.amount) THEN
      RAISE EXCEPTION 'Not enough Hearts for this offering (have %, need %)', v_bal, ABS(NEW.amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ── heart_ledger guard (now SECURITY INVOKER) ──
CREATE OR REPLACE FUNCTION public.enforce_heart_ledger_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rule   public.heart_award_rules%ROWTYPE;
  v_uid    uuid := auth.uid();
  v_legacy text;
  v_cap    constant integer := 10;
BEGIN
  IF NOT public.is_untrusted_heart_writer() THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL OR NEW.user_id IS NULL OR NEW.user_id <> v_uid THEN
    RAISE EXCEPTION 'Ledger entries may only be written for your own account';
  END IF;
  IF COALESCE(NEW.currency_type, 'S33D') <> 'S33D' THEN
    RAISE EXCEPTION 'Only S33D ledger entries may be written directly';
  END IF;

  v_legacy := CASE
    WHEN NEW.transaction_type LIKE 'earn\_%' THEN substring(NEW.transaction_type from 6)
    ELSE NEW.transaction_type
  END;

  SELECT * INTO v_rule FROM public.heart_award_rules WHERE heart_type = v_legacy;

  IF COALESCE(NEW.amount, 0) > 0 THEN
    IF v_rule.heart_type IS NOT NULL AND NOT v_rule.client_allowed THEN
      RAISE EXCEPTION 'Ledger type % is issued by the grove itself', NEW.transaction_type;
    END IF;
    IF NEW.amount > COALESCE(v_rule.max_amount, v_cap) THEN
      RAISE EXCEPTION 'Ledger amount % exceeds the allowance for %', NEW.amount, NEW.transaction_type;
    END IF;
  ELSIF COALESCE(NEW.amount, 0) < 0 THEN
    IF NEW.transaction_type NOT LIKE 'spend\_%' THEN
      RAISE EXCEPTION 'Only spend_* ledger entries may carry a negative amount';
    END IF;
  ELSE
    RAISE EXCEPTION 'Ledger amount must be non-zero';
  END IF;

  RETURN NEW;
END;
$function$;

-- ── species / influence guard (now SECURITY INVOKER) ──
CREATE OR REPLACE FUNCTION public.enforce_fractal_token_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF NOT public.is_untrusted_heart_writer() THEN
    RETURN NEW;
  END IF;
  IF v_uid IS NULL OR NEW.user_id IS NULL OR NEW.user_id <> v_uid THEN
    RAISE EXCEPTION 'Tokens may only be recorded for your own account';
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 OR NEW.amount > 10 THEN
    RAISE EXCEPTION 'Token amount out of range';
  END IF;
  RETURN NEW;
END;
$function$;

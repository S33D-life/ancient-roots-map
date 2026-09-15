-- 1. Authoritative rules for the fractal currencies -------------------------
CREATE TABLE IF NOT EXISTS public.fractal_award_rules (
  currency      text    NOT NULL,
  action_type   text    NOT NULL,
  client_allowed boolean NOT NULL DEFAULT true,
  max_amount    integer NOT NULL DEFAULT 3,
  daily_cap     integer NOT NULL DEFAULT 200,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (currency, action_type)
);

GRANT SELECT ON public.fractal_award_rules TO authenticated;
GRANT SELECT ON public.fractal_award_rules TO anon;
GRANT ALL    ON public.fractal_award_rules TO service_role;

ALTER TABLE public.fractal_award_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone may read the award rules" ON public.fractal_award_rules;
CREATE POLICY "Anyone may read the award rules"
  ON public.fractal_award_rules FOR SELECT USING (true);

INSERT INTO public.fractal_award_rules (currency, action_type, client_allowed, max_amount, daily_cap, notes) VALUES
  ('SPECIES',   'mapping',            true,  3,  200, 'Mapping an Ancient Friend'),
  ('SPECIES',   'checkin',            true,  3,  200, 'Canopy check-in'),
  ('SPECIES',   'offering',           true,  1,  200, 'Offering left at a tree'),
  ('SPECIES',   'curation',           true,  1,  200, 'Curation action'),
  ('SPECIES',   'species_discovery',  false, 1,  200, 'System: species badge trigger'),
  ('INFLUENCE', 'mapping',            true,  2,  50,  'Mapping an Ancient Friend'),
  ('INFLUENCE', 'checkin',            true,  1,  50,  'Canopy check-in'),
  ('INFLUENCE', 'offering',           true,  1,  50,  'Offering left at a tree'),
  ('INFLUENCE', 'curation',           true,  1,  50,  'Curation action'),
  ('INFLUENCE', 'source_contribution', false, 1, 50,  'System: source review reward')
ON CONFLICT (currency, action_type) DO NOTHING;

-- 2. Rate / replay / allowance guard on both fractal ledgers -----------------
CREATE OR REPLACE FUNCTION public.enforce_fractal_token_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid      uuid := auth.uid();
  v_currency text := CASE TG_TABLE_NAME
                       WHEN 'species_heart_transactions' THEN 'SPECIES'
                       ELSE 'INFLUENCE'
                     END;
  v_rule     public.fractal_award_rules%ROWTYPE;
  v_today    integer;
BEGIN
  -- Trusted grove routines (SECURITY DEFINER, service role) are unaffected.
  IF NOT public.is_untrusted_heart_writer() THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL OR NEW.user_id IS NULL OR NEW.user_id <> v_uid THEN
    RAISE EXCEPTION 'Tokens may only be recorded for your own account';
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Token amount out of range';
  END IF;

  SELECT * INTO v_rule
  FROM public.fractal_award_rules
  WHERE currency = v_currency AND action_type = NEW.action_type;

  IF v_rule.action_type IS NULL THEN
    RAISE EXCEPTION '% tokens are not earned by % in the grove', v_currency, NEW.action_type;
  END IF;
  IF NOT v_rule.client_allowed THEN
    RAISE EXCEPTION '% tokens for % are issued by the grove itself', v_currency, NEW.action_type;
  END IF;
  IF NEW.amount > v_rule.max_amount THEN
    RAISE EXCEPTION 'Amount % exceeds the allowance for %', NEW.amount, NEW.action_type;
  END IF;

  -- Replay guard: the same award, for the same tree, within a minute.
  IF TG_TABLE_NAME = 'species_heart_transactions' THEN
    IF EXISTS (
      SELECT 1 FROM public.species_heart_transactions
      WHERE user_id = NEW.user_id
        AND action_type = NEW.action_type
        AND amount = NEW.amount
        AND tree_id IS NOT DISTINCT FROM NEW.tree_id
        AND created_at > now() - interval '60 seconds'
    ) THEN
      RAISE EXCEPTION 'This Species Heart has already been gathered a moment ago';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_today
    FROM public.species_heart_transactions
    WHERE user_id = NEW.user_id AND amount > 0 AND created_at::date = CURRENT_DATE;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.influence_transactions
      WHERE user_id = NEW.user_id
        AND action_type = NEW.action_type
        AND amount = NEW.amount
        AND tree_id IS NOT DISTINCT FROM NEW.tree_id
        AND created_at > now() - interval '60 seconds'
    ) THEN
      RAISE EXCEPTION 'This Influence has already been gathered a moment ago';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_today
    FROM public.influence_transactions
    WHERE user_id = NEW.user_id AND amount > 0 AND created_at::date = CURRENT_DATE;
  END IF;

  IF v_today + NEW.amount > v_rule.daily_cap THEN
    RAISE EXCEPTION 'Daily % ceiling reached (% per day)', v_currency, v_rule.daily_cap;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Bug rewards: one reward per spark --------------------------------------
CREATE OR REPLACE FUNCTION public.award_bug_hearts(p_bug_id uuid, p_amount integer, p_curator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bug    public.bug_reports%ROWTYPE;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR p_curator_id IS NULL OR v_caller <> p_curator_id THEN
    RAISE EXCEPTION 'Only a signed-in curator may award hearts';
  END IF;
  IF NOT public.has_role(v_caller, 'curator') THEN
    RAISE EXCEPTION 'Only curators can award hearts';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 500 THEN
    RAISE EXCEPTION 'Award amount out of range';
  END IF;

  SELECT * INTO v_bug FROM public.bug_reports WHERE id = p_bug_id FOR UPDATE;
  IF v_bug.id IS NULL OR v_bug.user_id IS NULL THEN
    RAISE EXCEPTION 'Bug not found';
  END IF;
  IF v_bug.reward_state = 'awarded' OR v_bug.hearts_awarded_total > 0 THEN
    RAISE EXCEPTION 'This spark has already been rewarded';
  END IF;

  UPDATE public.bug_reports
  SET hearts_awarded_total = p_amount, reward_state = 'awarded'
  WHERE id = p_bug_id;

  INSERT INTO public.heart_transactions (user_id, heart_type, amount, tree_id)
  VALUES (v_bug.user_id, 'bug_report', p_amount, NULL);
END;
$function$;

-- 4. Task rewards: only the genuine first approval ---------------------------
CREATE OR REPLACE FUNCTION public.award_task_submission_hearts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hearts integer;
  v_caller uuid := auth.uid();
BEGIN
  -- An approved submission is settled: it cannot be cycled back and re-approved.
  IF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
    RAISE EXCEPTION 'An approved submission cannot be reopened';
  END IF;

  IF OLD.status = NEW.status OR NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Idempotent regardless of interface state.
  IF COALESCE(OLD.hearts_awarded, 0) > 0 THEN
    RAISE EXCEPTION 'This submission has already been rewarded';
  END IF;

  -- A curator may not approve their own work.
  IF v_caller IS NOT NULL AND v_caller = NEW.submitted_by THEN
    RAISE EXCEPTION 'A curator may not approve their own submission';
  END IF;
  IF NEW.reviewed_by IS NOT NULL AND NEW.reviewed_by = NEW.submitted_by THEN
    RAISE EXCEPTION 'A curator may not approve their own submission';
  END IF;

  SELECT hearts_reward INTO v_hearts FROM public.agent_garden_tasks WHERE id = NEW.task_id;
  IF v_hearts IS NULL OR v_hearts <= 0 THEN
    v_hearts := 5;
  END IF;
  v_hearts := LEAST(v_hearts, 100);

  NEW.hearts_awarded := v_hearts;
  NEW.reviewed_at := now();

  INSERT INTO public.heart_transactions (user_id, heart_type, amount)
  VALUES (NEW.submitted_by, 'task_completion', v_hearts);

  UPDATE public.agent_garden_tasks
  SET submissions_count = submissions_count + 1, updated_at = now()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$function$;

-- 5. Mirror ledger: spends face the same balance check ----------------------
CREATE OR REPLACE FUNCTION public.enforce_heart_ledger_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_rule   public.heart_award_rules%ROWTYPE;
  v_uid    uuid := auth.uid();
  v_legacy text;
  v_bal    integer;
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
    -- Mirror of the authoritative path: a spend may never exceed the held balance.
    v_bal := public.locked_own_heart_balance();
    IF v_bal < ABS(NEW.amount) THEN
      RAISE EXCEPTION 'Not enough Hearts for this offering (have %, need %)', v_bal, ABS(NEW.amount);
    END IF;
  ELSE
    RAISE EXCEPTION 'Ledger amount must be non-zero';
  END IF;

  RETURN NEW;
END;
$function$;
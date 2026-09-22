-- 1. Authoritative rule rows for system-issued fractal awards
INSERT INTO public.fractal_award_rules (currency, action_type, max_amount, daily_cap, client_allowed, notes)
VALUES
  ('SPECIES', 'patron_claim', 33, 200, false, 'System: founding patron staff claim'),
  ('SPECIES', 'stewardship_action', 1, 200, false, 'System: stewardship action'),
  ('SPECIES', 'contribution', 1, 200, false, 'System: tree contribution'),
  ('INFLUENCE', 'patron_claim', 33, 50, false, 'System: founding patron staff claim')
ON CONFLICT (currency, action_type) DO NOTHING;

-- 2. Repair trusted reward routines that wrote to a non-existent column
CREATE OR REPLACE FUNCTION public.on_staff_claimed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starting_hearts INTEGER := 3333;
  v_influence_bonus INTEGER := 33;
  v_species_hearts_bonus INTEGER := 33;
BEGIN
  IF OLD.owner_user_id IS NOT NULL OR NEW.owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.owner_user_id, NULL, 'patron_claim', v_starting_hearts);

  INSERT INTO public.influence_transactions (user_id, action_type, amount, reason, scope)
  VALUES (NEW.owner_user_id, 'patron_claim', v_influence_bonus, 'Founding patron staff claim: ' || NEW.id, 'global');

  INSERT INTO public.species_heart_transactions (user_id, species_family, amount, action_type, tree_id)
  VALUES (NEW.owner_user_id, NEW.species, v_species_hearts_bonus, 'patron_claim', NULL);

  INSERT INTO public.ceremony_logs (user_id, staff_code, staff_name, staff_species, ceremony_type)
  VALUES (NEW.owner_user_id, NEW.id, NEW.species || ' Staff', NEW.species, 'claim');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reward_stewardship_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_species TEXT;
BEGIN
  INSERT INTO public.heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.user_id, NEW.tree_id, 'stewardship', 3);

  SELECT species INTO v_species FROM public.trees WHERE id = NEW.tree_id;
  IF v_species IS NOT NULL AND v_species <> '' THEN
    INSERT INTO public.species_heart_transactions (user_id, species_family, amount, action_type, tree_id)
    VALUES (NEW.user_id, v_species, 1, 'stewardship_action', NEW.tree_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reward_tree_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.heart_transactions (user_id, tree_id, heart_type, amount)
  VALUES (NEW.user_id, NEW.tree_id, 'contribution', 2);

  INSERT INTO public.species_heart_transactions (user_id, species_family, amount, action_type, tree_id)
  SELECT NEW.user_id, t.species, 1, 'contribution', NEW.tree_id
  FROM public.trees t WHERE t.id = NEW.tree_id AND t.species IS NOT NULL;

  RETURN NEW;
END;
$$;

-- 3. Stronger duplicate protection for client-written fractal awards:
--    one award per user, per action, per tree, per day (instead of a 60s window).
CREATE OR REPLACE FUNCTION public.enforce_fractal_token_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_currency text := CASE TG_TABLE_NAME
                       WHEN 'species_heart_transactions' THEN 'SPECIES'
                       ELSE 'INFLUENCE'
                     END;
  v_rule     public.fractal_award_rules%ROWTYPE;
  v_today    integer;
  v_dupe     boolean;
BEGIN
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

  IF TG_TABLE_NAME = 'species_heart_transactions' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.species_heart_transactions
      WHERE user_id = NEW.user_id
        AND action_type = NEW.action_type
        AND amount > 0
        AND (
          (NEW.tree_id IS NOT NULL AND tree_id = NEW.tree_id AND created_at >= date_trunc('day', now()))
          OR (NEW.tree_id IS NULL AND tree_id IS NULL AND created_at > now() - interval '60 seconds')
        )
    ) INTO v_dupe;

    SELECT COALESCE(SUM(amount), 0) INTO v_today
    FROM public.species_heart_transactions
    WHERE user_id = NEW.user_id AND amount > 0 AND created_at >= date_trunc('day', now());
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.influence_transactions
      WHERE user_id = NEW.user_id
        AND action_type = NEW.action_type
        AND amount > 0
        AND (
          (NEW.tree_id IS NOT NULL AND tree_id = NEW.tree_id AND created_at >= date_trunc('day', now()))
          OR (NEW.tree_id IS NULL AND tree_id IS NULL AND created_at > now() - interval '60 seconds')
        )
    ) INTO v_dupe;

    SELECT COALESCE(SUM(amount), 0) INTO v_today
    FROM public.influence_transactions
    WHERE user_id = NEW.user_id AND amount > 0 AND created_at >= date_trunc('day', now());
  END IF;

  IF v_dupe THEN
    RAISE EXCEPTION 'This % has already been gathered here today', v_currency;
  END IF;

  IF v_today + NEW.amount > v_rule.daily_cap THEN
    RAISE EXCEPTION 'Daily % ceiling reached (% per day)', v_currency, v_rule.daily_cap;
  END IF;

  RETURN NEW;
END;
$$;
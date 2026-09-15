
-- ─────────────────────────────────────────────────────────────
-- 1. HEART AWARD RULE BOOK (database is authoritative on amounts)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.heart_award_rules (
  heart_type      text PRIMARY KEY,
  max_amount      integer NOT NULL CHECK (max_amount > 0),
  client_allowed  boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.heart_award_rules TO anon, authenticated;
GRANT ALL ON public.heart_award_rules TO service_role;
ALTER TABLE public.heart_award_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read heart award rules" ON public.heart_award_rules;
CREATE POLICY "Anyone can read heart award rules"
  ON public.heart_award_rules FOR SELECT
  TO anon, authenticated USING (true);

-- Client-earnable types with their hard ceilings (observed legitimate maxima
-- with headroom). Anything absent falls back to a global ceiling of 10.
INSERT INTO public.heart_award_rules (heart_type, max_amount, client_allowed, notes) VALUES
  ('checkin',                 10,  true,  'Canopy check-in'),
  ('mapping',                 10,  true,  'Legacy mapping alias'),
  ('tree_mapping',            10,  true,  'Ancient Friend mapped'),
  ('offering',                 5,  true,  'Offering left at a tree'),
  ('curation',                 3,  true,  'Curation action'),
  ('contribution',            10,  true,  'Tree contribution'),
  ('bloom_offering',           2,  true,  'Bloom offering'),
  ('bloom_first_of_season',    5,  true,  'First bloom of the season'),
  ('gift',                   100,  true,  'Gift seed inbox claim'),
  ('volume_ring',              2,  true,  'Collaborator shelf ring'),
  ('volume_ripple',            5,  true,  'Collaborator shelf ripple'),
  ('market_win',            1000,  true,  'Prediction market payout share'),
  ('source_verified',         25,  true,  'Source review reward'),
  ('streak_bonus',            15,  true,  'Presence streak bonus'),
  ('streak_7',                 5,  true,  'Seven-day presence streak'),
  ('streak_33',               15,  true,  'Thirty-three day presence streak'),
  ('milestone_33',            15,  true,  'Thirty-three session milestone'),
  ('time_tree',                5,  true,  'Time tree entry'),
  ('referral',                33,  true,  'Referral reward'),
  -- System-only: these bypass the daily cap and must never originate in a browser.
  ('windfall',              9999,  false, 'System: windfall claim RPC'),
  ('windfall_pending',      9999,  false, 'System: windfall placeholder'),
  ('patron_claim',          9999,  false, 'System: patron claim'),
  ('patron_grant',          9999,  false, 'System: patron grant'),
  ('bug_report',            9999,  false, 'System: curator bug award RPC'),
  ('task_completion',       9999,  false, 'System: task submission RPC'),
  ('canopy_bonus',          9999,  false, 'System: canopy-checkin edge function'),
  ('council',               9999,  false, 'System: council participation RPC'),
  ('support_gratitude',     9999,  false, 'System: Stripe webhook'),
  ('root_growth',           9999,  false, 'System: passive accrual'),
  ('lunar_yield',           9999,  false, 'System: lottery'),
  ('lunar_prize',           9999,  false, 'System: lottery'),
  ('solar_yield',           9999,  false, 'System: lottery'),
  ('solar_prize',           9999,  false, 'System: lottery'),
  ('tree',                  9999,  false, 'System: tree value distribution'),
  ('wanderer',              9999,  false, 'System: seed heart distribution'),
  ('sower',                 9999,  false, 'System: seed heart distribution'),
  ('refund',                9999,  false, 'System: refund'),
  ('admin_grant',           9999,  false, 'System: admin grant'),
  ('admin_debit',           9999,  false, 'System: admin debit')
ON CONFLICT (heart_type) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. TRUST BOUNDARY HELPER
--    Inside SECURITY DEFINER RPCs current_user is the function owner
--    (postgres); edge functions arrive as service_role. Only direct
--    PostgREST writes arrive as authenticated/anon.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_untrusted_heart_writer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT current_user IN ('authenticated', 'anon') $$;

-- ─────────────────────────────────────────────────────────────
-- 3. HEART_TRANSACTIONS AUTHORITY TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_heart_transaction_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rule   public.heart_award_rules%ROWTYPE;
  v_uid    uuid := auth.uid();
  v_bal    integer;
  v_cap    constant integer := 10;  -- ceiling for unlisted client types
BEGIN
  IF NOT public.is_untrusted_heart_writer() THEN
    RETURN NEW;  -- trusted server path (SECURITY DEFINER RPC / service_role)
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
    -- Spending: must be a spend_* type and covered by a locked balance read.
    IF NEW.heart_type IS NULL OR NEW.heart_type NOT LIKE 'spend\_%' THEN
      RAISE EXCEPTION 'Only spend_* transactions may carry a negative amount';
    END IF;

    SELECT s33d_hearts INTO v_bal
    FROM public.user_heart_balances
    WHERE user_id = v_uid
    FOR UPDATE;

    IF COALESCE(v_bal, 0) < ABS(NEW.amount) THEN
      RAISE EXCEPTION 'Not enough Hearts for this offering (have %, need %)',
        COALESCE(v_bal, 0), ABS(NEW.amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_heart_transaction_authority ON public.heart_transactions;
CREATE TRIGGER trg_enforce_heart_transaction_authority
  BEFORE INSERT ON public.heart_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_heart_transaction_authority();

-- ─────────────────────────────────────────────────────────────
-- 4. HEART_LEDGER AUTHORITY TRIGGER (same rule book, ledger vocabulary)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_heart_ledger_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Only S33D currency is client-writable; SPECIES/INFLUENCE have their own tables.
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

DROP TRIGGER IF EXISTS trg_enforce_heart_ledger_authority ON public.heart_ledger;
CREATE TRIGGER trg_enforce_heart_ledger_authority
  BEFORE INSERT ON public.heart_ledger
  FOR EACH ROW EXECUTE FUNCTION public.enforce_heart_ledger_authority();

-- ─────────────────────────────────────────────────────────────
-- 5. SPECIES HEARTS / INFLUENCE TOKENS — bound client amounts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_fractal_token_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_species_hearts_authority ON public.species_heart_transactions;
CREATE TRIGGER trg_species_hearts_authority
  BEFORE INSERT ON public.species_heart_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_fractal_token_authority();

DROP TRIGGER IF EXISTS trg_influence_authority ON public.influence_transactions;
CREATE TRIGGER trg_influence_authority
  BEFORE INSERT ON public.influence_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_fractal_token_authority();

-- ─────────────────────────────────────────────────────────────
-- 6. INVITATION REDEMPTION AUTHORIZATION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consume_invitation(p_invite_code text, p_new_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link record;
  v_inviter record;
  v_staff_id text;
  v_norm text;
  v_uses integer;
  v_caller uuid := auth.uid();
BEGIN
  -- AUTHORIZATION: only the signed-in account may redeem an invitation,
  -- and only for itself. Anonymous callers are refused outright.
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  IF p_new_user_id IS NULL OR p_new_user_id <> v_caller THEN
    RETURN jsonb_build_object('error', 'not_your_account');
  END IF;

  v_norm := lower(btrim(coalesce(p_invite_code, '')));
  IF v_norm = '' THEN
    RETURN jsonb_build_object('error', 'malformed_invite');
  END IF;

  -- Idempotent: this user already redeemed this invitation.
  SELECT il.id, il.created_by INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm AND il.used_by_user_id = p_new_user_id
  LIMIT 1;
  IF v_link.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_consumed', true, 'inviter_id', v_link.created_by);
  END IF;

  -- A Wanderer may only ever be attributed to one inviter.
  IF EXISTS (SELECT 1 FROM public.profiles p
             WHERE p.id = p_new_user_id AND p.invited_by_user_id IS NOT NULL) THEN
    RETURN jsonb_build_object('error', 'already_attributed');
  END IF;

  SELECT il.id, il.created_by, il.max_uses INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm
    AND il.is_used = false
    AND il.revoked_at IS NULL
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses)
  LIMIT 1
  FOR UPDATE;

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_used_invite');
  END IF;

  -- Never allow self-invitation.
  IF v_link.created_by = p_new_user_id THEN
    RETURN jsonb_build_object('error', 'self_invite');
  END IF;

  SELECT invites_remaining, active_staff_id, lineage_staff_id
  INTO v_inviter
  FROM public.profiles
  WHERE id = v_link.created_by
  FOR UPDATE;

  IF v_inviter IS NULL OR v_inviter.invites_remaining <= 0 THEN
    RETURN jsonb_build_object('error', 'inviter_no_invites_remaining');
  END IF;

  v_staff_id := COALESCE(v_inviter.active_staff_id, v_inviter.lineage_staff_id);

  UPDATE public.profiles
  SET invites_remaining = invites_remaining - 1,
      invites_sent = invites_sent + 1,
      invites_accepted = invites_accepted + 1
  WHERE id = v_link.created_by;

  UPDATE public.profiles
  SET invited_by_user_id = v_link.created_by,
      lineage_staff_id = v_staff_id,
      invites_remaining = 144
  WHERE id = p_new_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, invited_by_user_id, lineage_staff_id, invites_remaining)
    VALUES (p_new_user_id, v_link.created_by, v_staff_id, 144)
    ON CONFLICT (id) DO UPDATE
    SET invited_by_user_id = EXCLUDED.invited_by_user_id,
        lineage_staff_id = EXCLUDED.lineage_staff_id,
        invites_remaining = 144;
  END IF;

  INSERT INTO public.referrals (inviter_id, invitee_id, invite_link_id)
  VALUES (v_link.created_by, p_new_user_id, v_link.id)
  ON CONFLICT DO NOTHING;

  SELECT GREATEST(COUNT(*), 1) INTO v_uses
  FROM public.referrals WHERE invite_link_id = v_link.id;

  UPDATE public.invite_links
  SET used_by_user_id = COALESCE(used_by_user_id, p_new_user_id),
      used_at = COALESCE(used_at, now()),
      uses_count = v_uses,
      is_used = (max_uses IS NULL OR v_uses >= max_uses)
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', v_link.created_by,
    'lineage_staff_id', v_staff_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.consume_invitation(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_invitation(text, uuid) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 7. WINDFALL + BUG AWARD RPC AUTHORIZATION
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
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR p_user_id IS NULL OR v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Windfalls may only be claimed for your own account';
  END IF;

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

  DELETE FROM heart_transactions WHERE id = v_pending_id;

  INSERT INTO heart_transactions (user_id, tree_id, heart_type, amount, created_at)
  VALUES (p_user_id, p_tree_id, 'windfall', v_amount, v_created_at);

  RETURN v_amount;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_windfall_hearts(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_windfall_hearts(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.award_bug_hearts(p_bug_id uuid, p_amount integer, p_curator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
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

  SELECT user_id INTO v_user_id FROM bug_reports WHERE id = p_bug_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Bug not found'; END IF;

  UPDATE bug_reports
  SET hearts_awarded_total = hearts_awarded_total + p_amount, reward_state = 'awarded'
  WHERE id = p_bug_id;

  INSERT INTO heart_transactions (user_id, heart_type, amount, tree_id)
  VALUES (v_user_id, 'bug_report', p_amount, NULL);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.award_bug_hearts(uuid, integer, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_bug_hearts(uuid, integer, uuid) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 8. COUNCIL CREATION — role gated
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth users can create councils" ON public.councils;
CREATE POLICY "Curators and keepers can create councils"
  ON public.councils FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper')
  );

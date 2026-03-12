
-- ============================================================
-- Heart Economy: Ledger, Claims, Wallet Links
-- ============================================================

-- 1. Rich heart_ledger for all economic activity
CREATE TABLE public.heart_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  currency_type TEXT NOT NULL DEFAULT 'S33D',
  source TEXT,
  destination TEXT,
  entity_type TEXT,
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'confirmed',
  chain_state TEXT NOT NULL DEFAULT 'offchain',
  chain_tx_hash TEXT,
  idempotency_key TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate transactions
CREATE UNIQUE INDEX idx_heart_ledger_idempotency ON public.heart_ledger (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_heart_ledger_user ON public.heart_ledger (user_id, created_at DESC);
CREATE INDEX idx_heart_ledger_type ON public.heart_ledger (transaction_type);
CREATE INDEX idx_heart_ledger_status ON public.heart_ledger (status);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_heart_ledger_entry()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.transaction_type NOT IN (
    'earn_tree_mapping', 'earn_checkin', 'earn_offering', 'earn_curation',
    'earn_council', 'earn_contribution', 'earn_referral', 'earn_bug_report',
    'earn_streak_bonus', 'earn_windfall', 'earn_patron_grant',
    'purchase_bundle', 'purchase_single',
    'spend_nftree_generation', 'spend_room_customisation', 'spend_skin_unlock',
    'spend_gift', 'spend_market_stake',
    'refund', 'admin_grant', 'admin_debit',
    'claim_reward', 'claim_founder',
    'lock_stake', 'unlock_stake',
    'mint_prepare', 'mint_confirmed',
    'bridge_to_chain', 'bridge_from_chain'
  ) THEN
    RAISE EXCEPTION 'Invalid transaction_type: %', NEW.transaction_type;
  END IF;
  IF NEW.currency_type NOT IN ('S33D', 'SPECIES', 'INFLUENCE') THEN
    RAISE EXCEPTION 'Invalid currency_type: %', NEW.currency_type;
  END IF;
  IF NEW.status NOT IN ('pending', 'confirmed', 'failed', 'reversed', 'locked') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.chain_state NOT IN ('offchain', 'claimable', 'claiming', 'onchain', 'bridging') THEN
    RAISE EXCEPTION 'Invalid chain_state: %', NEW.chain_state;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_heart_ledger
  BEFORE INSERT OR UPDATE ON public.heart_ledger
  FOR EACH ROW EXECUTE FUNCTION public.validate_heart_ledger_entry();

-- 2. Claims & entitlements
CREATE TABLE public.heart_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  source_ledger_id UUID REFERENCES public.heart_ledger(id),
  wallet_address TEXT,
  chain TEXT,
  chain_tx_hash TEXT,
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_heart_claims_user ON public.heart_claims (user_id, status);

CREATE OR REPLACE FUNCTION public.validate_heart_claim()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.claim_type NOT IN (
    'earned_reward', 'founder_benefit', 'patron_bonus',
    'staking_yield', 'nft_mint_eligibility', 'dao_voting_right',
    'campaign_reward', 'referral_bonus'
  ) THEN
    RAISE EXCEPTION 'Invalid claim_type: %', NEW.claim_type;
  END IF;
  IF NEW.status NOT IN ('available', 'pending_wallet', 'claiming', 'claimed', 'expired', 'revoked') THEN
    RAISE EXCEPTION 'Invalid claim status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_heart_claim
  BEFORE INSERT OR UPDATE ON public.heart_claims
  FOR EACH ROW EXECUTE FUNCTION public.validate_heart_claim();

-- 3. Optional wallet links
CREATE TABLE public.wallet_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  label TEXT,
  is_primary BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  nonce TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_wallet_links_address ON public.wallet_links (wallet_address, chain);
CREATE INDEX idx_wallet_links_user ON public.wallet_links (user_id);

-- 4. RLS
ALTER TABLE public.heart_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ledger" ON public.heart_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users read own claims" ON public.heart_claims
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users read own wallets" ON public.wallet_links
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users manage own wallets" ON public.wallet_links
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own wallets" ON public.wallet_links
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users delete own wallets" ON public.wallet_links
  FOR DELETE TO authenticated USING (user_id = auth.uid());

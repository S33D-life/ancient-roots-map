
-- ============================================================
-- CYCLE MARKETS — Phase 1 Schema
-- ============================================================

-- Market type enum
CREATE TYPE public.market_type AS ENUM ('binary', 'date_range', 'numeric');

-- Market scope enum
CREATE TYPE public.market_scope AS ENUM ('tree', 'grove', 'species', 'region');

-- Market status enum
CREATE TYPE public.market_status AS ENUM ('draft', 'open', 'closed', 'resolved', 'cancelled');

-- ============================================================
-- markets
-- ============================================================
CREATE TABLE public.markets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id       UUID NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  rules_text            TEXT,
  evidence_policy       TEXT,
  resolution_source     TEXT,
  market_type           public.market_type NOT NULL DEFAULT 'binary',
  scope                 public.market_scope NOT NULL DEFAULT 'grove',
  linked_tree_ids       UUID[] DEFAULT '{}',
  linked_hive_id        TEXT,          -- hive family slug
  status                public.market_status NOT NULL DEFAULT 'draft',
  open_time             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  close_time            TIMESTAMP WITH TIME ZONE NOT NULL,
  resolve_time          TIMESTAMP WITH TIME ZONE,
  winner_pool_percent   INTEGER NOT NULL DEFAULT 85,
  grove_fund_percent    INTEGER NOT NULL DEFAULT 10,
  research_pot_percent  INTEGER NOT NULL DEFAULT 5,
  creator_reward_cap    INTEGER NOT NULL DEFAULT 0,
  max_stake_per_user    INTEGER NOT NULL DEFAULT 50,   -- hearts per market
  daily_market_budget   INTEGER NOT NULL DEFAULT 100,  -- hearts per day across all markets
  is_demo               BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Markets are publicly readable" ON public.markets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create markets" ON public.markets
  FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Creators and curators can update markets" ON public.markets
  FOR UPDATE USING (
    auth.uid() = creator_user_id
    OR has_role(auth.uid(), 'curator'::app_role)
  );

-- ============================================================
-- market_outcomes — buckets / options per market
-- ============================================================
CREATE TABLE public.market_outcomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id    UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,        -- e.g. "Yes", "No", "Mar 1–7", "Above 50mm"
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_winning   BOOLEAN,              -- set at resolution
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Outcomes are publicly readable" ON public.market_outcomes
  FOR SELECT USING (true);

CREATE POLICY "Creators and curators can manage outcomes" ON public.market_outcomes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id
        AND (m.creator_user_id = auth.uid() OR has_role(auth.uid(), 'curator'::app_role))
    )
  );

-- ============================================================
-- market_stakes — user bets
-- ============================================================
CREATE TABLE public.market_stakes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id   UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  outcome_id  UUID NOT NULL REFERENCES public.market_outcomes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stakes are publicly readable (aggregate)" ON public.market_stakes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place stakes" ON public.market_stakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- market_resolutions
-- ============================================================
CREATE TABLE public.market_resolutions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id           UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  resolved_outcome_id UUID REFERENCES public.market_outcomes(id),
  resolver_id         UUID NOT NULL,
  evidence_refs       TEXT[] DEFAULT '{}',
  notes               TEXT,
  resolved_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resolutions are publicly readable" ON public.market_resolutions
  FOR SELECT USING (true);

CREATE POLICY "Curators can resolve markets" ON public.market_resolutions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'curator'::app_role));

-- ============================================================
-- market_funds_ledger — routing to grove/hive/research
-- ============================================================
CREATE TABLE public.market_funds_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id    UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  recipient    TEXT NOT NULL,        -- grove_id, hive_slug, 'research_pot'
  recipient_type TEXT NOT NULL,      -- 'grove', 'hive', 'research'
  amount       INTEGER NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_funds_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fund ledger is publicly readable" ON public.market_funds_ledger
  FOR SELECT USING (true);

CREATE POLICY "System inserts fund ledger entries" ON public.market_funds_ledger
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- user_market_profile — accuracy + stats per user
-- ============================================================
CREATE TABLE public.user_market_profile (
  user_id           UUID PRIMARY KEY,
  markets_entered   INTEGER NOT NULL DEFAULT 0,
  markets_won       INTEGER NOT NULL DEFAULT 0,
  total_staked      INTEGER NOT NULL DEFAULT 0,
  total_won         INTEGER NOT NULL DEFAULT 0,
  total_to_grove    INTEGER NOT NULL DEFAULT 0,
  accuracy_pct      NUMERIC(5,2),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_market_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.user_market_profile
  FOR SELECT USING (true);

CREATE POLICY "Users can upsert their own market profile" ON public.user_market_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own market profile" ON public.user_market_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: updated_at for markets
-- ============================================================
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

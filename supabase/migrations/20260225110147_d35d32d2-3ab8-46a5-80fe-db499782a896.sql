
-- Market seed stakes: users stake daily seeds on market outcomes
CREATE TABLE public.market_seed_stakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id),
  outcome_id UUID NOT NULL REFERENCES public.market_outcomes(id),
  seeds_count INTEGER NOT NULL DEFAULT 1,
  staked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hearts_earned INTEGER DEFAULT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Gift seeds: send seeds to friends (existing or via invite)
CREATE TABLE public.gift_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID DEFAULT NULL,
  invite_code TEXT DEFAULT NULL,
  seeds_count INTEGER NOT NULL DEFAULT 1,
  message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  hearts_earned INTEGER DEFAULT NULL
);

-- RLS for market_seed_stakes
ALTER TABLE public.market_seed_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can stake seeds" ON public.market_seed_stakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stakes" ON public.market_seed_stakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view aggregate stakes" ON public.market_seed_stakes
  FOR SELECT USING (true);

CREATE POLICY "System can update stakes on resolution" ON public.market_seed_stakes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS for gift_seeds
ALTER TABLE public.gift_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send gift seeds" ON public.gift_seeds
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view sent gifts" ON public.gift_seeds
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view received gifts" ON public.gift_seeds
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can activate gifts" ON public.gift_seeds
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Index for daily counting
CREATE INDEX idx_market_seed_stakes_user_date ON public.market_seed_stakes (user_id, staked_at);
CREATE INDEX idx_gift_seeds_sender_date ON public.gift_seeds (sender_id, created_at);
CREATE INDEX idx_gift_seeds_invite ON public.gift_seeds (invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_gift_seeds_recipient ON public.gift_seeds (recipient_id) WHERE recipient_id IS NOT NULL;


-- Species Heart Transactions: fractal currency per botanical family
CREATE TABLE public.species_heart_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id),
  species_family TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  action_type TEXT NOT NULL DEFAULT 'mapping',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.species_heart_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view species heart transactions"
  ON public.species_heart_transactions FOR SELECT USING (true);

CREATE POLICY "System inserts species hearts"
  ON public.species_heart_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_species_hearts_user ON public.species_heart_transactions(user_id);
CREATE INDEX idx_species_hearts_family ON public.species_heart_transactions(species_family);
CREATE INDEX idx_species_hearts_tree ON public.species_heart_transactions(tree_id);

-- Influence Transactions: soulbound governance tokens
CREATE TABLE public.influence_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID REFERENCES public.trees(id),
  species_family TEXT,
  scope TEXT NOT NULL DEFAULT 'global',
  amount INTEGER NOT NULL DEFAULT 1,
  action_type TEXT NOT NULL DEFAULT 'curation',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.influence_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view influence transactions"
  ON public.influence_transactions FOR SELECT USING (true);

CREATE POLICY "System inserts influence tokens"
  ON public.influence_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_influence_user ON public.influence_transactions(user_id);
CREATE INDEX idx_influence_family ON public.influence_transactions(species_family);
CREATE INDEX idx_influence_scope ON public.influence_transactions(scope);

-- Daily reward caps for anti-abuse
CREATE TABLE public.daily_reward_caps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tree_id UUID NOT NULL REFERENCES public.trees(id),
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_count INTEGER NOT NULL DEFAULT 0,
  last_checkin_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tree_id, reward_date)
);

ALTER TABLE public.daily_reward_caps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own caps"
  ON public.daily_reward_caps FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caps"
  ON public.daily_reward_caps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own caps"
  ON public.daily_reward_caps FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for species hearts (live dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE public.species_heart_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.influence_transactions;

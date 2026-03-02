
-- Council ↔ Market links (many-to-many)
CREATE TABLE IF NOT EXISTS public.council_market_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id UUID NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(council_id, market_id)
);

ALTER TABLE public.council_market_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read links
CREATE POLICY "council_market_links_select" ON public.council_market_links
  FOR SELECT USING (true);

-- Only authenticated users can create links
CREATE POLICY "council_market_links_insert" ON public.council_market_links
  FOR INSERT WITH CHECK (auth.uid() = linked_by);

-- Council participation rewards log
CREATE TABLE IF NOT EXISTS public.council_participation_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  council_id UUID NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  gathering_date DATE NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'participation',
  hearts_awarded INTEGER NOT NULL DEFAULT 0,
  influence_awarded INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, council_id, gathering_date, reward_type)
);

ALTER TABLE public.council_participation_rewards ENABLE ROW LEVEL SECURITY;

-- Users can read own rewards
CREATE POLICY "cpr_select_own" ON public.council_participation_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Curators can insert rewards
CREATE POLICY "cpr_insert_curator" ON public.council_participation_rewards
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'curator')
  );

-- Unified contribution model for all payment rails
CREATE TABLE public.value_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  rail TEXT NOT NULL DEFAULT 'stripe',
  rail_session_id TEXT,
  rail_subscription_id TEXT,
  amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'gbp',
  contribution_mode TEXT NOT NULL DEFAULT 'one_time',
  status TEXT NOT NULL DEFAULT 'pending',
  hearts_granted INTEGER NOT NULL DEFAULT 0,
  hearts_granted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_value_contributions_user ON public.value_contributions (user_id);
CREATE INDEX idx_value_contributions_rail_session ON public.value_contributions (rail_session_id);
CREATE INDEX idx_value_contributions_status ON public.value_contributions (status);
CREATE UNIQUE INDEX idx_value_contributions_idempotent ON public.value_contributions (rail, rail_session_id) WHERE rail_session_id IS NOT NULL;

-- RLS
ALTER TABLE public.value_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contributions"
ON public.value_contributions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contributions"
ON public.value_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role (edge functions) can do everything — no policy needed, they bypass RLS

-- Timestamp trigger
CREATE TRIGGER update_value_contributions_updated_at
BEFORE UPDATE ON public.value_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
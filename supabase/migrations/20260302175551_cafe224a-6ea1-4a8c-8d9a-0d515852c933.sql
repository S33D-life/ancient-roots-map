
-- Support signups for non-monetary contributions
CREATE TABLE public.support_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_type TEXT NOT NULL DEFAULT 'testing',
  name TEXT NOT NULL,
  email TEXT,
  telegram_handle TEXT,
  message TEXT,
  skills TEXT,
  availability TEXT,
  interests TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support signups"
  ON public.support_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Keepers can read support signups"
  ON public.support_signups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'));

-- Support events ledger for webhook-ready donation tracking
CREATE TABLE public.support_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'manual',
  event_type TEXT NOT NULL DEFAULT 'one_off',
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  user_id UUID,
  email TEXT,
  external_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Keepers can manage support events"
  ON public.support_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'));

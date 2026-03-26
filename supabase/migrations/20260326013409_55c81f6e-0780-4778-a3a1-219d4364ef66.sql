
-- Bot handoff tokens for Telegram/OpenClaw arrivals
CREATE TABLE public.bot_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'telegram',
  bot_name text,
  intent text,
  return_to text,
  invite_code text,
  gift_code text,
  campaign text,
  payload jsonb DEFAULT '{}'::jsonb,
  external_user_hash text,
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for token lookup
CREATE INDEX idx_bot_handoffs_token ON public.bot_handoffs (token);
CREATE INDEX idx_bot_handoffs_claimed_by ON public.bot_handoffs (claimed_by_user_id) WHERE claimed_by_user_id IS NOT NULL;

-- RLS
ALTER TABLE public.bot_handoffs ENABLE ROW LEVEL SECURITY;

-- Anyone can read by token (needed before auth)
CREATE POLICY "Anyone can read handoff by token"
  ON public.bot_handoffs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can claim (update)
CREATE POLICY "Authenticated users can claim handoffs"
  ON public.bot_handoffs FOR UPDATE
  TO authenticated
  USING (claimed_by_user_id IS NULL)
  WITH CHECK (claimed_by_user_id = auth.uid());

-- Service role / edge functions can insert
CREATE POLICY "Service role inserts handoffs"
  ON public.bot_handoffs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

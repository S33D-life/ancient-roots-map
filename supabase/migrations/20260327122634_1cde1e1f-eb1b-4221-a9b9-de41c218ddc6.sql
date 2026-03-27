
-- Telegram verification codes for bot-assisted account linking
CREATE TABLE public.telegram_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  action TEXT NOT NULL DEFAULT 'link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'claimed', 'expired'))
);

CREATE INDEX idx_tg_verify_code ON public.telegram_verification_codes (code) WHERE status = 'pending';
CREATE INDEX idx_tg_verify_user ON public.telegram_verification_codes (user_id);

ALTER TABLE public.telegram_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can see their own codes
CREATE POLICY "Users can view own verification codes"
  ON public.telegram_verification_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own codes
CREATE POLICY "Users can create verification codes"
  ON public.telegram_verification_codes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

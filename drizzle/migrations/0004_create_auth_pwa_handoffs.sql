CREATE TABLE IF NOT EXISTS public.auth_pwa_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes',
  bound_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bound_at timestamptz,
  ticket_token text,
  consumed_at timestamptz
);

-- No client role may touch this table; every access goes through the
-- auth-handoff edge function with service credentials.
ALTER TABLE public.auth_pwa_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_pwa_handoffs FROM anon, authenticated;
GRANT ALL ON public.auth_pwa_handoffs TO service_role;

CREATE INDEX IF NOT EXISTS auth_pwa_handoffs_expires_idx
  ON public.auth_pwa_handoffs (expires_at);
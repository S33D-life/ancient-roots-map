-- ─────────────────────────────────────────────────────────────────────
-- Council participation: server-sync hotfix
-- Replaces localStorage-only participation tracking with a durable
-- ledger entry. Idempotent. User-owned RLS.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_council_participation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  session_key     text NOT NULL,           -- cycle id from src/data/council/councilCycles.ts
  hearts_awarded  integer NOT NULL DEFAULT 0,
  ledger_entry_id uuid,                     -- FK-ish into heart_ledger
  source          text NOT NULL DEFAULT 'session_page',
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_council_participation_unique
    UNIQUE (user_id, session_key)
);

CREATE INDEX IF NOT EXISTS idx_ucp_user_session
  ON public.user_council_participation (user_id, session_key);

ALTER TABLE public.user_council_participation ENABLE ROW LEVEL SECURITY;

-- Read own rows only
DROP POLICY IF EXISTS "ucp_select_own" ON public.user_council_participation;
CREATE POLICY "ucp_select_own"
  ON public.user_council_participation
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct insert/update/delete from clients — claims go through the RPC.
-- (We deliberately omit INSERT/UPDATE/DELETE policies.)

-- ─────────────────────────────────────────────────────────────────────
-- RPC: claim_council_participation
-- Idempotent. Records participation and awards Hearts in a single
-- transaction. Returns structured JSON for clear UI states.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_council_participation(
  p_session_key text,
  p_hearts integer DEFAULT 11
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.user_council_participation%ROWTYPE;
  v_ledger_id uuid;
  v_hearts integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'unauthenticated',
      'message', 'Sign in to record your council presence.'
    );
  END IF;

  IF p_session_key IS NULL OR length(trim(p_session_key)) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'invalid_session',
      'message', 'No council session was provided.'
    );
  END IF;

  -- Clamp the heart amount to a safe range. Default 11.
  v_hearts := GREATEST(1, LEAST(COALESCE(p_hearts, 11), 100));

  -- Idempotency: if we already have a row for this user + session, return it.
  SELECT * INTO v_existing
    FROM public.user_council_participation
   WHERE user_id = v_user_id
     AND session_key = p_session_key
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'already_claimed',
      'message', 'Your presence is already recorded for this gathering.',
      'hearts_awarded', v_existing.hearts_awarded,
      'ledger_entry_id', v_existing.ledger_entry_id,
      'claimed_at', v_existing.created_at
    );
  END IF;

  -- Write the heart ledger entry first (source of truth for hearts).
  INSERT INTO public.heart_ledger (
    user_id,
    amount,
    transaction_type,
    currency_type,
    source,
    entity_type,
    entity_id,
    status,
    chain_state,
    idempotency_key,
    metadata
  ) VALUES (
    v_user_id,
    v_hearts,
    'earn_council',
    'S33D',
    'council_participation',
    'council_session',
    NULL,
    'confirmed',
    'council:' || p_session_key || ':' || v_user_id::text,
    jsonb_build_object('session_key', p_session_key)
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_ledger_id;

  -- If the ledger insert was a no-op due to idempotency, fetch the existing one.
  IF v_ledger_id IS NULL THEN
    SELECT id INTO v_ledger_id
      FROM public.heart_ledger
     WHERE idempotency_key = 'council:' || p_session_key || ':' || v_user_id::text
     LIMIT 1;
  END IF;

  -- Now record the participation. Unique constraint defends against races.
  INSERT INTO public.user_council_participation (
    user_id,
    session_key,
    hearts_awarded,
    ledger_entry_id,
    source
  ) VALUES (
    v_user_id,
    p_session_key,
    v_hearts,
    v_ledger_id,
    'session_page'
  )
  ON CONFLICT (user_id, session_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'claimed',
    'message', 'Presence recorded. Hearts will flow to you.',
    'hearts_awarded', v_hearts,
    'ledger_entry_id', v_ledger_id,
    'claimed_at', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'server_error',
    'message', SQLERRM
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_council_participation(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_council_participation(text, integer) TO authenticated;

-- ============================================================
-- 1. Extend bot_handoffs to match shared contract
-- ============================================================
ALTER TABLE public.bot_handoffs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS payload_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS flow_name text,
  ADD COLUMN IF NOT EXISTS step_key text,
  ADD COLUMN IF NOT EXISTS message_template_key text,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 2. Connected accounts table (Telegram linking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  provider_username text,
  display_name text,
  avatar_url text,
  provider_metadata jsonb DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  linked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connected accounts"
  ON public.connected_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own connected accounts"
  ON public.connected_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own connected accounts"
  ON public.connected_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own connected accounts"
  ON public.connected_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 3. resolve_bot_handoff RPC (pre-auth safe, anon callable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_bot_handoff(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row bot_handoffs%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_row
  FROM bot_handoffs
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  -- Check expiry
  IF v_row.expires_at < now() THEN
    UPDATE bot_handoffs SET status = 'expired', updated_at = now()
    WHERE id = v_row.id AND status != 'expired';
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  -- Check already claimed
  IF v_row.claimed_by_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  -- Check invalidated
  IF v_row.status = 'invalidated' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidated');
  END IF;

  -- Mark as opened
  UPDATE bot_handoffs
  SET status = CASE WHEN status = 'created' THEN 'opened' ELSE status END,
      last_opened_at = now(),
      open_count = open_count + 1,
      updated_at = now()
  WHERE id = v_row.id;

  v_result := jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'token', v_row.token,
    'source', v_row.source,
    'bot_name', v_row.bot_name,
    'intent', v_row.intent,
    'return_to', v_row.return_to,
    'invite_code', v_row.invite_code,
    'gift_code', v_row.gift_code,
    'campaign', v_row.campaign,
    'flow_name', v_row.flow_name,
    'step_key', v_row.step_key,
    'payload', v_row.payload,
    'status', 'opened'
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 4. claim_bot_handoff RPC (auth required)
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_bot_handoff(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row bot_handoffs%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row
  FROM bot_handoffs
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_row.expires_at < now() THEN
    UPDATE bot_handoffs SET status = 'expired', updated_at = now()
    WHERE id = v_row.id AND status != 'expired';
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF v_row.claimed_by_user_id IS NOT NULL THEN
    IF v_row.claimed_by_user_id = v_user_id THEN
      -- Idempotent: same user claiming again is fine
      RETURN jsonb_build_object('ok', true, 'already_yours', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  IF v_row.status = 'invalidated' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidated');
  END IF;

  UPDATE bot_handoffs
  SET claimed_by_user_id = v_user_id,
      claimed_at = now(),
      status = 'claimed',
      updated_at = now()
  WHERE id = v_row.id
    AND claimed_by_user_id IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'intent', v_row.intent,
    'return_to', v_row.return_to,
    'invite_code', v_row.invite_code,
    'gift_code', v_row.gift_code,
    'flow_name', v_row.flow_name,
    'step_key', v_row.step_key
  );
END;
$$;

-- Grant execute to anon (resolve) and authenticated (both)
GRANT EXECUTE ON FUNCTION public.resolve_bot_handoff(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_bot_handoff(text) TO authenticated;

-- ============================================================
-- 5. Tighten bot_handoffs RLS: remove overly permissive SELECT
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read handoff by token" ON public.bot_handoffs;
DROP POLICY IF EXISTS "Service role inserts handoffs" ON public.bot_handoffs;

-- Only allow service-role inserts (edge functions)
CREATE POLICY "Service role only inserts"
  ON public.bot_handoffs FOR INSERT
  TO service_role
  WITH CHECK (true);

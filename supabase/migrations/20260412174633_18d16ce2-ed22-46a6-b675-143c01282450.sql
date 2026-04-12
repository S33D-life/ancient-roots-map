CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Recreate the function to ensure gen_random_bytes resolves via extensions schema
CREATE OR REPLACE FUNCTION public.create_bot_handoff(
  p_source text,
  p_bot_name text,
  p_intent text DEFAULT NULL,
  p_external_user_hash text DEFAULT NULL,
  p_invite_code text DEFAULT NULL,
  p_gift_code text DEFAULT NULL,
  p_return_to text DEFAULT NULL,
  p_campaign text DEFAULT NULL,
  p_flow_name text DEFAULT NULL,
  p_payload jsonb DEFAULT NULL,
  p_expires_minutes int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token text;
  v_id uuid;
  v_expires_at timestamptz;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_expires_minutes || ' minutes')::interval;

  INSERT INTO public.bot_handoffs (
    token, source, bot_name, intent, external_user_hash,
    invite_code, gift_code, return_to, campaign, flow_name,
    payload, expires_at, status
  ) VALUES (
    v_token, p_source, p_bot_name, p_intent, p_external_user_hash,
    p_invite_code, p_gift_code, p_return_to, p_campaign, p_flow_name,
    p_payload, v_expires_at, 'created'
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'id', v_id,
    'expires_at', v_expires_at
  );
END;
$$;
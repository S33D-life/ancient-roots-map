-- Ordinary invite redemption must preserve a revoked membership tombstone.
CREATE OR REPLACE FUNCTION public.join_life_grove_with_token(p_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_grove uuid;
  v_uid uuid := auth.uid();
  v_revoked_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to accept this invitation';
  END IF;

  SELECT id INTO v_grove
  FROM public.life_groves
  WHERE invite_token = p_token
  FOR SHARE;

  IF v_grove IS NULL THEN
    RAISE EXCEPTION 'This invitation could not bloom';
  END IF;

  INSERT INTO public.life_grove_members (life_grove_id, user_id, joined_via)
  VALUES (v_grove, v_uid, 'invite_token')
  ON CONFLICT (life_grove_id, user_id) DO NOTHING;

  SELECT revoked_at INTO v_revoked_at
  FROM public.life_grove_members
  WHERE life_grove_id = v_grove AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND OR v_revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'This invitation could not bloom';
  END IF;

  RETURN v_grove;
END; $$;

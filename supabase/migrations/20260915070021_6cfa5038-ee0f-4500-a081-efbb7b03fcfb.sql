CREATE OR REPLACE FUNCTION public.consume_invitation(p_invite_code text, p_new_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_link record;
  v_inviter record;
  v_staff_id text;
  v_norm text;
  v_uses integer;
BEGIN
  v_norm := lower(btrim(coalesce(p_invite_code, '')));
  IF v_norm = '' THEN
    RETURN jsonb_build_object('error', 'malformed_invite');
  END IF;

  -- Idempotent: this user already redeemed this invitation (retry / repeat auth event).
  SELECT il.id, il.created_by INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm AND il.used_by_user_id = p_new_user_id
  LIMIT 1;
  IF v_link.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_consumed', true, 'inviter_id', v_link.created_by);
  END IF;

  SELECT il.id, il.created_by, il.max_uses INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm
    AND il.is_used = false
    AND il.revoked_at IS NULL
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses)
  LIMIT 1
  FOR UPDATE;

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_used_invite');
  END IF;

  SELECT invites_remaining, active_staff_id, lineage_staff_id
  INTO v_inviter
  FROM public.profiles
  WHERE id = v_link.created_by
  FOR UPDATE;

  IF v_inviter IS NULL OR v_inviter.invites_remaining <= 0 THEN
    RETURN jsonb_build_object('error', 'inviter_no_invites_remaining');
  END IF;

  v_staff_id := COALESCE(v_inviter.active_staff_id, v_inviter.lineage_staff_id);

  UPDATE public.profiles
  SET invites_remaining = invites_remaining - 1,
      invites_sent = invites_sent + 1,
      invites_accepted = invites_accepted + 1
  WHERE id = v_link.created_by;

  UPDATE public.profiles
  SET invited_by_user_id = v_link.created_by,
      lineage_staff_id = v_staff_id,
      invites_remaining = 144
  WHERE id = p_new_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, invited_by_user_id, lineage_staff_id, invites_remaining)
    VALUES (p_new_user_id, v_link.created_by, v_staff_id, 144)
    ON CONFLICT (id) DO UPDATE
    SET invited_by_user_id = EXCLUDED.invited_by_user_id,
        lineage_staff_id = EXCLUDED.lineage_staff_id,
        invites_remaining = 144;
  END IF;

  INSERT INTO public.referrals (inviter_id, invitee_id, invite_link_id)
  VALUES (v_link.created_by, p_new_user_id, v_link.id)
  ON CONFLICT DO NOTHING;

  -- Recompute uses from the referral record so the counter can never drift or
  -- be double-incremented by the referrals trigger.
  SELECT GREATEST(COUNT(*), 1) INTO v_uses
  FROM public.referrals WHERE invite_link_id = v_link.id;

  UPDATE public.invite_links
  SET used_by_user_id = COALESCE(used_by_user_id, p_new_user_id),
      used_at = COALESCE(used_at, now()),
      uses_count = v_uses,
      is_used = (max_uses IS NULL OR v_uses >= max_uses)
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', v_link.created_by,
    'lineage_staff_id', v_staff_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invitation(text, uuid) TO anon, authenticated, service_role;
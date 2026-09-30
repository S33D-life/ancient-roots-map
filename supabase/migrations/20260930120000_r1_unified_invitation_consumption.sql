-- R1 · Unified invitation consumption (30 Sep 2026)
--
-- One Wanderer-to-Wanderer relationship (public.referrals, mirrored on
-- profiles.invited_by_user_id / lineage_staff_id), written only by
-- public.consume_invitation. Existing rows are never modified or deleted here.
--
-- 1. consume_invitation (previous body: 20260915072446), three changes only:
--    a. an existing referrals row also counts as "already attributed", so the
--       canonical record and its profile mirror can never diverge;
--    b. an account created before the invitation link cannot accept it
--       ('account_predates_invitation'), so opening a shared link while
--       signed in never re-parents an established Wanderer;
--    c. the invitee's own invites_remaining is no longer reset to 144 when the
--       profile already exists (new profiles still start at the column
--       default of 144). Counters are never reset.
-- 2. record_referral_secure: no longer callable by clients. It wrote a
--    referral without lineage or allowance, ignored spent/revoked links and
--    carried its own 50-per-inviter cap (retired). Function kept for history.
-- 3. Gift Seeds are not invitations: activation no longer writes referrals.
--    Trigger removed; function and existing gift-created rows kept.
--
-- Rollback: re-apply the consume_invitation body from 20260915072446,
-- GRANT EXECUTE ON FUNCTION public.record_referral_secure(uuid, text) TO authenticated,
-- and recreate trigger trg_gift_seed_referral (20260225164013).

CREATE OR REPLACE FUNCTION public.consume_invitation(p_invite_code text, p_new_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link record;
  v_inviter record;
  v_staff_id text;
  v_norm text;
  v_uses integer;
  v_caller uuid := auth.uid();
BEGIN
  -- AUTHORIZATION: only the signed-in account may redeem an invitation,
  -- and only for itself. Anonymous callers are refused outright.
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  IF p_new_user_id IS NULL OR p_new_user_id <> v_caller THEN
    RETURN jsonb_build_object('error', 'not_your_account');
  END IF;

  v_norm := lower(btrim(coalesce(p_invite_code, '')));
  IF v_norm = '' THEN
    RETURN jsonb_build_object('error', 'malformed_invite');
  END IF;

  -- Idempotent: this user already redeemed this invitation.
  SELECT il.id, il.created_by INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm AND il.used_by_user_id = p_new_user_id
  LIMIT 1;
  IF v_link.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_consumed', true, 'inviter_id', v_link.created_by);
  END IF;

  -- A Wanderer may only ever be attributed to one inviter.
  -- referrals is the canonical relationship; the profile field mirrors it.
  -- Either one already naming an inviter means this Wanderer is attributed.
  IF EXISTS (SELECT 1 FROM public.profiles p
             WHERE p.id = p_new_user_id AND p.invited_by_user_id IS NOT NULL)
     OR EXISTS (SELECT 1 FROM public.referrals r WHERE r.invitee_id = p_new_user_id) THEN
    RETURN jsonb_build_object('error', 'already_attributed');
  END IF;

  SELECT il.id, il.created_by, il.max_uses, il.created_at INTO v_link
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

  -- Never allow self-invitation.
  IF v_link.created_by = p_new_user_id THEN
    RETURN jsonb_build_object('error', 'self_invite');
  END IF;

  -- An invitation opens the door for someone new. An account that already
  -- existed when the link was made is never re-parented onto it.
  IF EXISTS (SELECT 1 FROM auth.users u
             WHERE u.id = p_new_user_id AND u.created_at < v_link.created_at) THEN
    RETURN jsonb_build_object('error', 'account_predates_invitation');
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
      lineage_staff_id = v_staff_id
  WHERE id = p_new_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, invited_by_user_id, lineage_staff_id, invites_remaining)
    VALUES (p_new_user_id, v_link.created_by, v_staff_id, 144)
    ON CONFLICT (id) DO UPDATE
    SET invited_by_user_id = EXCLUDED.invited_by_user_id,
        lineage_staff_id = EXCLUDED.lineage_staff_id;
  END IF;

  INSERT INTO public.referrals (inviter_id, invitee_id, invite_link_id)
  VALUES (v_link.created_by, p_new_user_id, v_link.id)
  ON CONFLICT DO NOTHING;

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
$function$;

REVOKE EXECUTE ON FUNCTION public.consume_invitation(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_invitation(text, uuid) TO authenticated, service_role;


REVOKE EXECUTE ON FUNCTION public.record_referral_secure(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_referral_secure(uuid, text) TO service_role;

DROP TRIGGER IF EXISTS trg_gift_seed_referral ON public.gift_seeds;

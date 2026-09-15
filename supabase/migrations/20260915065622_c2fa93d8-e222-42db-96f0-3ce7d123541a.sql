ALTER TABLE public.invite_links ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

CREATE INDEX IF NOT EXISTS invite_links_code_lower_idx ON public.invite_links (lower(code));

-- Precise, anonymous-safe invitation status check (SECURITY DEFINER bypasses RLS,
-- exposing only a status string and expiry — never the row itself).
CREATE OR REPLACE FUNCTION public.check_invite_code(p_code text)
RETURNS TABLE(status text, invite_id uuid, expires_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v record;
  v_norm text;
  v_remaining integer;
BEGIN
  v_norm := lower(btrim(coalesce(p_code, '')));

  IF v_norm = '' THEN
    RETURN QUERY SELECT 'malformed'::text, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT il.* INTO v
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm
  LIMIT 1;

  IF v IS NULL THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  IF v.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT 'revoked'::text, v.id, v.expires_at;
    RETURN;
  END IF;

  IF v.expires_at IS NOT NULL AND v.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::text, v.id, v.expires_at;
    RETURN;
  END IF;

  IF v.is_used OR (v.max_uses IS NOT NULL AND v.uses_count >= v.max_uses) THEN
    RETURN QUERY SELECT 'used'::text, v.id, v.expires_at;
    RETURN;
  END IF;

  SELECT p.invites_remaining INTO v_remaining
  FROM public.profiles p WHERE p.id = v.created_by;

  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN QUERY SELECT 'inviter_exhausted'::text, v.id, v.expires_at;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'valid'::text, v.id, v.expires_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_invite_code(text) TO anon, authenticated, service_role;

-- Keep the legacy signature, but make it agree with consumption rules.
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE(id uuid, created_by uuid, expires_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT il.id, il.created_by, il.expires_at
  FROM public.invite_links il
  WHERE lower(il.code) = lower(btrim(coalesce(p_code, '')))
    AND il.is_used = false
    AND il.revoked_at IS NULL
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated, service_role;

-- Atomic redemption: lock the invite row for the duration of the transaction so
-- two concurrent signups cannot both claim a single-use invitation.
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
BEGIN
  v_norm := lower(btrim(coalesce(p_invite_code, '')));
  IF v_norm = '' THEN
    RETURN jsonb_build_object('error', 'malformed_invite');
  END IF;

  -- Already redeemed by this very user (retry / double auth event) → idempotent success.
  SELECT il.id, il.created_by INTO v_link
  FROM public.invite_links il
  WHERE lower(il.code) = v_norm AND il.used_by_user_id = p_new_user_id
  LIMIT 1;
  IF v_link.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_consumed', true, 'inviter_id', v_link.created_by);
  END IF;

  SELECT il.id, il.created_by INTO v_link
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

  -- Re-check under the lock, then claim.
  UPDATE public.invite_links
  SET is_used = true,
      used_by_user_id = p_new_user_id,
      used_at = now()
  WHERE id = v_link.id
    AND is_used = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_or_used_invite');
  END IF;

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

  -- The referrals insert trigger increments uses_count exactly once.
  INSERT INTO public.referrals (inviter_id, invitee_id, invite_link_id)
  VALUES (v_link.created_by, p_new_user_id, v_link.id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', v_link.created_by,
    'lineage_staff_id', v_staff_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invitation(text, uuid) TO anon, authenticated, service_role;
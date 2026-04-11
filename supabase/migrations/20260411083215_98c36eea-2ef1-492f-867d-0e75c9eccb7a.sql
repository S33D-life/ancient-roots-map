
-- Add invitation tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invites_remaining integer NOT NULL DEFAULT 144,
  ADD COLUMN IF NOT EXISTS invites_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invites_accepted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS lineage_staff_id text;

-- Add single-use tracking to invite_links
ALTER TABLE public.invite_links
  ADD COLUMN IF NOT EXISTS is_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_invite_links_code_unused
  ON public.invite_links (code) WHERE is_used = false;

-- Consume an invitation: validate, decrement, assign lineage
CREATE OR REPLACE FUNCTION public.consume_invitation(
  p_invite_code text,
  p_new_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_inviter record;
  v_staff_id text;
BEGIN
  -- 1. Find unused invite link
  SELECT id, created_by INTO v_link
  FROM public.invite_links
  WHERE code = p_invite_code
    AND is_used = false
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_link IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_used_invite');
  END IF;

  -- 2. Check inviter has remaining invitations
  SELECT invites_remaining, active_staff_id, lineage_staff_id
  INTO v_inviter
  FROM public.profiles
  WHERE id = v_link.created_by;

  IF v_inviter IS NULL OR v_inviter.invites_remaining <= 0 THEN
    RETURN jsonb_build_object('error', 'inviter_no_invites_remaining');
  END IF;

  -- 3. Resolve staff lineage: direct staff > inherited lineage
  v_staff_id := COALESCE(v_inviter.active_staff_id, v_inviter.lineage_staff_id);

  -- 4. Mark invite link as used
  UPDATE public.invite_links
  SET is_used = true,
      used_by_user_id = p_new_user_id,
      used_at = now(),
      uses_count = uses_count + 1
  WHERE id = v_link.id;

  -- 5. Decrement inviter counters
  UPDATE public.profiles
  SET invites_remaining = invites_remaining - 1,
      invites_sent = invites_sent + 1,
      invites_accepted = invites_accepted + 1
  WHERE id = v_link.created_by;

  -- 6. Set new user lineage (upsert in case profile already exists from trigger)
  UPDATE public.profiles
  SET invited_by_user_id = v_link.created_by,
      lineage_staff_id = v_staff_id,
      invites_remaining = 144
  WHERE id = p_new_user_id;

  -- If profile doesn't exist yet, insert minimal row
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, invited_by_user_id, lineage_staff_id, invites_remaining)
    VALUES (p_new_user_id, v_link.created_by, v_staff_id, 144)
    ON CONFLICT (id) DO UPDATE
    SET invited_by_user_id = EXCLUDED.invited_by_user_id,
        lineage_staff_id = EXCLUDED.lineage_staff_id,
        invites_remaining = 144;
  END IF;

  -- 7. Also record in referrals table for existing tracking
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

-- Backfill existing users with 144 invitations (only those still at default)
UPDATE public.profiles SET invites_remaining = 144 WHERE invites_remaining = 144;

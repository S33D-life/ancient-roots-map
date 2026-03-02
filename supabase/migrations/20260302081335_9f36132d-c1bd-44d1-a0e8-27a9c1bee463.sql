
-- 1. Remove the permissive INSERT policy that lets clients write directly
DROP POLICY IF EXISTS "Users can record their own referral" ON public.referrals;

-- 2. Secure RPC to record referrals with full server-side validation
CREATE OR REPLACE FUNCTION public.record_referral_secure(p_invitee_id uuid, p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_link_id uuid;
  v_inviter_id uuid;
  v_existing_count integer;
  v_inviter_referral_count integer;
BEGIN
  -- Validate caller is the invitee
  IF auth.uid() IS NULL OR auth.uid() != p_invitee_id THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Check if invitee already has a referrer (one referral per user, ever)
  SELECT COUNT(*) INTO v_existing_count
  FROM referrals WHERE invitee_id = p_invitee_id;
  
  IF v_existing_count > 0 THEN
    RETURN json_build_object('error', 'Already referred');
  END IF;

  -- Validate the invite code
  SELECT il.id, il.created_by INTO v_link_id, v_inviter_id
  FROM invite_links il
  WHERE il.code = p_invite_code
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses);

  IF v_link_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid or expired invite code');
  END IF;

  -- Prevent self-referral
  IF v_inviter_id = p_invitee_id THEN
    RETURN json_build_object('error', 'Cannot refer yourself');
  END IF;

  -- Cap referrals per inviter (max 50)
  SELECT COUNT(*) INTO v_inviter_referral_count
  FROM referrals WHERE inviter_id = v_inviter_id;
  
  IF v_inviter_referral_count >= 50 THEN
    RETURN json_build_object('error', 'Inviter referral limit reached');
  END IF;

  -- Insert referral (unique constraint handles race conditions)
  BEGIN
    INSERT INTO referrals (inviter_id, invitee_id, invite_link_id)
    VALUES (v_inviter_id, p_invitee_id, v_link_id);
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('error', 'Already referred');
  END;

  RETURN json_build_object('error', null);
END;
$$;

-- 3. Rate limit invite link creation: max 5 per day per user
CREATE OR REPLACE FUNCTION public.check_invite_link_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM invite_links
  WHERE created_by = NEW.created_by
    AND created_at::date = CURRENT_DATE;
  
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Daily invite link limit reached (max 5 per day)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_invite_rate ON public.invite_links;
CREATE TRIGGER check_invite_rate
BEFORE INSERT ON public.invite_links
FOR EACH ROW
EXECUTE FUNCTION public.check_invite_link_rate_limit();

-- 4. Add indexes for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_id ON public.referrals (invitee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON public.referrals (inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON public.invite_links (code);
CREATE INDEX IF NOT EXISTS idx_invite_links_created_by_date ON public.invite_links (created_by, created_at);

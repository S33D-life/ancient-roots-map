
-- Track referral relationships: who invited whom
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  invite_link_id uuid REFERENCES public.invite_links(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invitee_id) -- each user can only be referred once
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see referrals they made or received
CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- System inserts referrals (via invite link redemption)
CREATE POLICY "Users can record their own referral"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = invitee_id);

-- Increment uses_count on invite_links when a referral is created
CREATE OR REPLACE FUNCTION public.increment_invite_uses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_link_id IS NOT NULL THEN
    UPDATE invite_links SET uses_count = uses_count + 1 WHERE id = NEW.invite_link_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.increment_invite_uses();

-- Stacked on Grove audience/invitation correction. Review only, not applied live.
BEGIN;
CREATE TABLE public.founding_grove_invitations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), backer_reference text NOT NULL UNIQUE,
 email text NOT NULL, token_hash text NOT NULL UNIQUE,
 not_before timestamptz NOT NULL DEFAULT '2026-12-21T00:00:00Z', expires_at timestamptz NOT NULL,
 revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.founding_grove_entitlements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invitation_id uuid NOT NULL UNIQUE REFERENCES public.founding_grove_invitations(id),
 user_id uuid NOT NULL, life_grove_id uuid NOT NULL UNIQUE REFERENCES public.life_groves(id),
 activated_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 founding_recognised_at timestamptz NOT NULL,
 CHECK(ends_at>activated_at)
);
ALTER TABLE public.founding_grove_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_grove_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.founding_grove_invitations,public.founding_grove_entitlements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.founding_grove_entitlements TO authenticated;
CREATE POLICY "Backers read their entitlement" ON public.founding_grove_entitlements FOR SELECT TO authenticated USING(user_id=auth.uid());
-- Human-maintainer issuance only. No checkout, campaign import, or auto-invites.
CREATE FUNCTION public.issue_founding_grove_invitation(p_backer_reference text,p_email text,p_expires_at timestamptz)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE token text:=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
BEGIN
 IF p_email IS NULL OR position('@' IN p_email)<2 OR p_backer_reference IS NULL OR length(trim(p_backer_reference))=0 OR p_expires_at<='2026-12-21T00:00:00Z'::timestamptz THEN RAISE EXCEPTION 'Valid recipient, reference and expiry required'; END IF;
 INSERT INTO public.founding_grove_invitations(backer_reference,email,token_hash,expires_at)
 VALUES(p_backer_reference,lower(trim(p_email)),encode(sha256(convert_to(token,'UTF8')),'hex'),p_expires_at);
 RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.issue_founding_grove_invitation(text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_founding_grove_invitation(text,text,timestamptz) TO service_role;
CREATE FUNCTION public.activate_founding_grove(p_token text)
RETURNS public.founding_grove_entitlements LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); invitation public.founding_grove_invitations%ROWTYPE; result public.founding_grove_entitlements%ROWTYPE; g uuid;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to activate your Grove'; END IF;
 SELECT * INTO invitation FROM public.founding_grove_invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 IF invitation.id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u AND lower(email)=invitation.email AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Invitation unavailable for this account'; END IF;
 SELECT * INTO result FROM public.founding_grove_entitlements WHERE invitation_id=invitation.id;
 -- A redeemed link returns the same entitlement, even after link expiry/revocation;
 -- it cannot change ownership, Grove, start or end dates.
 IF result.id IS NOT NULL THEN
  IF result.user_id<>u THEN RAISE EXCEPTION 'Invitation already used'; END IF;
  RETURN result;
 END IF;
 IF invitation.revoked_at IS NOT NULL OR invitation.expires_at<=now() OR invitation.not_before>now() THEN RAISE EXCEPTION 'Invitation is not open for activation'; END IF;
 INSERT INTO public.life_groves(created_by,grove_title,privacy) VALUES(u,'My Founding Grove','private_family') RETURNING id INTO g;
 INSERT INTO public.founding_grove_entitlements(invitation_id,user_id,life_grove_id,activated_at,ends_at,founding_recognised_at)
 VALUES(invitation.id,u,g,now(),now()+interval '1 year',now()) RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.activate_founding_grove(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.activate_founding_grove(text) TO authenticated;
-- Export permission is owner-only, but ownership never overrides Only me.
CREATE FUNCTION public.export_life_grove_memories(p_grove_id uuid)
RETURNS TABLE(id uuid,offering_type text,title text,body_text text,contributor_name text,visibility text,created_at timestamptz,media_url text,media_type text,media_metadata jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.life_groves g WHERE g.id=p_grove_id AND g.created_by=auth.uid()) THEN RAISE EXCEPTION 'Grove owner required'; END IF;
 RETURN QUERY SELECT o.id,o.offering_type,o.title,o.body_text,o.contributor_name,o.visibility,o.created_at,o.media_url,o.media_type,o.media_metadata
 FROM public.life_grove_offerings o WHERE o.life_grove_id=p_grove_id AND public.can_view_life_grove_offering(o.id,auth.uid()) ORDER BY o.created_at,o.id;
END $$;
REVOKE ALL ON FUNCTION public.export_life_grove_memories(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_life_grove_memories(uuid) TO authenticated;
COMMIT;

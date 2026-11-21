-- Review-only migration. No production execution authorised.
BEGIN;
INSERT INTO storage.buckets(id,name,public) VALUES('offerings-private','offerings-private',false)
ON CONFLICT(id) DO UPDATE SET public=false;
DROP POLICY IF EXISTS "Owners can upload private offering media" ON storage.objects;
CREATE POLICY "Owners can upload private offering media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='offerings-private' AND split_part(name,'/',1)=auth.uid()::text
 AND public.is_grove_contributor(NULLIF(split_part(name,'/',2),'')::uuid,auth.uid()));

-- Keep capability tokens out of publicly selectable Grove rows. Existing links
-- are preserved privately but fail closed until a steward rotates with expiry.
CREATE TABLE public.life_grove_invite_secrets (
  life_grove_id uuid PRIMARY KEY REFERENCES public.life_groves(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
ALTER TABLE public.life_grove_invite_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.life_grove_invite_secrets FROM PUBLIC, anon, authenticated;
INSERT INTO public.life_grove_invite_secrets(life_grove_id,token,expires_at)
SELECT id,invite_token,now() FROM public.life_groves;
UPDATE public.life_groves SET invite_token='retired-' || id::text;

CREATE OR REPLACE FUNCTION public.can_view_life_grove_offering(_offering_id uuid,_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT (_user_id IS NOT DISTINCT FROM auth.uid() OR auth.role()='service_role') AND EXISTS(SELECT 1 FROM public.life_grove_offerings o JOIN public.life_groves g ON g.id=o.life_grove_id
 WHERE o.id=_offering_id AND o.hidden_at IS NULL AND (
   (g.privacy='public' AND o.visibility='public') OR
   (_user_id IS NOT NULL AND public.is_grove_contributor(g.id,_user_id) AND
     ((o.visibility='family_only') OR (o.contributor_user_id=_user_id)))
 ));
$$;
REVOKE ALL ON FUNCTION public.can_view_life_grove_offering(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_view_life_grove_offering(uuid,uuid) TO authenticated,service_role;
DROP POLICY IF EXISTS "Read offerings based on grove privacy" ON public.life_grove_offerings;
DROP POLICY IF EXISTS "Grove people read offerings of their grove" ON public.life_grove_offerings;
CREATE POLICY "Exact memory audience" ON public.life_grove_offerings FOR SELECT
USING (public.can_view_life_grove_offering(id,auth.uid()));
-- Anonymous public text needs the same helper, with a null subject only.
GRANT EXECUTE ON FUNCTION public.can_view_life_grove_offering(uuid,uuid) TO anon;
DROP POLICY IF EXISTS "Anyone can leave an offering" ON public.life_grove_offerings;
DROP POLICY IF EXISTS "Contributors can hang an offering" ON public.life_grove_offerings;
CREATE POLICY "Active members create attributed memories" ON public.life_grove_offerings FOR INSERT TO authenticated
WITH CHECK (contributor_user_id=auth.uid() AND public.is_grove_contributor(life_grove_id,auth.uid())
 AND visibility IN ('private','family_only','public')
 AND (visibility<>'public' OR EXISTS(SELECT 1 FROM public.life_groves g WHERE g.id=life_grove_id AND g.privacy='public')));
DROP POLICY IF EXISTS "Authors edit their own offering" ON public.life_grove_offerings;
CREATE POLICY "Active authors edit their memories" ON public.life_grove_offerings FOR UPDATE TO authenticated
USING(contributor_user_id=auth.uid() AND public.is_grove_contributor(life_grove_id,auth.uid()))
WITH CHECK(contributor_user_id=auth.uid() AND public.is_grove_contributor(life_grove_id,auth.uid()));

-- A stored private object belongs to exactly one memory. Existing invalid media
-- references remain unmodified, but cannot be signed. No retrospective publicity.
CREATE OR REPLACE FUNCTION public.grove_memory_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW.life_grove_id IS DISTINCT FROM OLD.life_grove_id OR NEW.contributor_user_id IS DISTINCT FROM OLD.contributor_user_id) THEN
  RAISE EXCEPTION 'Memory ownership and Grove cannot be reassigned';
 END IF;
 IF NEW.visibility NOT IN ('private','family_only','public') THEN RAISE EXCEPTION 'Choose an explicit memory audience'; END IF;
 IF NEW.visibility='public' AND NOT EXISTS(SELECT 1 FROM public.life_groves WHERE id=NEW.life_grove_id AND privacy='public') THEN RAISE EXCEPTION 'This Grove is private'; END IF;
 -- No new public-media references, including a later visibility switch.
 IF NEW.media_url IS NOT NULL AND (TG_OP='INSERT' OR NEW.media_url IS DISTINCT FROM OLD.media_url) AND
    position('/offerings-private/' || NEW.contributor_user_id::text || '/' || NEW.life_grove_id::text || '/' IN NEW.media_url)=0 THEN
  RAISE EXCEPTION 'Grove media must use its private, author-owned object';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grove_memory_guard BEFORE INSERT OR UPDATE ON public.life_grove_offerings FOR EACH ROW EXECUTE FUNCTION public.grove_memory_guard();

CREATE OR REPLACE FUNCTION public.join_life_grove_with_token(p_token text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g uuid; u uuid:=auth.uid();
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to accept'; END IF;
 SELECT s.life_grove_id INTO g FROM public.life_grove_invite_secrets s WHERE s.token=p_token;
 IF g IS NULL THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 PERFORM 1 FROM public.life_groves WHERE id=g FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.life_grove_invite_secrets WHERE life_grove_id=g AND token=p_token AND revoked_at IS NULL AND expires_at>now()) THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.life_grove_members WHERE life_grove_id=g AND user_id=u AND revoked_at IS NOT NULL) THEN RAISE EXCEPTION 'Ask a steward to reinvite you'; END IF;
 INSERT INTO public.life_grove_members(life_grove_id,user_id,joined_via) VALUES(g,u,'invite_token') ON CONFLICT(life_grove_id,user_id) DO NOTHING;
 RETURN g;
END $$;
CREATE OR REPLACE FUNCTION public.manage_grove_invitation(p_grove_id uuid,p_rotate boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t text;
BEGIN
 PERFORM 1 FROM public.life_groves WHERE id=p_grove_id FOR UPDATE;
 IF NOT public.is_grove_steward(p_grove_id,auth.uid()) THEN RAISE EXCEPTION 'Steward required'; END IF;
 IF p_rotate THEN
  t:=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  INSERT INTO public.life_grove_invite_secrets VALUES(p_grove_id,t,now()+interval '7 days',NULL)
  ON CONFLICT(life_grove_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at,revoked_at=NULL;
 ELSE UPDATE public.life_grove_invite_secrets SET revoked_at=now() WHERE life_grove_id=p_grove_id; END IF;
 RETURN t;
END $$;
CREATE OR REPLACE FUNCTION public.set_grove_member_access(p_grove_id uuid,p_user_id uuid,p_reinvite boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM public.life_groves WHERE id=p_grove_id FOR UPDATE;
 IF NOT public.is_grove_steward(p_grove_id,auth.uid()) OR EXISTS(SELECT 1 FROM public.life_groves WHERE id=p_grove_id AND created_by=p_user_id) THEN RAISE EXCEPTION 'Steward required; owner cannot be removed'; END IF;
 INSERT INTO public.life_grove_members(life_grove_id,user_id,revoked_at,joined_via) VALUES(p_grove_id,p_user_id,CASE WHEN p_reinvite THEN NULL ELSE now() END,'steward')
 ON CONFLICT(life_grove_id,user_id) DO UPDATE SET revoked_at=excluded.revoked_at;
 IF NOT p_reinvite THEN UPDATE public.life_grove_stewards SET revoked_at=now(),revoked_by=auth.uid() WHERE life_grove_id=p_grove_id AND user_id=p_user_id AND revoked_at IS NULL; END IF;
END $$;
-- Direct membership updates would bypass the shared Grove lock.
DROP POLICY IF EXISTS "Stewards can update grove membership" ON public.life_grove_members;
DROP POLICY IF EXISTS "Stewards can insert grove membership" ON public.life_grove_members;
REVOKE INSERT,UPDATE,DELETE ON public.life_grove_members FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_life_grove_by_invite_token(p_token text)
RETURNS TABLE(id uuid,grove_type text,grove_title text,remembered_or_celebrated_name text,tree_archetype_species text,tree_name text,story_intro text,privacy text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT g.id,g.grove_type,g.grove_title,g.remembered_or_celebrated_name,g.tree_archetype_species,g.tree_name,g.story_intro,g.privacy
 FROM public.life_groves g JOIN public.life_grove_invite_secrets s ON s.life_grove_id=g.id
 WHERE s.token=p_token AND public.is_grove_contributor(g.id,auth.uid()) LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.list_my_life_groves() RETURNS SETOF public.life_groves
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT g.* FROM public.life_groves g WHERE public.is_grove_contributor(g.id,auth.uid()) ORDER BY g.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.join_life_grove_with_token(text), public.get_life_grove_by_invite_token(text), public.manage_grove_invitation(uuid,boolean), public.set_grove_member_access(uuid,uuid,boolean),public.list_my_life_groves() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.join_life_grove_with_token(text), public.get_life_grove_by_invite_token(text),public.manage_grove_invitation(uuid,boolean),public.set_grove_member_access(uuid,uuid,boolean),public.list_my_life_groves() TO authenticated;
CREATE OR REPLACE FUNCTION public.private_grove_media_path(p_offering_id uuid,p_user_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT obj.name FROM public.life_grove_offerings o JOIN storage.objects obj
 ON obj.bucket_id='offerings-private'
 AND o.media_url LIKE '%/offerings-private/' || obj.name
 WHERE o.id=p_offering_id AND public.can_view_life_grove_offering(o.id,p_user_id)
 AND split_part(obj.name,'/',1)=o.contributor_user_id::text
 AND split_part(obj.name,'/',2)=o.life_grove_id::text
 AND COALESCE(to_jsonb(obj)->>'owner_id',to_jsonb(obj)->>'owner')=o.contributor_user_id::text
 AND (SELECT count(*) FROM public.life_grove_offerings other WHERE other.media_url=o.media_url)=1;
$$;
REVOKE ALL ON FUNCTION public.private_grove_media_path(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.private_grove_media_path(uuid,uuid) TO service_role;

-- Disable broad direct downloads. Unsaved uploads may be previewed by their
-- uploader; attached objects must pass the exact memory audience.
DROP POLICY IF EXISTS "Signed-in members can read private offering media" ON storage.objects;
DROP POLICY IF EXISTS "Owners can read their private offering media" ON storage.objects;
CREATE POLICY "Grove object audience" ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='offerings-private' AND EXISTS(
 SELECT 1 FROM public.life_grove_offerings o WHERE
 split_part(storage.objects.name,'/',1)=o.contributor_user_id::text
 AND split_part(storage.objects.name,'/',2)=o.life_grove_id::text
 AND COALESCE(to_jsonb(objects)->>'owner_id',to_jsonb(objects)->>'owner')=o.contributor_user_id::text
 AND o.media_url LIKE '%/offerings-private/' || storage.objects.name
 AND public.can_view_life_grove_offering(o.id,auth.uid())
));
CREATE OR REPLACE FUNCTION public.get_life_grove_offering_identities(p_grove_id uuid)
RETURNS TABLE(user_id uuid,display_name text,avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT DISTINCT pr.id,COALESCE(NULLIF(pr.full_name,''),'A Wanderer'),pr.avatar_url
 FROM public.life_grove_offerings o JOIN public.profiles pr ON pr.id=o.contributor_user_id
 WHERE o.life_grove_id=p_grove_id AND public.can_view_life_grove_offering(o.id,auth.uid());
$$;
COMMIT;

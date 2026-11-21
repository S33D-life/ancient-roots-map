-- Review-only. Independent of Grove migrations.
BEGIN;
-- Self-issued keys may read public data only. Existing privileged/foreign keys
-- are revoked, not deleted; maintainers review before trusted reissuance.
UPDATE public.agent_tokens t SET revoked=true WHERE
 t.scopes IS DISTINCT FROM ARRAY['read:public']::text[] OR t.agent_id IS NULL OR
 NOT EXISTS(SELECT 1 FROM public.agent_profiles p WHERE p.id=t.agent_id AND p.owner_user_id=t.user_id);
DROP POLICY IF EXISTS "Owners can create agent tokens" ON public.agent_tokens;
DROP POLICY IF EXISTS "Users can create own tokens" ON public.agent_tokens;
CREATE POLICY "Owned public-read agent keys only" ON public.agent_tokens FOR INSERT TO authenticated
WITH CHECK(user_id=auth.uid() AND scopes=ARRAY['read:public']::text[] AND revoked=false
 AND EXISTS(SELECT 1 FROM public.agent_profiles p WHERE p.id=agent_id AND p.owner_user_id=auth.uid()));
DROP POLICY IF EXISTS "Users can revoke own tokens" ON public.agent_tokens;
CREATE POLICY "Owners revoke keys only" ON public.agent_tokens FOR UPDATE TO authenticated
USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND revoked=true);
REVOKE UPDATE ON public.agent_tokens FROM authenticated;
GRANT UPDATE(revoked) ON public.agent_tokens TO authenticated;
-- Votes and budgets may only mutate through authenticated, atomic RPCs.
REVOKE INSERT,UPDATE,DELETE ON public.influence_votes,public.influence_vote_budgets FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.cast_influence_vote(p_offering_id uuid,p_user_id uuid,p_scope_type text,p_scope_key text,p_weight numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); spent_now numeric; vote uuid;
BEGIN
 IF u IS NULL OR p_user_id IS DISTINCT FROM u THEN RAISE EXCEPTION 'Authenticated voter required'; END IF;
 IF p_scope_type IS NULL OR p_scope_type NOT IN ('tree','species','place') OR p_scope_key IS NULL OR length(p_scope_key)>200 OR p_weight IS NULL OR p_weight<=0 OR p_weight>10 THEN RAISE EXCEPTION 'Invalid vote'; END IF;
 -- First insert creates the same per-user/day lock for concurrent first votes.
 INSERT INTO public.influence_vote_budgets(user_id,vote_date,spent) VALUES(u,CURRENT_DATE,0) ON CONFLICT(user_id,vote_date) DO NOTHING;
 SELECT spent INTO spent_now FROM public.influence_vote_budgets WHERE user_id=u AND vote_date=CURRENT_DATE FOR UPDATE;
 IF spent_now>=50 THEN RAISE EXCEPTION 'Daily influence budget exhausted'; END IF;
 IF EXISTS(SELECT 1 FROM public.influence_votes WHERE offering_id=p_offering_id AND user_id=u AND scope_key=p_scope_key AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Already voted in this scope'; END IF;
 INSERT INTO public.influence_votes(offering_id,user_id,scope_type,scope_key,weight_applied)
 VALUES(p_offering_id,u,p_scope_type,p_scope_key,LEAST(p_weight,50-spent_now)) RETURNING id INTO vote;
 UPDATE public.influence_vote_budgets SET spent=spent_now+LEAST(p_weight,50-spent_now) WHERE user_id=u AND vote_date=CURRENT_DATE;
 RETURN vote;
END $$;
CREATE OR REPLACE FUNCTION public.retract_influence_vote(p_vote_id uuid,p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); vote public.influence_votes%ROWTYPE;
BEGIN
 IF u IS NULL OR p_user_id IS DISTINCT FROM u THEN RAISE EXCEPTION 'Authenticated voter required'; END IF;
 -- Same budget-before-vote lock order as casting; refund the original day only.
 PERFORM 1 FROM public.influence_vote_budgets b WHERE b.user_id=u AND b.vote_date=(SELECT v.created_at::date FROM public.influence_votes v WHERE v.id=p_vote_id AND v.user_id=u) FOR UPDATE;
 SELECT * INTO vote FROM public.influence_votes WHERE id=p_vote_id AND user_id=u FOR UPDATE;
 IF vote.id IS NULL THEN RAISE EXCEPTION 'Vote unavailable'; END IF;
 IF vote.revoked_at IS NOT NULL THEN RETURN; END IF;
 UPDATE public.influence_votes SET revoked_at=now() WHERE id=vote.id;
 UPDATE public.influence_vote_budgets SET spent=GREATEST(0,spent-vote.weight_applied) WHERE user_id=u AND vote_date=vote.created_at::date;
END $$;
REVOKE ALL ON FUNCTION public.cast_influence_vote(uuid,uuid,text,text,numeric),public.retract_influence_vote(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_influence_vote(uuid,uuid,text,text,numeric),public.retract_influence_vote(uuid,uuid) TO authenticated;
COMMIT;

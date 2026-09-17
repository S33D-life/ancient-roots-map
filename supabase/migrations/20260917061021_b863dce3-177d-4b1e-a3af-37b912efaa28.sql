ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.agent_tokens
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_agent_profiles_owner_user_id
  ON public.agent_profiles(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_agent_id
  ON public.agent_tokens(agent_id);

DROP POLICY IF EXISTS "Auth insert agent_profiles" ON public.agent_profiles;
CREATE POLICY "Owners can register agent profiles"
  ON public.agent_profiles FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own tokens" ON public.agent_tokens;
CREATE POLICY "Owners can create agent tokens"
  ON public.agent_tokens FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND agent_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.agent_profiles profile
      WHERE profile.id = agent_id
        AND profile.owner_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.owns_agent(_agent_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_profiles
    WHERE id = _agent_id
      AND owner_user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.owns_agent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_agent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_agent(uuid) TO service_role;
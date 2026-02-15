
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read invite links by code" ON public.invite_links;

-- Create secure RPC to validate invite codes without exposing the table
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE(id uuid, created_by uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT il.id, il.created_by
  FROM public.invite_links il
  WHERE il.code = p_code
    AND (il.expires_at IS NULL OR il.expires_at > now())
    AND (il.max_uses IS NULL OR il.uses_count < il.max_uses)
  LIMIT 1;
$$;

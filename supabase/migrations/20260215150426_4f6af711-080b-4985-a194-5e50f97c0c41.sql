
-- 1. Tighten profiles SELECT to owner-only (sensitive fields like wallet_address, social handles, home_place protected)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Owner can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Safe RPC for looking up other users by ID (returns only non-sensitive columns)
CREATE OR REPLACE FUNCTION public.get_safe_profiles(p_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text, is_discoverable boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.bio, p.is_discoverable
  FROM public.profiles p
  WHERE p.id = ANY(p_ids)
    AND (p.is_discoverable = true OR p.id = auth.uid());
$$;

-- 3. Safe RPC for browsing discoverable profiles (with optional search)
CREATE OR REPLACE FUNCTION public.search_discoverable_profiles(search_query text DEFAULT '', result_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.bio
  FROM public.profiles p
  WHERE p.is_discoverable = true
    AND (search_query = '' OR p.full_name ILIKE '%' || search_query || '%')
  ORDER BY p.full_name
  LIMIT result_limit;
$$;

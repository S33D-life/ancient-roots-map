-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view discoverable profiles" ON public.profiles;

-- Deny anonymous access to profiles (restrictive)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles AS RESTRICTIVE FOR SELECT
TO anon
USING (false);

-- Authenticated users can view their own profile or discoverable profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR (is_discoverable = true));
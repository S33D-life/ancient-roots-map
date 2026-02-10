-- Fix profiles SELECT policy: restore authenticated user access for chat/leaderboard/social features
-- Email was already removed from profiles table, only full_name and avatar_url remain (public display fields)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
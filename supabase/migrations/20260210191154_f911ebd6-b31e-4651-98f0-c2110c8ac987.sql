
-- Restrict profiles SELECT to own profile only
DROP POLICY "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

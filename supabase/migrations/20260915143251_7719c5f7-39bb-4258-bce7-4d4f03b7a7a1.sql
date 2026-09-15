DROP POLICY IF EXISTS "Owners can insert their own groves" ON public.life_groves;
CREATE POLICY "Owners can insert their own groves"
ON public.life_groves
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);
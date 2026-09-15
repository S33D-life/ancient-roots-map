DROP POLICY IF EXISTS "Owners can insert their own groves" ON public.life_groves;
CREATE POLICY "Owners can insert their own groves"
ON public.life_groves
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Grove visible to public, members and stewards" ON public.life_groves;
CREATE POLICY "Grove visible to public, members and stewards"
ON public.life_groves
FOR SELECT
USING (
  privacy = 'public'
  OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
  OR public.is_grove_contributor(id, auth.uid())
);
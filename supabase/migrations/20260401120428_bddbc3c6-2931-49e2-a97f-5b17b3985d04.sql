DROP POLICY IF EXISTS "Curators can moderate seed life entries" ON public.seed_life_entries;
CREATE POLICY "Curators can moderate seed life entries"
ON public.seed_life_entries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Curators can moderate guardians" ON public.seed_life_guardians;
CREATE POLICY "Curators can moderate guardians"
ON public.seed_life_guardians
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Curators can moderate seed notes" ON public.seed_life_notes;
CREATE POLICY "Curators can moderate seed notes"
ON public.seed_life_notes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));
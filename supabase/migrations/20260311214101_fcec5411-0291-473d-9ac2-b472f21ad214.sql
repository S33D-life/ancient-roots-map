-- Fix offerings RLS: enforce visibility at database level
DROP POLICY IF EXISTS "Offerings are viewable by everyone" ON public.offerings;

CREATE POLICY "Offerings select by visibility"
ON public.offerings FOR SELECT
USING (
  visibility = 'public'
  OR (visibility = 'tribe' AND auth.uid() IS NOT NULL)
  OR (visibility IN ('private', 'circle') AND auth.uid() = created_by)
);
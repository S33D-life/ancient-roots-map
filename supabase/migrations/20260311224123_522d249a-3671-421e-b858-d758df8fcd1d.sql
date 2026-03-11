
-- Drop both policies to ensure clean state
DROP POLICY IF EXISTS "Offerings are viewable by everyone" ON public.offerings;
DROP POLICY IF EXISTS "Offerings select by visibility" ON public.offerings;

-- Recreate with correct visibility enforcement
CREATE POLICY "Offerings select by visibility"
ON public.offerings FOR SELECT
USING (
  visibility = 'public'
  OR (visibility = 'tribe' AND auth.uid() IS NOT NULL)
  OR (visibility IN ('private', 'circle') AND auth.uid() = created_by)
);


-- Fix: life_grove_offerings — require auth + grove relationship for inserts,
-- and remove publicly readable contributor_email column.

-- 1. Drop the email column (privacy: emails must not be publicly readable).
ALTER TABLE public.life_grove_offerings DROP COLUMN IF EXISTS contributor_email;

-- 2. Replace permissive anonymous INSERT policy with an authenticated,
-- grove-scoped one. Caller must be signed in, must set contributor_user_id
-- to themselves, and the target grove must be public OR owned by them.
DROP POLICY IF EXISTS "Anyone can leave an offering" ON public.life_grove_offerings;

CREATE POLICY "Authenticated users can leave an offering on accessible grove"
ON public.life_grove_offerings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND contributor_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.life_groves g
    WHERE g.id = life_grove_offerings.life_grove_id
      AND (g.privacy = 'public' OR g.created_by = auth.uid())
  )
);

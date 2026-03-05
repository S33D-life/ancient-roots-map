-- Harden ownership rules for user-submitted trees and offerings.
-- Goal: only the creator can mutate their own records.

ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

-- Trees policies
DROP POLICY IF EXISTS "Trees are viewable by everyone" ON public.trees;
DROP POLICY IF EXISTS "Authenticated users can create trees" ON public.trees;
DROP POLICY IF EXISTS "Users can update their own trees" ON public.trees;
DROP POLICY IF EXISTS "Users can delete their own trees" ON public.trees;

CREATE POLICY "Trees are viewable by everyone"
ON public.trees
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create trees"
ON public.trees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own trees"
ON public.trees
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own trees"
ON public.trees
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Offerings policies
DROP POLICY IF EXISTS "Offerings are viewable by everyone" ON public.offerings;
DROP POLICY IF EXISTS "Authenticated users can create offerings" ON public.offerings;
DROP POLICY IF EXISTS "Users can update their own offerings" ON public.offerings;
DROP POLICY IF EXISTS "Users can delete their own offerings" ON public.offerings;

CREATE POLICY "Offerings are viewable by everyone"
ON public.offerings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create offerings"
ON public.offerings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own offerings"
ON public.offerings
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own offerings"
ON public.offerings
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

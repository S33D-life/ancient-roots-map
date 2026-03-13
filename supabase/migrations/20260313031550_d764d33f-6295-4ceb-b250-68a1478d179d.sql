-- Fix Council voting: allow all authenticated users to read vote totals
DROP POLICY IF EXISTS "Users can view their own votes" ON public.digital_fire_votes;

CREATE POLICY "Anyone can view all votes"
ON public.digital_fire_votes
FOR SELECT
TO authenticated
USING (true);
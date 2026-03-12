-- Fix influence_votes: restrict to authenticated (species was already fixed)
DROP POLICY IF EXISTS "Anyone can view influence votes" ON public.influence_votes;
CREATE POLICY "Authenticated users can view influence votes"
  ON public.influence_votes
  FOR SELECT
  TO authenticated
  USING (true);
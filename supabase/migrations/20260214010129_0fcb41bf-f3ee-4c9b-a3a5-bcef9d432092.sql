
-- Drop the overly permissive public SELECT policy
DROP POLICY "Users can view all votes" ON public.digital_fire_votes;

-- Replace with user-scoped SELECT policy
CREATE POLICY "Users can view their own votes"
  ON public.digital_fire_votes
  FOR SELECT
  USING (auth.uid() = user_id);

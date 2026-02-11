
-- Drop the overly permissive SELECT policy
DROP POLICY "Anyone authenticated can view follows" ON public.follows;

-- Create a restrictive policy: only follower or followed user can see the relationship
CREATE POLICY "Users can view their own follow relationships"
  ON public.follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

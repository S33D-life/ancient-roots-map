
DROP POLICY "Anyone authenticated can submit proposals" ON public.partnership_proposals;
CREATE POLICY "Users can submit own proposals"
  ON public.partnership_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

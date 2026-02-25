-- CRITICAL FIX: Add INSERT policy for heart_transactions so rewards actually work
CREATE POLICY "Authenticated users can insert heart transactions"
  ON public.heart_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
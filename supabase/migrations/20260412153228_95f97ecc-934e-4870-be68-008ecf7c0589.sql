-- Allow authenticated users to insert their own heart_ledger entries
CREATE POLICY "Users can insert own ledger entries"
ON public.heart_ledger
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own entries (for status changes like pending → confirmed)
CREATE POLICY "Users can update own ledger entries"
ON public.heart_ledger
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Allow authors to delete their own offerings
CREATE POLICY "Authors can delete their own offerings"
ON public.offerings
FOR DELETE
USING (auth.uid() = created_by);

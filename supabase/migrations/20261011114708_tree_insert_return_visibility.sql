BEGIN;

-- INSERT ... RETURNING checks SELECT visibility before a STABLE lookup of the
-- table can see its new row. Evaluate public/owner visibility on the row itself;
-- retain the existing helper for curator and explicit-grantee reads.
-- No INSERT/UPDATE permissions, attribution, records or grants are changed.
ALTER POLICY "Trees are viewable by everyone" ON public.trees
  TO anon, authenticated
  USING (
    accessibility_tier = 'public'::public.tree_accessibility_tier
    OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
    OR public.can_read_tree_record(id)
  );

COMMIT;

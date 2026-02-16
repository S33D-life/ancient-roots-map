
-- Fix offering_tags: restrict SELECT to match offering visibility rules
DROP POLICY IF EXISTS "Anyone can view offering tags" ON public.offering_tags;

CREATE POLICY "Users can view tags on accessible offerings"
ON public.offering_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offerings o
    WHERE o.id = offering_tags.offering_id
    AND (
      -- Public offerings: anyone can see tags
      o.visibility = 'public'
      -- Tribe offerings: author, tree creator, or meeting holder
      OR (
        o.visibility = 'tribe'
        AND (
          auth.uid() = o.created_by
          OR auth.uid() = (SELECT t.created_by FROM public.trees t WHERE t.id = o.tree_id)
          OR has_tree_meeting(auth.uid(), o.tree_id)
        )
      )
      -- Private offerings: only author
      OR (o.visibility = 'private' AND auth.uid() = o.created_by)
    )
  )
);

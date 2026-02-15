
-- Add visibility column to offerings table
-- Photos default to 'public', all other types default to 'tribe'
ALTER TABLE public.offerings
ADD COLUMN visibility text NOT NULL DEFAULT 'tribe'
CHECK (visibility IN ('private', 'tribe', 'public'));

-- Photos should always default to public
-- We'll handle the default per-type in application code, but set existing rows:
UPDATE public.offerings SET visibility = 'public' WHERE type = 'photo';

-- Create a helper function to check if a user has visited a tree (has a meeting)
CREATE OR REPLACE FUNCTION public.has_tree_meeting(_user_id uuid, _tree_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meetings
    WHERE user_id = _user_id
      AND tree_id = _tree_id
  )
$$;

-- Replace the existing SELECT policy with visibility-aware policy
DROP POLICY IF EXISTS "Offerings are viewable by everyone" ON public.offerings;
DROP POLICY IF EXISTS "Anyone can view offerings" ON public.offerings;

-- New visibility-aware SELECT policy
CREATE POLICY "Offerings visible by access level"
ON public.offerings FOR SELECT
USING (
  -- Public offerings: anyone can see
  visibility = 'public'
  -- Tribe offerings: author, tree creator, or anyone with a meeting on this tree
  OR (
    visibility = 'tribe'
    AND (
      auth.uid() = created_by
      OR auth.uid() = (SELECT created_by FROM public.trees WHERE id = tree_id)
      OR has_tree_meeting(auth.uid(), tree_id)
    )
  )
  -- Private offerings: only the author
  OR (
    visibility = 'private'
    AND auth.uid() = created_by
  )
);

-- Create an RPC to get offering summaries (count + types) for any tree,
-- regardless of visibility, so non-authorized users see what exists
CREATE OR REPLACE FUNCTION public.get_tree_offering_summary(p_tree_id uuid)
RETURNS TABLE(type text, cnt bigint, has_photo boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.type::text,
    COUNT(*) AS cnt,
    bool_or(o.type = 'photo' AND o.media_url IS NOT NULL) AS has_photo
  FROM offerings o
  WHERE o.tree_id = p_tree_id
  GROUP BY o.type;
$$;

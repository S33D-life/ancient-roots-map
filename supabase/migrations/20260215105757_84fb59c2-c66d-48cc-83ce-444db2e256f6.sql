
CREATE OR REPLACE FUNCTION public.get_offering_counts()
RETURNS TABLE(tree_id uuid, cnt bigint, first_photo text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    o.tree_id,
    COUNT(*) AS cnt,
    MIN(CASE WHEN o.type = 'photo' AND o.media_url IS NOT NULL THEN o.media_url END) AS first_photo
  FROM offerings o
  GROUP BY o.tree_id;
$$;

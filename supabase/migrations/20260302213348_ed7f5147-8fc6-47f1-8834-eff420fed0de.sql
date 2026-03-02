
CREATE OR REPLACE FUNCTION public.get_tree_offering_summary(p_tree_id uuid)
RETURNS TABLE(type text, cnt bigint, has_photo boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT
    o.type::text,
    COUNT(*) AS cnt,
    bool_or(o.type = 'photo' AND o.media_url IS NOT NULL) AS has_photo
  FROM offerings o
  WHERE o.tree_id = p_tree_id
  GROUP BY o.type;
$$;


-- Create a function to get the tree mapper leaderboard
-- Returns only public-safe fields (no emails)
CREATE OR REPLACE FUNCTION public.get_tree_leaderboard(result_limit integer DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  tree_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.created_by AS user_id,
    COALESCE(p.full_name, 'Ancient Friend') AS display_name,
    p.avatar_url,
    COUNT(t.id) AS tree_count
  FROM trees t
  LEFT JOIN profiles p ON p.id = t.created_by
  WHERE t.created_by IS NOT NULL
  GROUP BY t.created_by, p.full_name, p.avatar_url
  ORDER BY tree_count DESC
  LIMIT result_limit;
$$;

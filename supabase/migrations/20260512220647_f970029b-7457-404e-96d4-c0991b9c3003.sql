CREATE OR REPLACE FUNCTION public.admin_users_list(
  search_query text DEFAULT '',
  result_limit int DEFAULT 200,
  sort_newest boolean DEFAULT true
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_keeper boolean,
  is_curator boolean,
  trees_added bigint,
  offerings_count bigint,
  hearts_earned numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'curator'::app_role) OR public.has_role(auth.uid(), 'keeper'::app_role)) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.full_name,
    u.created_at,
    u.last_sign_in_at,
    public.has_role(u.id, 'keeper'::app_role) AS is_keeper,
    public.has_role(u.id, 'curator'::app_role) AS is_curator,
    COALESCE((SELECT COUNT(*) FROM public.trees t WHERE t.created_by = u.id), 0)::bigint AS trees_added,
    COALESCE((SELECT COUNT(*) FROM public.offerings o WHERE o.created_by = u.id), 0)::bigint AS offerings_count,
    COALESCE((SELECT SUM(h.amount) FROM public.heart_ledger h WHERE h.user_id = u.id AND h.amount > 0), 0)::numeric AS hearts_earned
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE search_query = ''
     OR u.email ILIKE '%' || search_query || '%'
     OR p.full_name ILIKE '%' || search_query || '%'
  ORDER BY
    CASE WHEN sort_newest THEN u.created_at END DESC NULLS LAST,
    CASE WHEN NOT sort_newest THEN u.created_at END ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(result_limit, 1000));
END;
$$;
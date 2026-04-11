
-- 1. Tree Presence Summary for map layer
CREATE OR REPLACE FUNCTION public.get_tree_presence_summary(
  p_min_lat double precision DEFAULT -90,
  p_max_lat double precision DEFAULT 90,
  p_min_lng double precision DEFAULT -180,
  p_max_lng double precision DEFAULT 180
)
RETURNS TABLE(
  tree_id uuid,
  tree_name text,
  latitude double precision,
  longitude double precision,
  species text,
  presence_count bigint,
  most_recent timestamptz,
  presence_state text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id AS tree_id,
    t.name AS tree_name,
    t.latitude::double precision,
    t.longitude::double precision,
    t.species,
    COUNT(tc.id) AS presence_count,
    MAX(tc.checked_in_at) AS most_recent,
    CASE
      WHEN MAX(tc.checked_in_at) >= NOW() - INTERVAL '1 hour' THEN 'here_now'
      WHEN MAX(tc.checked_in_at) >= NOW() - INTERVAL '12 hours' THEN 'recently_met'
      ELSE 'none'
    END AS presence_state
  FROM trees t
  INNER JOIN tree_checkins tc ON tc.tree_id = t.id
  WHERE t.latitude BETWEEN p_min_lat AND p_max_lat
    AND t.longitude BETWEEN p_min_lng AND p_max_lng
    AND tc.checked_in_at >= NOW() - INTERVAL '12 hours'
  GROUP BY t.id, t.name, t.latitude, t.longitude, t.species
  HAVING COUNT(tc.id) > 0
  ORDER BY MAX(tc.checked_in_at) DESC
  LIMIT 200;
$$;

-- 2. Heart Economy Stats for dashboard
CREATE OR REPLACE FUNCTION public.get_heart_economy_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_total_earned bigint;
  v_total_spent bigint;
  v_by_type jsonb;
  v_top_trees jsonb;
  v_recent jsonb;
  v_growing jsonb;
BEGIN
  -- Total earned (positive amounts)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM heart_transactions
  WHERE user_id = p_user_id AND amount > 0;

  -- Total spent (negative amounts)
  SELECT COALESCE(ABS(SUM(amount)), 0) INTO v_total_spent
  FROM heart_transactions
  WHERE user_id = p_user_id AND amount < 0;

  -- By type breakdown
  SELECT COALESCE(jsonb_object_agg(heart_type, type_total), '{}'::jsonb) INTO v_by_type
  FROM (
    SELECT heart_type, SUM(amount) AS type_total
    FROM heart_transactions
    WHERE user_id = p_user_id AND amount > 0
    GROUP BY heart_type
  ) sub;

  -- Top 5 trees by hearts earned
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_top_trees
  FROM (
    SELECT ht.tree_id, t.name AS tree_name, t.species, SUM(ht.amount) AS hearts
    FROM heart_transactions ht
    LEFT JOIN trees t ON t.id = ht.tree_id
    WHERE ht.user_id = p_user_id AND ht.amount > 0 AND ht.tree_id IS NOT NULL
    GROUP BY ht.tree_id, t.name, t.species
    ORDER BY SUM(ht.amount) DESC
    LIMIT 5
  ) sub;

  -- Recent 10 events
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_recent
  FROM (
    SELECT id, amount, heart_type, tree_id, created_at
    FROM heart_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) sub;

  -- Growing hearts (tree_value_roots)
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_growing
  FROM (
    SELECT tvr.tree_id, t.name AS tree_name, t.species,
           tvr.hearts_planted, tvr.hearts_grown, tvr.planted_at
    FROM tree_value_roots tvr
    LEFT JOIN trees t ON t.id = tvr.tree_id
    WHERE tvr.user_id = p_user_id AND tvr.hearts_planted > 0
    ORDER BY tvr.planted_at DESC
    LIMIT 10
  ) sub;

  v_result := jsonb_build_object(
    'total_earned', v_total_earned,
    'total_spent', v_total_spent,
    'balance', v_total_earned - v_total_spent,
    'by_type', v_by_type,
    'top_trees', v_top_trees,
    'recent_events', v_recent,
    'growing', v_growing
  );

  RETURN v_result;
END;
$$;

-- 3. User Lineage chain
CREATE OR REPLACE FUNCTION public.get_user_lineage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upstream jsonb;
  v_downstream jsonb;
  v_self jsonb;
  v_staff jsonb;
BEGIN
  -- Self
  SELECT jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'invited_by_user_id', p.invited_by_user_id,
    'lineage_staff_id', p.lineage_staff_id,
    'invites_remaining', p.invites_remaining,
    'invites_sent', p.invites_sent,
    'invites_accepted', p.invites_accepted
  ) INTO v_self
  FROM profiles p WHERE p.id = p_user_id;

  -- Upstream chain (up to 5 levels)
  WITH RECURSIVE chain AS (
    SELECT p.id, p.display_name, p.avatar_url, p.invited_by_user_id, p.lineage_staff_id, 1 AS depth
    FROM profiles p WHERE p.id = (v_self->>'invited_by_user_id')::uuid
    UNION ALL
    SELECT p.id, p.display_name, p.avatar_url, p.invited_by_user_id, p.lineage_staff_id, c.depth + 1
    FROM profiles p
    INNER JOIN chain c ON p.id = c.invited_by_user_id
    WHERE c.depth < 5
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'display_name', display_name, 'avatar_url', avatar_url,
    'lineage_staff_id', lineage_staff_id, 'depth', depth
  ) ORDER BY depth), '[]'::jsonb) INTO v_upstream
  FROM chain;

  -- Downstream invitees (direct, up to 50)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'created_at', p.created_at
  ) ORDER BY p.created_at DESC), '[]'::jsonb) INTO v_downstream
  FROM profiles p WHERE p.invited_by_user_id = p_user_id
  LIMIT 50;

  -- Staff info if available
  SELECT jsonb_build_object(
    'staff_code', s.staff_code, 'staff_name', s.staff_name,
    'staff_species', s.staff_species
  ) INTO v_staff
  FROM staff_assignments s
  WHERE s.user_id = p_user_id AND s.active = true
  LIMIT 1;

  RETURN jsonb_build_object(
    'self', v_self,
    'upstream', v_upstream,
    'downstream', v_downstream,
    'staff', COALESCE(v_staff, 'null'::jsonb)
  );
END;
$$;

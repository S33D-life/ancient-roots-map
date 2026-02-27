
-- Admin analytics RPC: Platform overview metrics derived from existing tables
CREATE OR REPLACE FUNCTION public.admin_platform_overview()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_wanderers', (SELECT count(*) FROM profiles),
    'total_trees', (SELECT count(*) FROM trees),
    'total_offerings', (SELECT count(*) FROM offerings),
    'total_hearts_minted', (SELECT COALESCE(sum(amount), 0) FROM heart_transactions),
    'total_checkins', (SELECT count(*) FROM tree_checkins),
    'total_referrals', (SELECT count(*) FROM referrals),
    'total_species', (SELECT count(DISTINCT species) FROM trees WHERE species IS NOT NULL),
    'total_nations', (SELECT count(DISTINCT nation) FROM trees WHERE nation IS NOT NULL),
    'new_wanderers_7d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'new_wanderers_30d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '30 days'),
    'new_trees_7d', (SELECT count(*) FROM trees WHERE created_at > now() - interval '7 days'),
    'new_trees_30d', (SELECT count(*) FROM trees WHERE created_at > now() - interval '30 days'),
    'active_wanderers_7d', (SELECT count(DISTINCT created_by) FROM offerings WHERE created_at > now() - interval '7 days'),
    'active_wanderers_30d', (SELECT count(DISTINCT created_by) FROM offerings WHERE created_at > now() - interval '30 days'),
    'hearts_minted_7d', (SELECT COALESCE(sum(amount), 0) FROM heart_transactions WHERE created_at > now() - interval '7 days'),
    'hearts_minted_30d', (SELECT COALESCE(sum(amount), 0) FROM heart_transactions WHERE created_at > now() - interval '30 days'),
    'trees_zero_offerings', (SELECT count(*) FROM trees t WHERE NOT EXISTS (SELECT 1 FROM offerings o WHERE o.tree_id = t.id)),
    'avg_offerings_per_tree', (SELECT COALESCE(round(avg(cnt), 1), 0) FROM (SELECT count(*) cnt FROM offerings GROUP BY tree_id) sub)
  );
$$;

-- Admin analytics: daily signups for growth chart (last 90 days)
CREATE OR REPLACE FUNCTION public.admin_daily_signups(days_back integer DEFAULT 90)
RETURNS TABLE(day date, signups bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d::date AS day, COALESCE(count(p.id), 0) AS signups
  FROM generate_series(
    (now() - (days_back || ' days')::interval)::date,
    now()::date,
    '1 day'
  ) d
  LEFT JOIN profiles p ON p.created_at::date = d::date
  GROUP BY d::date
  ORDER BY d::date;
$$;

-- Admin analytics: daily tree mappings (last 90 days)
CREATE OR REPLACE FUNCTION public.admin_daily_trees(days_back integer DEFAULT 90)
RETURNS TABLE(day date, trees_mapped bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d::date AS day, COALESCE(count(t.id), 0) AS trees_mapped
  FROM generate_series(
    (now() - (days_back || ' days')::interval)::date,
    now()::date,
    '1 day'
  ) d
  LEFT JOIN trees t ON t.created_at::date = d::date
  GROUP BY d::date
  ORDER BY d::date;
$$;

-- Admin analytics: feature usage counts
CREATE OR REPLACE FUNCTION public.admin_feature_health()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'offerings_7d', (SELECT count(*) FROM offerings WHERE created_at > now() - interval '7 days'),
    'offerings_30d', (SELECT count(*) FROM offerings WHERE created_at > now() - interval '30 days'),
    'checkins_7d', (SELECT count(*) FROM tree_checkins WHERE checked_in_at > now() - interval '7 days'),
    'checkins_30d', (SELECT count(*) FROM tree_checkins WHERE checked_in_at > now() - interval '30 days'),
    'whispers_7d', (SELECT count(*) FROM tree_whispers WHERE created_at > now() - interval '7 days'),
    'whispers_30d', (SELECT count(*) FROM tree_whispers WHERE created_at > now() - interval '30 days'),
    'seeds_planted_7d', (SELECT count(*) FROM planted_seeds WHERE planted_at > now() - interval '7 days'),
    'seeds_planted_30d', (SELECT count(*) FROM planted_seeds WHERE planted_at > now() - interval '30 days'),
    'seeds_collected_7d', (SELECT count(*) FROM planted_seeds WHERE collected_at > now() - interval '7 days'),
    'seeds_collected_30d', (SELECT count(*) FROM planted_seeds WHERE collected_at > now() - interval '30 days'),
    'meetings_7d', (SELECT count(*) FROM meetings WHERE created_at > now() - interval '7 days'),
    'meetings_30d', (SELECT count(*) FROM meetings WHERE created_at > now() - interval '30 days'),
    'referrals_7d', (SELECT count(*) FROM referrals WHERE created_at > now() - interval '7 days'),
    'referrals_30d', (SELECT count(*) FROM referrals WHERE created_at > now() - interval '30 days'),
    'bookshelf_7d', (SELECT count(*) FROM bookshelf_entries WHERE created_at > now() - interval '7 days'),
    'bookshelf_30d', (SELECT count(*) FROM bookshelf_entries WHERE created_at > now() - interval '30 days'),
    'market_stakes_7d', (SELECT count(*) FROM market_stakes WHERE created_at > now() - interval '7 days'),
    'market_stakes_30d', (SELECT count(*) FROM market_stakes WHERE created_at > now() - interval '30 days'),
    'bug_reports_7d', (SELECT count(*) FROM bug_reports WHERE created_at > now() - interval '7 days'),
    'bug_reports_30d', (SELECT count(*) FROM bug_reports WHERE created_at > now() - interval '30 days'),
    'birdsong_7d', (SELECT count(*) FROM birdsong_offerings WHERE created_at > now() - interval '7 days'),
    'birdsong_30d', (SELECT count(*) FROM birdsong_offerings WHERE created_at > now() - interval '30 days'),
    'time_tree_7d', (SELECT count(*) FROM time_tree_entries WHERE created_at > now() - interval '7 days'),
    'time_tree_30d', (SELECT count(*) FROM time_tree_entries WHERE created_at > now() - interval '30 days')
  );
$$;

-- Admin analytics: heart economy breakdown
CREATE OR REPLACE FUNCTION public.admin_economy_health()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_hearts', (SELECT COALESCE(sum(amount), 0) FROM heart_transactions),
    'total_species_hearts', (SELECT COALESCE(sum(amount), 0) FROM species_heart_transactions),
    'total_influence', (SELECT COALESCE(sum(amount), 0) FROM influence_transactions),
    'hearts_by_type', (
      SELECT json_agg(row_to_json(sub))
      FROM (
        SELECT heart_type, sum(amount) as total, count(*) as txn_count
        FROM heart_transactions
        GROUP BY heart_type
        ORDER BY total DESC
      ) sub
    ),
    'avg_hearts_per_user', (
      SELECT COALESCE(round(avg(s33d_hearts), 1), 0)
      FROM user_heart_balances
    ),
    'top_heart_holders', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]')
      FROM (
        SELECT uhb.user_id, COALESCE(p.full_name, 'Unnamed') as name, uhb.s33d_hearts
        FROM user_heart_balances uhb
        LEFT JOIN profiles p ON p.id = uhb.user_id
        ORDER BY uhb.s33d_hearts DESC
        LIMIT 10
      ) sub
    ),
    'windfall_count', (SELECT COALESCE(sum(windfall_count), 0) FROM tree_heart_pools),
    'daily_hearts_7d', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]')
      FROM (
        SELECT created_at::date as day, sum(amount) as hearts
        FROM heart_transactions
        WHERE created_at > now() - interval '7 days'
        GROUP BY created_at::date
        ORDER BY day
      ) sub
    )
  );
$$;

-- Admin analytics: species coverage and engagement
CREATE OR REPLACE FUNCTION public.admin_species_coverage()
RETURNS TABLE(species text, tree_count bigint, offering_count bigint, checkin_count bigint, unique_visitors bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.species,
    count(DISTINCT t.id) as tree_count,
    count(DISTINCT o.id) as offering_count,
    count(DISTINCT tc.id) as checkin_count,
    count(DISTINCT o.created_by) as unique_visitors
  FROM trees t
  LEFT JOIN offerings o ON o.tree_id = t.id
  LEFT JOIN tree_checkins tc ON tc.tree_id = t.id
  WHERE t.species IS NOT NULL
  GROUP BY t.species
  ORDER BY tree_count DESC
  LIMIT 50;
$$;

-- Admin analytics: geographic coverage
CREATE OR REPLACE FUNCTION public.admin_geographic_coverage()
RETURNS TABLE(nation text, tree_count bigint, wanderer_count bigint, offering_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(t.nation, 'Unknown') as nation,
    count(DISTINCT t.id) as tree_count,
    count(DISTINCT t.created_by) as wanderer_count,
    count(DISTINCT o.id) as offering_count
  FROM trees t
  LEFT JOIN offerings o ON o.tree_id = t.id
  WHERE t.nation IS NOT NULL
  GROUP BY t.nation
  ORDER BY tree_count DESC;
$$;

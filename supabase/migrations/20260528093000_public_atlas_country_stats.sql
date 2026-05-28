CREATE OR REPLACE FUNCTION public.public_atlas_country_stats(country_filter text DEFAULT NULL)
RETURNS TABLE (
  country text,
  total_research_records bigint,
  research_records_with_coordinates bigint,
  research_records_missing_coordinates bigint,
  exact_precision_count bigint,
  approximate_precision_count bigint,
  unknown_precision_count bigint,
  distinct_species_count bigint,
  linked_ancient_friends_count bigint,
  verification_task_open_count bigint,
  verification_task_completed_count bigint,
  source_count bigint,
  data_confidence_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT *
    FROM public.research_trees rt
    WHERE country_filter IS NULL OR rt.country = country_filter
  ),
  record_stats AS (
    SELECT
      rt.country,
      COUNT(*)::bigint AS total_research_records,
      COUNT(*) FILTER (
        WHERE rt.latitude IS NOT NULL AND rt.longitude IS NOT NULL
      )::bigint AS research_records_with_coordinates,
      COUNT(*) FILTER (
        WHERE rt.latitude IS NULL OR rt.longitude IS NULL
      )::bigint AS research_records_missing_coordinates,
      COUNT(*) FILTER (
        WHERE lower(COALESCE(rt.geo_precision, '')) IN ('exact', 'precise')
      )::bigint AS exact_precision_count,
      COUNT(*) FILTER (
        WHERE lower(COALESCE(rt.geo_precision, '')) IN ('approx', 'approximate', 'estimated')
      )::bigint AS approximate_precision_count,
      COUNT(DISTINCT NULLIF(COALESCE(rt.species_scientific, rt.species_common), ''))::bigint AS distinct_species_count,
      COUNT(*) FILTER (
        WHERE rt.linked_tree_id IS NOT NULL
           OR rt.converted_tree_id IS NOT NULL
           OR rt.status = 'verified_linked'
      )::bigint AS linked_ancient_friends_count,
      COUNT(DISTINCT COALESCE(
        NULLIF(rt.source_doc_url, ''),
        NULLIF(rt.source_program, ''),
        NULLIF(rt.source_doc_title, '')
      ))::bigint AS source_count,
      COUNT(*) FILTER (
        WHERE NULLIF(rt.source_doc_url, '') IS NOT NULL
           OR NULLIF(rt.source_program, '') IS NOT NULL
           OR NULLIF(rt.source_doc_title, '') IS NOT NULL
      )::bigint AS records_with_source
    FROM base rt
    GROUP BY rt.country
  ),
  task_stats AS (
    SELECT
      b.country,
      COUNT(vt.id) FILTER (WHERE vt.status = 'open')::bigint AS verification_task_open_count,
      COUNT(vt.id) FILTER (WHERE vt.status = 'completed')::bigint AS verification_task_completed_count
    FROM base b
    LEFT JOIN public.verification_tasks vt ON vt.research_tree_id = b.id
    GROUP BY b.country
  )
  SELECT
    rs.country,
    rs.total_research_records,
    rs.research_records_with_coordinates,
    rs.research_records_missing_coordinates,
    rs.exact_precision_count,
    rs.approximate_precision_count,
    GREATEST(
      rs.total_research_records - rs.exact_precision_count - rs.approximate_precision_count,
      0
    )::bigint AS unknown_precision_count,
    rs.distinct_species_count,
    rs.linked_ancient_friends_count,
    COALESCE(ts.verification_task_open_count, 0)::bigint AS verification_task_open_count,
    COALESCE(ts.verification_task_completed_count, 0)::bigint AS verification_task_completed_count,
    rs.source_count,
    CASE
      WHEN rs.total_research_records = 0 THEN 0
      ELSE ROUND(100 * (
        0.35 * (rs.research_records_with_coordinates::numeric / rs.total_research_records) +
        0.20 * ((rs.exact_precision_count + (rs.approximate_precision_count * 0.5))::numeric / rs.total_research_records) +
        0.20 * (rs.records_with_source::numeric / rs.total_research_records) +
        0.15 * (rs.linked_ancient_friends_count::numeric / rs.total_research_records) +
        0.10 * CASE
          WHEN COALESCE(ts.verification_task_open_count, 0) + COALESCE(ts.verification_task_completed_count, 0) > 0
            THEN COALESCE(ts.verification_task_completed_count, 0)::numeric /
              (COALESCE(ts.verification_task_open_count, 0) + COALESCE(ts.verification_task_completed_count, 0))
          ELSE 0
        END
      ))::integer
    END AS data_confidence_score
  FROM record_stats rs
  LEFT JOIN task_stats ts ON ts.country = rs.country
  ORDER BY rs.total_research_records DESC, rs.country ASC;
$$;

REVOKE ALL ON FUNCTION public.public_atlas_country_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_atlas_country_stats(text) TO anon, authenticated;

COMMENT ON FUNCTION public.public_atlas_country_stats(text) IS
  'Privacy-safe aggregate country stats for public Atlas and Tree Data Commons surfaces. Reads research_trees and verification_tasks only.';

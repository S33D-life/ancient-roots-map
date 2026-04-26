-- Performance: research_trees is sequentially scanned ~405k times because
-- src/hooks/use-roadmap-pulse.ts pulls (conversion_status, latitude, longitude, species_scientific)
-- with no WHERE clause for client-side counting. Add a covering index so the
-- planner can use an Index-Only Scan and avoid touching the heap (~134 buffer hits -> ~10).
CREATE INDEX IF NOT EXISTS idx_research_trees_pulse_covering
  ON public.research_trees (conversion_status)
  INCLUDE (latitude, longitude, species_scientific);
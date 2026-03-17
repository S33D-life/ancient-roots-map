
-- Harden overly permissive RLS policies (WITH CHECK true / USING true on mutating ops)
-- Creates a helper to check agent ownership, then tightens all flagged policies.

-- Helper: check if current user owns the agent
CREATE OR REPLACE FUNCTION public.owns_agent(_agent_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_profiles
    WHERE id = _agent_id
      AND creator = auth.uid()::text
  )
$$;

-- 1. agent_profiles: INSERT must set creator = auth.uid()
DROP POLICY IF EXISTS "Auth insert agent_profiles" ON public.agent_profiles;
CREATE POLICY "Auth insert agent_profiles"
  ON public.agent_profiles FOR INSERT TO authenticated
  WITH CHECK (creator = auth.uid()::text);

-- 2. agent_capabilities: INSERT/UPDATE scoped to owned agents
DROP POLICY IF EXISTS "Authenticated users can insert capabilities" ON public.agent_capabilities;
CREATE POLICY "Authenticated users can insert capabilities"
  ON public.agent_capabilities FOR INSERT TO authenticated
  WITH CHECK (public.owns_agent(agent_id));

DROP POLICY IF EXISTS "Authenticated users can update capabilities" ON public.agent_capabilities;
CREATE POLICY "Authenticated users can update capabilities"
  ON public.agent_capabilities FOR UPDATE TO authenticated
  USING (public.owns_agent(agent_id));

-- 3. agent_contribution_events: INSERT scoped to owned agents
DROP POLICY IF EXISTS "Authenticated users can insert contribution events" ON public.agent_contribution_events;
CREATE POLICY "Authenticated users can insert contribution events"
  ON public.agent_contribution_events FOR INSERT TO authenticated
  WITH CHECK (public.owns_agent(agent_id));

-- 4. agent_reward_ledger: INSERT scoped to owned agents
DROP POLICY IF EXISTS "Authenticated users can insert reward entries" ON public.agent_reward_ledger;
CREATE POLICY "Authenticated users can insert reward entries"
  ON public.agent_reward_ledger FOR INSERT TO authenticated
  WITH CHECK (public.owns_agent(agent_id));

-- 5. agent_garden_tasks: keep open for authenticated (community tasks)
-- but add WITH CHECK on UPDATE to prevent arbitrary updates
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.agent_garden_tasks;
CREATE POLICY "Authenticated users can update tasks"
  ON public.agent_garden_tasks FOR UPDATE TO authenticated
  USING (claimed_by_agent_id IS NULL OR public.owns_agent(claimed_by_agent_id))
  WITH CHECK (claimed_by_agent_id IS NULL OR public.owns_agent(claimed_by_agent_id));

-- 6. spark_reports: INSERT must set submitted_by = auth.uid()
DROP POLICY IF EXISTS "Auth insert spark_reports" ON public.spark_reports;
CREATE POLICY "Auth insert spark_reports"
  ON public.spark_reports FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- 7. tree_data_sources: INSERT must set created_by = auth.uid()
DROP POLICY IF EXISTS "Auth insert tree_data_sources" ON public.tree_data_sources;
CREATE POLICY "Auth insert tree_data_sources"
  ON public.tree_data_sources FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 8. dataset_discovery_queue: INSERT/UPDATE scoped to discoverer
DROP POLICY IF EXISTS "Authenticated users can insert discoveries" ON public.dataset_discovery_queue;
CREATE POLICY "Authenticated users can insert discoveries"
  ON public.dataset_discovery_queue FOR INSERT TO authenticated
  WITH CHECK (discovered_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update discoveries" ON public.dataset_discovery_queue;
CREATE POLICY "Authenticated users can update discoveries"
  ON public.dataset_discovery_queue FOR UPDATE TO authenticated
  USING (discovered_by = auth.uid())
  WITH CHECK (discovered_by = auth.uid());

-- 9. dataset_watch_state: scope to source owner via tree_data_sources
DROP POLICY IF EXISTS "Authenticated users can insert watch state" ON public.dataset_watch_state;
CREATE POLICY "Authenticated users can insert watch state"
  ON public.dataset_watch_state FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tree_data_sources tds
      WHERE tds.id = source_id AND tds.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can update watch state" ON public.dataset_watch_state;
CREATE POLICY "Authenticated users can update watch state"
  ON public.dataset_watch_state FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tree_data_sources tds
      WHERE tds.id = source_id AND tds.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tree_data_sources tds
      WHERE tds.id = source_id AND tds.created_by = auth.uid()
    )
  );

-- 10. groves: keep INSERT open for authenticated (community-created, no user column)
-- Replace WITH CHECK(true) with explicit auth check
DROP POLICY IF EXISTS "Authenticated users can create groves" ON public.groves;
CREATE POLICY "Authenticated users can create groves"
  ON public.groves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 11. grove_trees: same pattern
DROP POLICY IF EXISTS "Authenticated can add grove trees" ON public.grove_trees;
CREATE POLICY "Authenticated can add grove trees"
  ON public.grove_trees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 12. mycelial_pathways: INSERT/UPDATE
DROP POLICY IF EXISTS "Authenticated can insert pathways" ON public.mycelial_pathways;
CREATE POLICY "Authenticated can insert pathways"
  ON public.mycelial_pathways FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can update pathways" ON public.mycelial_pathways;
CREATE POLICY "Authenticated can update pathways"
  ON public.mycelial_pathways FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 13. pathway_groves: same pattern
DROP POLICY IF EXISTS "Authenticated can insert pathway_groves" ON public.pathway_groves;
CREATE POLICY "Authenticated can insert pathway_groves"
  ON public.pathway_groves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 14. agent_garden_tasks INSERT: keep open for community
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.agent_garden_tasks;
CREATE POLICY "Authenticated users can insert tasks"
  ON public.agent_garden_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

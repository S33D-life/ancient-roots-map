
-- 1. agent_journeys
CREATE TABLE public.agent_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  entry_path text NOT NULL DEFAULT '/',
  steps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view journeys"
  ON public.agent_journeys FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Keepers can insert journeys"
  ON public.agent_journeys FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

CREATE POLICY "Keepers can update journeys"
  ON public.agent_journeys FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

-- 2. agent_runs
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid,
  journey_id uuid NOT NULL REFERENCES public.agent_journeys(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','passed','failed','needs_review')),
  started_at timestamptz,
  finished_at timestamptz,
  summary text,
  score numeric,
  environment text,
  build_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view runs"
  ON public.agent_runs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Keepers can insert runs"
  ON public.agent_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

CREATE POLICY "Keepers can update runs"
  ON public.agent_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

-- 3. agent_findings
CREATE TABLE public.agent_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bug','ux_friction','insight','spark')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  title text NOT NULL,
  description text NOT NULL,
  route text,
  screenshot_url text,
  trace_json jsonb,
  review_status text NOT NULL DEFAULT 'pending',
  suggested_bug_garden_post_id uuid,
  curator_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view findings"
  ON public.agent_findings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Keepers can insert findings"
  ON public.agent_findings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

CREATE POLICY "Keepers can update findings"
  ON public.agent_findings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

-- Indexes
CREATE INDEX idx_agent_runs_journey ON public.agent_runs(journey_id);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX idx_agent_findings_run ON public.agent_findings(run_id);
CREATE INDEX idx_agent_findings_type ON public.agent_findings(type);
CREATE INDEX idx_agent_findings_review ON public.agent_findings(review_status);

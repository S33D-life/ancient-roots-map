-- 1. dataset_crawl_runs — tracks each crawl execution against a source
CREATE TABLE public.dataset_crawl_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.tree_data_sources(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_profiles(id),
  status text NOT NULL DEFAULT 'queued',
  pages_scraped integer NOT NULL DEFAULT 0,
  candidates_found integer NOT NULL DEFAULT 0,
  error_log text,
  config_json jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_crawl_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crawl runs"
  ON public.dataset_crawl_runs FOR SELECT USING (true);

CREATE POLICY "Keepers can manage crawl runs"
  ON public.dataset_crawl_runs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

-- 2. source_tree_candidates — raw extracted tree data before normalization
CREATE TABLE public.source_tree_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_run_id uuid NOT NULL REFERENCES public.dataset_crawl_runs(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.tree_data_sources(id) ON DELETE CASCADE,
  raw_name text,
  raw_species text,
  raw_location_text text,
  raw_latitude double precision,
  raw_longitude double precision,
  raw_country text,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0,
  normalization_status text NOT NULL DEFAULT 'raw',
  promoted_research_tree_id uuid REFERENCES public.research_trees(id),
  duplicate_of_candidate_id uuid REFERENCES public.source_tree_candidates(id),
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.source_tree_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view candidates"
  ON public.source_tree_candidates FOR SELECT USING (true);

CREATE POLICY "Keepers can manage candidates"
  ON public.source_tree_candidates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

CREATE INDEX idx_candidates_crawl_run ON public.source_tree_candidates(crawl_run_id);
CREATE INDEX idx_candidates_source ON public.source_tree_candidates(source_id);
CREATE INDEX idx_candidates_status ON public.source_tree_candidates(normalization_status);
CREATE INDEX idx_candidates_coords ON public.source_tree_candidates(raw_latitude, raw_longitude)
  WHERE raw_latitude IS NOT NULL AND raw_longitude IS NOT NULL;

-- 3. verification_tasks — human verification invitations for research trees
CREATE TABLE public.verification_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_tree_id uuid NOT NULL REFERENCES public.research_trees(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'general_review',
  status text NOT NULL DEFAULT 'open',
  title text NOT NULL,
  description text,
  claimed_by uuid,
  completed_at timestamptz,
  completion_notes text,
  completion_evidence_json jsonb,
  hearts_reward integer NOT NULL DEFAULT 5,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open verification tasks"
  ON public.verification_tasks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can claim tasks"
  ON public.verification_tasks FOR UPDATE
  TO authenticated
  USING (
    (claimed_by IS NULL AND status = 'open')
    OR claimed_by = auth.uid()
  );

CREATE POLICY "Keepers can manage verification tasks"
  ON public.verification_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'keeper'))
  WITH CHECK (public.has_role(auth.uid(), 'keeper'));

CREATE INDEX idx_verification_research_tree ON public.verification_tasks(research_tree_id);
CREATE INDEX idx_verification_status ON public.verification_tasks(status);
CREATE INDEX idx_verification_type ON public.verification_tasks(task_type);

-- Indexes on crawl runs
CREATE INDEX idx_crawl_runs_source ON public.dataset_crawl_runs(source_id);
CREATE INDEX idx_crawl_runs_status ON public.dataset_crawl_runs(status);
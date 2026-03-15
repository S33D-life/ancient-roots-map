
-- Extend agent_garden_tasks with co-creator fields
ALTER TABLE public.agent_garden_tasks
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'tree_data',
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS proof_requirements text,
  ADD COLUMN IF NOT EXISTS system_area text NOT NULL DEFAULT 'map',
  ADD COLUMN IF NOT EXISTS hearts_reward integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_submissions integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS submissions_count integer NOT NULL DEFAULT 0;

-- Task submissions table for proof-of-work
CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.agent_garden_tasks(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid NOT NULL,
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  proof_text text NOT NULL,
  proof_url text,
  proof_attachments text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted',
  reviewer_notes text,
  reviewed_by uuid,
  hearts_awarded integer NOT NULL DEFAULT 0,
  contribution_event_id uuid REFERENCES public.agent_contribution_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view submissions
CREATE POLICY "Authenticated users can view submissions"
  ON public.task_submissions FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own submissions
CREATE POLICY "Users can submit their own work"
  ON public.task_submissions FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON public.task_submissions FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() AND status = 'submitted');

-- Curators can update any submission (for review)
CREATE POLICY "Curators can review submissions"
  ON public.task_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'curator'));

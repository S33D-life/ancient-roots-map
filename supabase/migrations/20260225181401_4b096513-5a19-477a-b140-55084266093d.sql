
-- Collaborator Volumes — extends the Heartwood Shelf concept
CREATE TABLE public.collaborator_volumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Core metadata
  collaborator_name TEXT NOT NULL,
  collaborator_project TEXT,
  document_title TEXT NOT NULL,
  document_version TEXT DEFAULT '1.0',
  
  -- Content blocks
  essence_summary TEXT,
  resonance_map TEXT,
  divergence_map TEXT,
  
  -- Ring layer fields
  wanderer_summary TEXT,
  open_questions TEXT[], -- 3-7 open questions
  micro_experiment TEXT,
  
  -- Classification
  integration_intent TEXT NOT NULL DEFAULT 'exploring'
    CHECK (integration_intent IN ('exploring', 'prototype', 'experiment', 'resonance', 'archival')),
  visibility_state TEXT NOT NULL DEFAULT 'root'
    CHECK (visibility_state IN ('root', 'ring', 'ripple')),
  experiment_status TEXT NOT NULL DEFAULT 'exploring'
    CHECK (experiment_status IN ('exploring', 'testing', 'active', 'dormant')),
  
  -- Linking arrays (reuse existing IDs)
  themes TEXT[] DEFAULT '{}',
  linked_tree_ids UUID[] DEFAULT '{}',
  linked_pod_ids UUID[] DEFAULT '{}',
  linked_council_sessions TEXT[] DEFAULT '{}',
  
  -- Heart tracking
  ring_hearts_awarded BOOLEAN DEFAULT false,
  ripple_hearts_awarded BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.collaborator_volumes ENABLE ROW LEVEL SECURITY;

-- Policies: private by default, ring/ripple visible to authenticated
CREATE POLICY "Users can CRUD own volumes"
  ON public.collaborator_volumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ring and ripple volumes readable by authenticated"
  ON public.collaborator_volumes FOR SELECT
  USING (
    visibility_state IN ('ring', 'ripple')
    AND auth.uid() IS NOT NULL
  );

-- Collaborator Experiments — linked to volumes
CREATE TABLE public.collaborator_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volume_id UUID NOT NULL REFERENCES public.collaborator_volumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  description TEXT NOT NULL,
  timeline TEXT,
  metrics TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed', 'paused')),
  outcome_notes TEXT,
  
  linked_tree_ids UUID[] DEFAULT '{}',
  linked_pod_ids UUID[] DEFAULT '{}'
);

ALTER TABLE public.collaborator_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own experiments"
  ON public.collaborator_experiments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experiments visible when parent volume is ring/ripple"
  ON public.collaborator_experiments FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.collaborator_volumes cv
      WHERE cv.id = volume_id
      AND cv.visibility_state IN ('ring', 'ripple')
    )
  );

-- Index for fast lookups
CREATE INDEX idx_collab_volumes_user ON public.collaborator_volumes(user_id);
CREATE INDEX idx_collab_volumes_visibility ON public.collaborator_volumes(visibility_state);
CREATE INDEX idx_collab_experiments_volume ON public.collaborator_experiments(volume_id);

-- Updated_at trigger
CREATE TRIGGER collaborator_volumes_updated
  BEFORE UPDATE ON public.collaborator_volumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER collaborator_experiments_updated
  BEFORE UPDATE ON public.collaborator_experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

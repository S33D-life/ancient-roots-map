
-- Add immutable pipeline fields to research_trees
ALTER TABLE public.research_trees
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'research',
  ADD COLUMN IF NOT EXISTS verification_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS immutable_record_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS immutable_anchor_reference text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata_hash text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anchored_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anchor_chain text DEFAULT NULL;

-- Create index for immutable layer filtering
CREATE INDEX IF NOT EXISTS idx_research_trees_record_status ON public.research_trees (record_status);

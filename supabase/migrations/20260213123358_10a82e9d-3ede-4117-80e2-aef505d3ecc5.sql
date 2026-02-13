
-- Tree edit proposals table
CREATE TABLE public.tree_edit_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  proposed_changes JSONB NOT NULL DEFAULT '{}',
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]',
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  reviewer_note TEXT,
  flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tree_edit_proposals ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can propose edits
CREATE POLICY "Users can create proposals" ON public.tree_edit_proposals
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);

-- Users can view their own proposals
CREATE POLICY "Users can view own proposals" ON public.tree_edit_proposals
  FOR SELECT USING (auth.uid() = proposed_by);

-- Curators can view all proposals
CREATE POLICY "Curators can view all proposals" ON public.tree_edit_proposals
  FOR SELECT USING (has_role(auth.uid(), 'curator'::app_role));

-- Curators can update proposals (accept/reject)
CREATE POLICY "Curators can update proposals" ON public.tree_edit_proposals
  FOR UPDATE USING (has_role(auth.uid(), 'curator'::app_role));

-- Tree change log table (immutable history)
CREATE TABLE public.tree_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  change_set JSONB NOT NULL DEFAULT '{}',
  previous_values JSONB NOT NULL DEFAULT '{}',
  merged_from_proposal_id UUID REFERENCES public.tree_edit_proposals(id),
  merged_by UUID NOT NULL,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tree_change_log ENABLE ROW LEVEL SECURITY;

-- Anyone can view change history
CREATE POLICY "Anyone can view change log" ON public.tree_change_log
  FOR SELECT USING (true);

-- Only curators can insert (via merge action)
CREATE POLICY "Curators can insert change log" ON public.tree_change_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'curator'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_tree_edit_proposals_updated_at
  BEFORE UPDATE ON public.tree_edit_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

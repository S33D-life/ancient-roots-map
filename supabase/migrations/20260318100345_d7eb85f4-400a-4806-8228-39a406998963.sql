
-- Tree duplicate reports table
CREATE TABLE public.tree_duplicate_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_a_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  tree_b_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  similarity_score numeric(4,3) NOT NULL DEFAULT 0,
  note text,
  proposer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tree_duplicate_reports_unique UNIQUE (tree_a_id, tree_b_id),
  CONSTRAINT tree_duplicate_reports_different CHECK (tree_a_id != tree_b_id)
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_duplicate_report()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed_duplicate', 'rejected', 'separate_trees') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_duplicate_report
  BEFORE INSERT OR UPDATE ON public.tree_duplicate_reports
  FOR EACH ROW EXECUTE FUNCTION validate_tree_duplicate_report();

-- Add merged_into_tree_id to trees table
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS merged_into_tree_id uuid REFERENCES public.trees(id);
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS image_similarity_hash text;

-- Tree merge history table
CREATE TABLE public.tree_merge_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  secondary_tree_id uuid NOT NULL REFERENCES public.trees(id),
  merged_by uuid NOT NULL,
  merge_reason text,
  data_migrated jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tree_duplicate_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_merge_history ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read duplicate reports
CREATE POLICY "Authenticated users can read duplicate reports"
  ON public.tree_duplicate_reports FOR SELECT TO authenticated USING (true);

-- Any authenticated user can create a duplicate report
CREATE POLICY "Authenticated users can create duplicate reports"
  ON public.tree_duplicate_reports FOR INSERT TO authenticated
  WITH CHECK (proposer_id = auth.uid());

-- Only curators/keepers can update duplicate reports
CREATE POLICY "Stewards can update duplicate reports"
  ON public.tree_duplicate_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

-- Merge history: readable by all authenticated, writable by stewards
CREATE POLICY "Authenticated users can read merge history"
  ON public.tree_merge_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Stewards can create merge history"
  ON public.tree_merge_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

-- Public read for duplicate reports (for tree pages)
CREATE POLICY "Public can read duplicate reports"
  ON public.tree_duplicate_reports FOR SELECT TO anon USING (true);

CREATE POLICY "Public can read merge history"
  ON public.tree_merge_history FOR SELECT TO anon USING (true);

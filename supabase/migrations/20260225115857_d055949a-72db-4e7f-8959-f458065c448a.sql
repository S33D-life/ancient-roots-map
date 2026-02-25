
-- Tree Sources table for contributed references
CREATE TABLE public.tree_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  research_tree_id uuid REFERENCES public.research_trees(id),
  source_title text NOT NULL,
  source_type text NOT NULL DEFAULT 'other',
  url text,
  description text,
  submitted_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  verification_notes text,
  contributor_name text,
  contributor_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tree_sources_tree_id ON public.tree_sources(tree_id);
CREATE INDEX idx_tree_sources_research_tree_id ON public.tree_sources(research_tree_id);
CREATE INDEX idx_tree_sources_status ON public.tree_sources(verification_status);
CREATE INDEX idx_tree_sources_submitted_by ON public.tree_sources(submitted_by);

-- Validation trigger for source_type
CREATE OR REPLACE FUNCTION public.validate_tree_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.source_type NOT IN ('academic_paper', 'government_database', 'book', 'historical_archive', 'news_article', 'personal_field_research', 'indigenous_oral_record', 'other') THEN
    RAISE EXCEPTION 'Invalid source_type: %', NEW.source_type;
  END IF;
  IF NEW.verification_status NOT IN ('pending', 'verified', 'rejected', 'clarification_needed') THEN
    RAISE EXCEPTION 'Invalid verification_status: %', NEW.verification_status;
  END IF;
  IF NEW.source_title IS NOT NULL AND length(NEW.source_title) > 500 THEN
    RAISE EXCEPTION 'source_title too long (max 500 chars)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description too long (max 2000 chars)';
  END IF;
  IF NEW.url IS NOT NULL AND length(NEW.url) > 2000 THEN
    RAISE EXCEPTION 'url too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_tree_source_trigger
  BEFORE INSERT OR UPDATE ON public.tree_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tree_source();

-- Enable RLS
ALTER TABLE public.tree_sources ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can view verified sources
CREATE POLICY "Verified sources are publicly readable"
  ON public.tree_sources FOR SELECT
  USING (verification_status = 'verified');

-- Authenticated users can see their own pending sources
CREATE POLICY "Users can view own pending sources"
  ON public.tree_sources FOR SELECT
  USING (auth.uid() = submitted_by);

-- Curators can view all sources
CREATE POLICY "Curators can view all sources"
  ON public.tree_sources FOR SELECT
  USING (has_role(auth.uid(), 'curator'::app_role));

-- Authenticated users can submit sources
CREATE POLICY "Authenticated users can submit sources"
  ON public.tree_sources FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Curators can update sources (approve/reject)
CREATE POLICY "Curators can update sources"
  ON public.tree_sources FOR UPDATE
  USING (has_role(auth.uid(), 'curator'::app_role));

-- Users can delete their own pending sources
CREATE POLICY "Users can delete own pending sources"
  ON public.tree_sources FOR DELETE
  USING (auth.uid() = submitted_by AND verification_status = 'pending');

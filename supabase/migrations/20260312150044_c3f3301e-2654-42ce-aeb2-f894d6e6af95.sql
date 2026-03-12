-- Add conversion_status to track research → Ancient Friend promotion
ALTER TABLE public.research_trees
  ADD COLUMN IF NOT EXISTS conversion_status text NOT NULL DEFAULT 'research_only';

-- Add conversion metadata
ALTER TABLE public.research_trees
  ADD COLUMN IF NOT EXISTS converted_tree_id uuid REFERENCES public.trees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversion_notes text,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_by uuid,
  ADD COLUMN IF NOT EXISTS completeness_score smallint DEFAULT 0;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_research_trees_conversion_status ON public.research_trees(conversion_status);

-- Backfill existing featured/verified trees
UPDATE public.research_trees SET conversion_status = 'candidate' WHERE status = 'featured' AND conversion_status = 'research_only';
UPDATE public.research_trees SET conversion_status = 'converted' WHERE record_status = 'active' AND status = 'verified' AND conversion_status = 'research_only';

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_conversion_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $fn$
BEGIN
  IF NEW.conversion_status NOT IN ('research_only', 'candidate', 'in_conversion', 'converted', 'featured') THEN
    RAISE EXCEPTION 'Invalid conversion_status: %', NEW.conversion_status;
  END IF;
  IF NEW.conversion_status = 'converted' AND NEW.converted_tree_id IS NULL AND NEW.converted_at IS NULL THEN
    NEW.converted_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_validate_conversion_status ON public.research_trees;
CREATE TRIGGER trg_validate_conversion_status
  BEFORE INSERT OR UPDATE ON public.research_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversion_status();

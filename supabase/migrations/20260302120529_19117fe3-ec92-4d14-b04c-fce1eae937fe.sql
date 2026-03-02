
-- Add record_kind to research_trees for distinguishing individual trees from ecology nodes
ALTER TABLE public.research_trees
  ADD COLUMN IF NOT EXISTS record_kind text NOT NULL DEFAULT 'individual_tree';

-- Add check constraint via validation trigger (not CHECK, per guidelines)
CREATE OR REPLACE FUNCTION public.validate_research_tree_record_kind()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.record_kind NOT IN ('individual_tree', 'grove', 'ecology_node', 'cultural_site') THEN
    RAISE EXCEPTION 'Invalid record_kind: %. Must be individual_tree, grove, ecology_node, or cultural_site', NEW.record_kind;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_research_tree_record_kind ON public.research_trees;
CREATE TRIGGER trg_validate_research_tree_record_kind
  BEFORE INSERT OR UPDATE ON public.research_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_research_tree_record_kind();

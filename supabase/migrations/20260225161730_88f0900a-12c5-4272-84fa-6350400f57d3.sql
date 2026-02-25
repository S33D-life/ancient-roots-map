-- Add tree_role and impact_weight columns to offerings table (non-destructive)
ALTER TABLE public.offerings 
  ADD COLUMN IF NOT EXISTS tree_role text NOT NULL DEFAULT 'anchored',
  ADD COLUMN IF NOT EXISTS impact_weight numeric NOT NULL DEFAULT 1.0;

-- Create a validation trigger for tree_role values
CREATE OR REPLACE FUNCTION public.validate_offering_tree_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tree_role NOT IN ('stewardship', 'anchored', 'none') THEN
    RAISE EXCEPTION 'Invalid tree_role: %. Must be stewardship, anchored, or none', NEW.tree_role;
  END IF;
  IF NEW.visibility NOT IN ('public', 'tribe', 'circle', 'private') THEN
    RAISE EXCEPTION 'Invalid visibility: %. Must be public, tribe, circle, or private', NEW.visibility;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_offering_tree_role
  BEFORE INSERT OR UPDATE ON public.offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_offering_tree_role();

-- Index for efficient tree_role filtering
CREATE INDEX IF NOT EXISTS idx_offerings_tree_role ON public.offerings (tree_id, tree_role);
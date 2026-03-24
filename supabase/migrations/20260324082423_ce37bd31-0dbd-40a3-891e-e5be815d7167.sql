
-- Add status and shared_with columns to the existing tree_wishlist table
-- This evolves it into the Dream Tree Journey Layer without breaking existing data

ALTER TABLE public.tree_wishlist
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'dreamed',
  ADD COLUMN IF NOT EXISTS shared_with uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

-- Validation trigger for dream tree status
CREATE OR REPLACE FUNCTION public.validate_dream_tree_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('dreamed', 'planned', 'visited') THEN
    RAISE EXCEPTION 'Invalid dream tree status: %. Must be dreamed, planned, or visited', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_dream_tree_status_trigger
  BEFORE INSERT OR UPDATE ON public.tree_wishlist
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dream_tree_status();

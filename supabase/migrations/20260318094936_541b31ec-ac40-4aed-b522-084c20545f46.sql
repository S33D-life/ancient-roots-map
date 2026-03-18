
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS photo_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS photo_original_url text,
  ADD COLUMN IF NOT EXISTS photo_processed_url text,
  ADD COLUMN IF NOT EXISTS photo_thumb_url text,
  ADD COLUMN IF NOT EXISTS photo_error text;

CREATE OR REPLACE FUNCTION public.validate_tree_photo_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.photo_status NOT IN ('none', 'pending', 'processing', 'ready', 'failed') THEN
    RAISE EXCEPTION 'Invalid photo_status: %', NEW.photo_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_photo_status
  BEFORE INSERT OR UPDATE ON public.trees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tree_photo_status();

-- Add photos array (up to 3) to offerings, backfilled from existing media_url
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- Backfill: any existing photo offering with a media_url becomes a 1-photo array
UPDATE public.offerings
SET photos = ARRAY[media_url]
WHERE media_url IS NOT NULL
  AND (photos IS NULL OR array_length(photos, 1) IS NULL);

-- Enforce max 3 photos (validation trigger so it stays mutable & clear)
CREATE OR REPLACE FUNCTION public.validate_offering_photos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 3 THEN
    RAISE EXCEPTION 'An offering can have at most 3 photos (got %).', array_length(NEW.photos, 1);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_offering_photos ON public.offerings;
CREATE TRIGGER trg_validate_offering_photos
  BEFORE INSERT OR UPDATE ON public.offerings
  FOR EACH ROW EXECUTE FUNCTION public.validate_offering_photos();
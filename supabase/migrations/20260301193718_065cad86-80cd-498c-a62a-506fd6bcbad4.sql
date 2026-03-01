
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS quote_text TEXT,
  ADD COLUMN IF NOT EXISTS quote_author TEXT,
  ADD COLUMN IF NOT EXISTS quote_source TEXT;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_offering_quote()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $func$
BEGIN
  -- If quote_text is empty/whitespace, null out all quote fields
  IF NEW.quote_text IS NOT NULL AND trim(NEW.quote_text) = '' THEN
    NEW.quote_text := NULL;
    NEW.quote_author := NULL;
    NEW.quote_source := NULL;
  END IF;
  -- Enforce length limits
  IF NEW.quote_text IS NOT NULL AND length(NEW.quote_text) > 500 THEN
    RAISE EXCEPTION 'quote_text too long (max 500 chars)';
  END IF;
  IF NEW.quote_author IS NOT NULL AND length(NEW.quote_author) > 120 THEN
    RAISE EXCEPTION 'quote_author too long (max 120 chars)';
  END IF;
  IF NEW.quote_source IS NOT NULL AND length(NEW.quote_source) > 200 THEN
    RAISE EXCEPTION 'quote_source too long (max 200 chars)';
  END IF;
  -- If no text, clear author/source
  IF NEW.quote_text IS NULL THEN
    NEW.quote_author := NULL;
    NEW.quote_source := NULL;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_validate_offering_quote ON public.offerings;
CREATE TRIGGER trg_validate_offering_quote
  BEFORE INSERT OR UPDATE ON public.offerings
  FOR EACH ROW EXECUTE FUNCTION public.validate_offering_quote();

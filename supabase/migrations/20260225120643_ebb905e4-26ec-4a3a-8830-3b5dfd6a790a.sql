
-- UK Churchyards table
CREATE TABLE public.uk_churchyards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name text NOT NULL,
  denomination text,
  address text,
  latitude numeric,
  longitude numeric,
  what3words text,
  region text NOT NULL DEFAULT 'England',
  trees_mapped_count integer NOT NULL DEFAULT 0,
  oldest_tree_estimate integer,
  last_mapped_at timestamptz,
  verified boolean NOT NULL DEFAULT false,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_uk_churchyards_region ON public.uk_churchyards(region);
CREATE INDEX idx_uk_churchyards_verified ON public.uk_churchyards(verified);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_uk_churchyard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.region NOT IN ('England', 'Scotland', 'Wales', 'Northern Ireland') THEN
    RAISE EXCEPTION 'Invalid region: %. Must be England, Scotland, Wales, or Northern Ireland', NEW.region;
  END IF;
  IF NEW.church_name IS NOT NULL AND length(NEW.church_name) > 500 THEN
    RAISE EXCEPTION 'church_name too long (max 500 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_uk_churchyard_trigger
  BEFORE INSERT OR UPDATE ON public.uk_churchyards
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_uk_churchyard();

-- RLS
ALTER TABLE public.uk_churchyards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Churchyards are publicly readable"
  ON public.uk_churchyards FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can submit churchyards"
  ON public.uk_churchyards FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Curators can update churchyards"
  ON public.uk_churchyards FOR UPDATE
  USING (has_role(auth.uid(), 'curator'::app_role));

-- Add churchyard fields to trees table
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS is_churchyard_tree boolean DEFAULT false;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS linked_churchyard_id uuid REFERENCES public.uk_churchyards(id);

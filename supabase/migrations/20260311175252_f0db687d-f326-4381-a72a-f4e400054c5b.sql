
-- Harvest Listings table for Guardian Harvest Exchange
CREATE TABLE public.harvest_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  
  -- Produce info
  produce_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'fruit',
  photos TEXT[] DEFAULT '{}',
  
  -- Availability
  availability_type TEXT NOT NULL DEFAULT 'information',
  status TEXT NOT NULL DEFAULT 'upcoming',
  harvest_month_start SMALLINT,
  harvest_month_end SMALLINT,
  quantity_note TEXT,
  price_note TEXT,
  
  -- Location
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pickup_instructions TEXT,
  shipping_available BOOLEAN DEFAULT false,
  
  -- Contact
  contact_method TEXT,
  external_link TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_harvest_listing()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category NOT IN ('fruit', 'nut', 'seed', 'leaf', 'bark', 'resin', 'flower', 'bean', 'oil', 'honey', 'other') THEN
    RAISE EXCEPTION 'Invalid category: %', NEW.category;
  END IF;
  IF NEW.availability_type NOT IN ('for_sale', 'for_exchange', 'free_collection', 'information') THEN
    RAISE EXCEPTION 'Invalid availability_type: %', NEW.availability_type;
  END IF;
  IF NEW.status NOT IN ('upcoming', 'available', 'finished') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.harvest_month_start IS NOT NULL AND (NEW.harvest_month_start < 1 OR NEW.harvest_month_start > 12) THEN
    RAISE EXCEPTION 'harvest_month_start must be 1-12';
  END IF;
  IF NEW.harvest_month_end IS NOT NULL AND (NEW.harvest_month_end < 1 OR NEW.harvest_month_end > 12) THEN
    RAISE EXCEPTION 'harvest_month_end must be 1-12';
  END IF;
  IF NEW.produce_name IS NOT NULL AND length(NEW.produce_name) > 200 THEN
    RAISE EXCEPTION 'produce_name too long (max 200 chars)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_harvest_listing
  BEFORE INSERT OR UPDATE ON public.harvest_listings
  FOR EACH ROW EXECUTE FUNCTION public.validate_harvest_listing();

-- RLS
ALTER TABLE public.harvest_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read listings
CREATE POLICY "Anyone can read harvest listings"
  ON public.harvest_listings FOR SELECT
  USING (true);

-- Only the guardian can insert their own listings
CREATE POLICY "Guardians can create own listings"
  ON public.harvest_listings FOR INSERT
  TO authenticated
  WITH CHECK (guardian_id = auth.uid());

-- Only the guardian can update their own listings
CREATE POLICY "Guardians can update own listings"
  ON public.harvest_listings FOR UPDATE
  TO authenticated
  USING (guardian_id = auth.uid())
  WITH CHECK (guardian_id = auth.uid());

-- Only the guardian can delete their own listings
CREATE POLICY "Guardians can delete own listings"
  ON public.harvest_listings FOR DELETE
  TO authenticated
  USING (guardian_id = auth.uid());

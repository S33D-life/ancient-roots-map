-- Step 1: Add columns to greenhouse_plants
ALTER TABLE public.greenhouse_plants
  ADD COLUMN IF NOT EXISTS plant_type TEXT NOT NULL DEFAULT 'houseplant',
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'growing',
  ADD COLUMN IF NOT EXISTS origin_tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin_grove_id UUID REFERENCES public.groves(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seed_source TEXT,
  ADD COLUMN IF NOT EXISTS lineage_story TEXT,
  ADD COLUMN IF NOT EXISTS target_grove_id UUID REFERENCES public.groves(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS planted_tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS planted_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Validation trigger
CREATE OR REPLACE FUNCTION public.validate_greenhouse_plant()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.plant_type NOT IN ('houseplant', 'sapling', 'cutting', 'seedling') THEN
    RAISE EXCEPTION 'Invalid plant_type: %', NEW.plant_type;
  END IF;
  IF NEW.lifecycle_stage NOT IN ('seed', 'seedling', 'sapling', 'growing', 'ready_to_plant', 'planted') THEN
    RAISE EXCEPTION 'Invalid lifecycle_stage: %', NEW.lifecycle_stage;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_greenhouse_plant ON public.greenhouse_plants;
CREATE TRIGGER trg_validate_greenhouse_plant
  BEFORE INSERT OR UPDATE ON public.greenhouse_plants
  FOR EACH ROW EXECUTE FUNCTION public.validate_greenhouse_plant();

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS idx_greenhouse_plants_grove ON public.greenhouse_plants(origin_grove_id) WHERE origin_grove_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_greenhouse_plants_target_grove ON public.greenhouse_plants(target_grove_id) WHERE target_grove_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_greenhouse_plants_type ON public.greenhouse_plants(plant_type) WHERE plant_type != 'houseplant';

-- Step 4: Update shared plants RPC
DROP FUNCTION IF EXISTS public.get_shared_plants(integer);

CREATE FUNCTION public.get_shared_plants(result_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, name text, species text, photo_url text, created_at timestamp with time zone,
              plant_type text, lifecycle_stage text, seed_source text, lineage_story text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT gp.id, gp.name, gp.species, gp.photo_url, gp.created_at,
         gp.plant_type, gp.lifecycle_stage, gp.seed_source, gp.lineage_story
  FROM public.greenhouse_plants gp
  WHERE gp.is_shared = true
  ORDER BY gp.created_at DESC
  LIMIT result_limit;
$$;
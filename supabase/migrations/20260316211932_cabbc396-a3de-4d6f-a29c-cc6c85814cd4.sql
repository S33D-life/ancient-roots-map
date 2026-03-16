
-- Groves table
CREATE TABLE public.groves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_type TEXT NOT NULL DEFAULT 'local_grove',
  grove_name TEXT,
  grove_status TEXT NOT NULL DEFAULT 'candidate',
  grove_strength TEXT NOT NULL DEFAULT 'seed',
  grove_strength_score NUMERIC NOT NULL DEFAULT 0,
  species_common TEXT,
  species_scientific TEXT,
  tree_count INTEGER NOT NULL DEFAULT 0,
  verified_tree_count INTEGER NOT NULL DEFAULT 0,
  visit_count INTEGER NOT NULL DEFAULT 0,
  offering_count INTEGER NOT NULL DEFAULT 0,
  whisper_count INTEGER NOT NULL DEFAULT 0,
  center_latitude NUMERIC,
  center_longitude NUMERIC,
  radius_m NUMERIC,
  compactness_score NUMERIC DEFAULT 0,
  formation_method TEXT NOT NULL DEFAULT 'auto_detected',
  blessed_by UUID,
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grove-tree junction
CREATE TABLE public.grove_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id UUID REFERENCES public.groves(id) ON DELETE CASCADE NOT NULL,
  tree_id UUID NOT NULL,
  tree_source TEXT NOT NULL DEFAULT 'trees',
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(grove_id, tree_id, tree_source)
);

-- Indexes
CREATE INDEX idx_groves_type ON public.groves(grove_type);
CREATE INDEX idx_groves_status ON public.groves(grove_status);
CREATE INDEX idx_groves_species ON public.groves(species_scientific);
CREATE INDEX idx_groves_location ON public.groves(center_latitude, center_longitude);
CREATE INDEX idx_grove_trees_grove ON public.grove_trees(grove_id);
CREATE INDEX idx_grove_trees_tree ON public.grove_trees(tree_id);

-- RLS
ALTER TABLE public.groves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grove_trees ENABLE ROW LEVEL SECURITY;

-- Public read for groves
CREATE POLICY "Anyone can view groves"
  ON public.groves FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can create groves
CREATE POLICY "Authenticated users can create groves"
  ON public.groves FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only blessed_by user can update their grove
CREATE POLICY "Grove creator can update"
  ON public.groves FOR UPDATE
  TO authenticated
  USING (blessed_by = auth.uid());

-- Public read for grove_trees
CREATE POLICY "Anyone can view grove trees"
  ON public.grove_trees FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated can add trees to groves
CREATE POLICY "Authenticated can add grove trees"
  ON public.grove_trees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_grove()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.grove_type NOT IN ('local_grove', 'species_grove') THEN
    RAISE EXCEPTION 'Invalid grove_type: %', NEW.grove_type;
  END IF;
  IF NEW.grove_status NOT IN ('candidate', 'forming', 'blessed', 'active', 'dormant') THEN
    RAISE EXCEPTION 'Invalid grove_status: %', NEW.grove_status;
  END IF;
  IF NEW.grove_strength NOT IN ('seed', 'forming', 'rooted', 'thriving', 'ancient_grove') THEN
    RAISE EXCEPTION 'Invalid grove_strength: %', NEW.grove_strength;
  END IF;
  IF NEW.formation_method NOT IN ('auto_detected', 'community_blessed', 'manually_named') THEN
    RAISE EXCEPTION 'Invalid formation_method: %', NEW.formation_method;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_grove
  BEFORE INSERT OR UPDATE ON public.groves
  FOR EACH ROW EXECUTE FUNCTION public.validate_grove();

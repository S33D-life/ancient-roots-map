
-- Mycelial Pathways — connects groves into living ecological corridors
CREATE TABLE public.mycelial_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_type text NOT NULL DEFAULT 'local',
  pathway_name text,
  pathway_status text NOT NULL DEFAULT 'candidate',
  pathway_strength text NOT NULL DEFAULT 'seed',
  pathway_strength_score integer NOT NULL DEFAULT 0,
  grove_ids uuid[] NOT NULL DEFAULT '{}',
  species_common text,
  species_scientific text,
  distance_km numeric,
  formation_method text NOT NULL DEFAULT 'auto_detected',
  start_lat numeric,
  start_lng numeric,
  end_lat numeric,
  end_lng numeric,
  center_lat numeric,
  center_lng numeric,
  tree_count integer DEFAULT 0,
  visit_count integer DEFAULT 0,
  offering_count integer DEFAULT 0,
  blessed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table for pathway-grove relationships
CREATE TABLE public.pathway_groves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid REFERENCES public.mycelial_pathways(id) ON DELETE CASCADE NOT NULL,
  grove_id uuid REFERENCES public.groves(id) ON DELETE CASCADE NOT NULL,
  position_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, grove_id)
);

-- RLS
ALTER TABLE public.mycelial_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_groves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pathways" ON public.mycelial_pathways FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert pathways" ON public.mycelial_pathways FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pathways" ON public.mycelial_pathways FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone can read pathway_groves" ON public.pathway_groves FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert pathway_groves" ON public.pathway_groves FOR INSERT TO authenticated WITH CHECK (true);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_mycelial_pathway()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.pathway_type NOT IN ('local', 'species', 'migration', 'story', 'restoration') THEN
    RAISE EXCEPTION 'Invalid pathway_type: %', NEW.pathway_type;
  END IF;
  IF NEW.pathway_status NOT IN ('candidate', 'forming', 'blessed', 'active', 'dormant') THEN
    RAISE EXCEPTION 'Invalid pathway_status: %', NEW.pathway_status;
  END IF;
  IF NEW.pathway_strength NOT IN ('seed', 'forming', 'rooted', 'thriving', 'ancient_corridor') THEN
    RAISE EXCEPTION 'Invalid pathway_strength: %', NEW.pathway_strength;
  END IF;
  IF NEW.formation_method NOT IN ('auto_detected', 'community_blessed', 'wanderer_path', 'manually_named') THEN
    RAISE EXCEPTION 'Invalid formation_method: %', NEW.formation_method;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_mycelial_pathway
  BEFORE INSERT OR UPDATE ON public.mycelial_pathways
  FOR EACH ROW EXECUTE FUNCTION public.validate_mycelial_pathway();

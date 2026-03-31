
-- Location refinement proposals table
CREATE TABLE public.tree_location_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy_m NUMERIC,
  source_type TEXT NOT NULL DEFAULT 'manual_refinement',
  at_trunk BOOLEAN NOT NULL DEFAULT false,
  trunk_photo_url TEXT,
  supporting_photo_url TEXT,
  note TEXT,
  checkin_id UUID REFERENCES public.tree_checkins(id) ON DELETE SET NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_location_refinement()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.source_type NOT IN ('checkin_passive', 'manual_refinement') THEN
    RAISE EXCEPTION 'Invalid source_type: %', NEW.source_type;
  END IF;
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.note IS NOT NULL AND length(NEW.note) > 1000 THEN
    RAISE EXCEPTION 'note too long (max 1000 chars)';
  END IF;
  IF NEW.latitude < -90 OR NEW.latitude > 90 THEN
    RAISE EXCEPTION 'Invalid latitude';
  END IF;
  IF NEW.longitude < -180 OR NEW.longitude > 180 THEN
    RAISE EXCEPTION 'Invalid longitude';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tree_location_refinement
  BEFORE INSERT OR UPDATE ON public.tree_location_refinements
  FOR EACH ROW EXECUTE FUNCTION public.validate_tree_location_refinement();

-- Indexes
CREATE INDEX idx_tree_location_refinements_tree ON public.tree_location_refinements(tree_id);
CREATE INDEX idx_tree_location_refinements_status ON public.tree_location_refinements(status);

-- RLS
ALTER TABLE public.tree_location_refinements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own refinements"
  ON public.tree_location_refinements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own refinements"
  ON public.tree_location_refinements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Curators can view all refinements"
  ON public.tree_location_refinements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'curator'));

CREATE POLICY "Curators can update refinements"
  ON public.tree_location_refinements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'curator'));

-- Add location_confidence column to trees table
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS location_confidence TEXT DEFAULT 'approximate';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS refinement_count INTEGER DEFAULT 0;

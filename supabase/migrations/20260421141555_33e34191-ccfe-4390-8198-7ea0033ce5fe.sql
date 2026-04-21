-- Step 2 of 2: create gardens table, link trees, RLS, triggers.

-- Gardens table
CREATE TABLE IF NOT EXISTS public.gardens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  open_days TEXT,
  notes TEXT,
  cover_image_url TEXT,
  tree_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gardens_location ON public.gardens (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gardens_created_by ON public.gardens (created_by);
CREATE INDEX IF NOT EXISTS idx_gardens_is_public ON public.gardens (is_public) WHERE is_public = true;

-- Link trees -> gardens (nullable, optional)
ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS garden_id UUID REFERENCES public.gardens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trees_garden_id ON public.trees (garden_id) WHERE garden_id IS NOT NULL;

-- RLS
ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public gardens are viewable by everyone"
  ON public.gardens FOR SELECT
  USING (is_public = true);

CREATE POLICY "Creators can view their own gardens"
  ON public.gardens FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Curators can view all gardens"
  ON public.gardens FOR SELECT
  USING (public.has_role(auth.uid(), 'curator'));

-- Invite-only creation: curator OR garden_steward, and must set themselves as creator
CREATE POLICY "Curators and garden stewards can create gardens"
  ON public.gardens FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.has_role(auth.uid(), 'curator')
      OR public.has_role(auth.uid(), 'garden_steward')
    )
  );

CREATE POLICY "Creators can update their own gardens"
  ON public.gardens FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Curators can update all gardens"
  ON public.gardens FOR UPDATE
  USING (public.has_role(auth.uid(), 'curator'));

CREATE POLICY "Creators and curators can delete gardens"
  ON public.gardens FOR DELETE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));

-- Auto-touch updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_gardens_set_updated_at
    BEFORE UPDATE ON public.gardens
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Maintain gardens.tree_count automatically when trees are linked/unlinked
CREATE OR REPLACE FUNCTION public.refresh_garden_tree_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.garden_id IS NOT NULL THEN
    UPDATE public.gardens
       SET tree_count = tree_count + 1
     WHERE id = NEW.garden_id;
  ELSIF TG_OP = 'DELETE' AND OLD.garden_id IS NOT NULL THEN
    UPDATE public.gardens
       SET tree_count = GREATEST(tree_count - 1, 0)
     WHERE id = OLD.garden_id;
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.garden_id, '00000000-0000-0000-0000-000000000000'::uuid)
                            IS DISTINCT FROM COALESCE(OLD.garden_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    IF OLD.garden_id IS NOT NULL THEN
      UPDATE public.gardens
         SET tree_count = GREATEST(tree_count - 1, 0)
       WHERE id = OLD.garden_id;
    END IF;
    IF NEW.garden_id IS NOT NULL THEN
      UPDATE public.gardens
         SET tree_count = tree_count + 1
       WHERE id = NEW.garden_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_trees_garden_count
    AFTER INSERT OR UPDATE OR DELETE ON public.trees
    FOR EACH ROW EXECUTE FUNCTION public.refresh_garden_tree_count();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
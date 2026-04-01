CREATE TABLE IF NOT EXISTS public.seed_life_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  latin_name TEXT,
  origin_label TEXT,
  species_group TEXT NOT NULL,
  use_category TEXT NOT NULL,
  region_label TEXT,
  description TEXT,
  image_path TEXT,
  image_thumb_path TEXT,
  image_alt TEXT,
  image_credit TEXT,
  seed_size TEXT,
  germination_notes TEXT,
  storage_notes TEXT,
  growth_journey JSONB NOT NULL DEFAULT '[]'::jsonb,
  relationship_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  validation_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seed_life_entries_status_visibility
  ON public.seed_life_entries (status, is_hidden, is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seed_life_entries_species_group
  ON public.seed_life_entries (species_group);
CREATE INDEX IF NOT EXISTS idx_seed_life_entries_use_category
  ON public.seed_life_entries (use_category);
CREATE INDEX IF NOT EXISTS idx_seed_life_entries_region_label
  ON public.seed_life_entries (region_label);
CREATE INDEX IF NOT EXISTS idx_seed_life_entries_common_name_search
  ON public.seed_life_entries (common_name);

CREATE TABLE IF NOT EXISTS public.seed_life_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES public.seed_life_entries(id) ON DELETE CASCADE,
  library_id UUID REFERENCES public.seed_libraries(id) ON DELETE SET NULL,
  pod_name TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'held_by',
  note TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seed_life_guardians_seed_id
  ON public.seed_life_guardians (seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_life_guardians_library_id
  ON public.seed_life_guardians (library_id);

CREATE TABLE IF NOT EXISTS public.seed_life_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES public.seed_life_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  cultivation_stage TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  validation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seed_life_notes_seed_id
  ON public.seed_life_notes (seed_id, is_hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS public.seed_life_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  user_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_seed_life_validations_target
  ON public.seed_life_validations (target_type, target_id);

ALTER TABLE public.seed_life_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_life_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_life_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_life_validations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.recompute_seed_life_validation_totals(_target_type TEXT, _target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.seed_life_validations
  WHERE target_type = _target_type
    AND target_id = _target_id;

  IF _target_type = 'seed' THEN
    UPDATE public.seed_life_entries
    SET
      validation_count = v_count,
      verification_status = CASE
        WHEN verification_status = 'curator_validated' THEN verification_status
        WHEN v_count >= 3 THEN 'community_validated'
        ELSE 'unverified'
      END,
      updated_at = now()
    WHERE id = _target_id;
  ELSIF _target_type = 'note' THEN
    UPDATE public.seed_life_notes
    SET
      validation_count = v_count,
      updated_at = now()
    WHERE id = _target_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_seed_life_validation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.recompute_seed_life_validation_totals(OLD.target_type, OLD.target_id);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recompute_seed_life_validation_totals(NEW.target_type, NEW.target_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS seed_life_validation_change_trigger ON public.seed_life_validations;
CREATE TRIGGER seed_life_validation_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.seed_life_validations
FOR EACH ROW
EXECUTE FUNCTION public.handle_seed_life_validation_change();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_seed_life_entries_updated_at ON public.seed_life_entries;
    CREATE TRIGGER update_seed_life_entries_updated_at
    BEFORE UPDATE ON public.seed_life_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_seed_life_guardians_updated_at ON public.seed_life_guardians;
    CREATE TRIGGER update_seed_life_guardians_updated_at
    BEFORE UPDATE ON public.seed_life_guardians
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_seed_life_notes_updated_at ON public.seed_life_notes;
    CREATE TRIGGER update_seed_life_notes_updated_at
    BEFORE UPDATE ON public.seed_life_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can view published seed life entries" ON public.seed_life_entries;
CREATE POLICY "Anyone can view published seed life entries"
ON public.seed_life_entries
FOR SELECT
USING (status = 'published' AND is_hidden = false);

DROP POLICY IF EXISTS "Authenticated users can submit seed life entries" ON public.seed_life_entries;
CREATE POLICY "Authenticated users can submit seed life entries"
ON public.seed_life_entries
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Contributors can update own pending seed life entries" ON public.seed_life_entries;
CREATE POLICY "Contributors can update own pending seed life entries"
ON public.seed_life_entries
FOR UPDATE
TO authenticated
USING (submitted_by = auth.uid() AND status = 'pending')
WITH CHECK (submitted_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Curators can moderate seed life entries" ON public.seed_life_entries;
CREATE POLICY "Curators can moderate seed life entries"
ON public.seed_life_entries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (true);

DROP POLICY IF EXISTS "Contributors can delete own pending seed life entries" ON public.seed_life_entries;
CREATE POLICY "Contributors can delete own pending seed life entries"
ON public.seed_life_entries
FOR DELETE
TO authenticated
USING (submitted_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Curators can delete seed life entries" ON public.seed_life_entries;
CREATE POLICY "Curators can delete seed life entries"
ON public.seed_life_entries
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Anyone can view guardians for visible seeds" ON public.seed_life_guardians;
CREATE POLICY "Anyone can view guardians for visible seeds"
ON public.seed_life_guardians
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.seed_life_entries e
    WHERE e.id = seed_id
      AND e.status = 'published'
      AND e.is_hidden = false
  )
);

DROP POLICY IF EXISTS "Authenticated users can add guardians" ON public.seed_life_guardians;
CREATE POLICY "Authenticated users can add guardians"
ON public.seed_life_guardians
FOR INSERT
TO authenticated
WITH CHECK (
  added_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.seed_life_entries e
    WHERE e.id = seed_id
      AND (
        e.submitted_by = auth.uid()
        OR public.has_role(auth.uid(), 'curator')
        OR public.has_role(auth.uid(), 'keeper')
      )
  )
);

DROP POLICY IF EXISTS "Users can update own guardians" ON public.seed_life_guardians;
CREATE POLICY "Users can update own guardians"
ON public.seed_life_guardians
FOR UPDATE
TO authenticated
USING (added_by = auth.uid())
WITH CHECK (added_by = auth.uid());

DROP POLICY IF EXISTS "Curators can moderate guardians" ON public.seed_life_guardians;
CREATE POLICY "Curators can moderate guardians"
ON public.seed_life_guardians
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own guardians" ON public.seed_life_guardians;
CREATE POLICY "Users can delete own guardians"
ON public.seed_life_guardians
FOR DELETE
TO authenticated
USING (added_by = auth.uid());

DROP POLICY IF EXISTS "Curators can delete guardians" ON public.seed_life_guardians;
CREATE POLICY "Curators can delete guardians"
ON public.seed_life_guardians
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Anyone can view visible seed notes" ON public.seed_life_notes;
CREATE POLICY "Anyone can view visible seed notes"
ON public.seed_life_notes
FOR SELECT
USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1
    FROM public.seed_life_entries e
    WHERE e.id = seed_id
      AND e.status = 'published'
      AND e.is_hidden = false
  )
);

DROP POLICY IF EXISTS "Authenticated users can add seed notes" ON public.seed_life_notes;
CREATE POLICY "Authenticated users can add seed notes"
ON public.seed_life_notes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.seed_life_entries e
    WHERE e.id = seed_id
      AND e.is_hidden = false
  )
);

DROP POLICY IF EXISTS "Users can update own seed notes" ON public.seed_life_notes;
CREATE POLICY "Users can update own seed notes"
ON public.seed_life_notes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Curators can moderate seed notes" ON public.seed_life_notes;
CREATE POLICY "Curators can moderate seed notes"
ON public.seed_life_notes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'))
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own seed notes" ON public.seed_life_notes;
CREATE POLICY "Users can delete own seed notes"
ON public.seed_life_notes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Curators can delete seed notes" ON public.seed_life_notes;
CREATE POLICY "Curators can delete seed notes"
ON public.seed_life_notes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

DROP POLICY IF EXISTS "Anyone can view seed life validations" ON public.seed_life_validations;
CREATE POLICY "Anyone can view seed life validations"
ON public.seed_life_validations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can add validations" ON public.seed_life_validations;
CREATE POLICY "Authenticated users can add validations"
ON public.seed_life_validations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND target_type IN ('seed', 'note')
);

DROP POLICY IF EXISTS "Users can delete own validations" ON public.seed_life_validations;
CREATE POLICY "Users can delete own validations"
ON public.seed_life_validations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('seed-life-gallery', 'seed-life-gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view seed life gallery images" ON storage.objects;
CREATE POLICY "Anyone can view seed life gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'seed-life-gallery');

DROP POLICY IF EXISTS "Users can upload own seed life gallery images" ON storage.objects;
CREATE POLICY "Users can upload own seed life gallery images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seed-life-gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own seed life gallery images" ON storage.objects;
CREATE POLICY "Users can update own seed life gallery images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seed-life-gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'seed-life-gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own seed life gallery images" ON storage.objects;
CREATE POLICY "Users can delete own seed life gallery images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'seed-life-gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
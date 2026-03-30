
-- Seed Libraries directory
CREATE TABLE public.seed_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  website TEXT,
  contact_link TEXT,
  library_type TEXT NOT NULL DEFAULT 'seed_library',
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  verification_count INTEGER NOT NULL DEFAULT 0,
  testimonial_count INTEGER NOT NULL DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  last_community_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_seed_library()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.library_type NOT IN ('seed_library', 'seed_bank', 'seed_swap', 'community_seed_initiative') THEN
    RAISE EXCEPTION 'Invalid library_type: %', NEW.library_type;
  END IF;
  IF NEW.verification_status NOT IN ('unverified', 'community_verified', 'curator_verified') THEN
    RAISE EXCEPTION 'Invalid verification_status: %', NEW.verification_status;
  END IF;
  IF NEW.status NOT IN ('active', 'inactive', 'pending', 'hidden') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF length(NEW.name) > 300 THEN
    RAISE EXCEPTION 'name too long (max 300 chars)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_seed_library
  BEFORE INSERT OR UPDATE ON public.seed_libraries
  FOR EACH ROW EXECUTE FUNCTION public.validate_seed_library();

-- Verifications
CREATE TABLE public.seed_library_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.seed_libraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  verification_type TEXT NOT NULL,
  note TEXT,
  verified_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(library_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_seed_library_verification()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.verification_type NOT IN ('visited', 'used', 'run') THEN
    RAISE EXCEPTION 'Invalid verification_type: %', NEW.verification_type;
  END IF;
  IF NEW.note IS NOT NULL AND length(NEW.note) > 1000 THEN
    RAISE EXCEPTION 'note too long (max 1000 chars)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_seed_library_verification
  BEFORE INSERT OR UPDATE ON public.seed_library_verifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_seed_library_verification();

-- Auto-update verification count and community_verified status
CREATE OR REPLACE FUNCTION public.update_seed_library_verification_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_count INTEGER;
  v_lib_id UUID;
BEGIN
  v_lib_id := COALESCE(NEW.library_id, OLD.library_id);
  SELECT COUNT(*) INTO v_count FROM seed_library_verifications WHERE library_id = v_lib_id;
  UPDATE seed_libraries SET
    verification_count = v_count,
    verification_status = CASE
      WHEN verification_status = 'curator_verified' THEN 'curator_verified'
      WHEN v_count >= 3 THEN 'community_verified'
      ELSE 'unverified'
    END,
    last_community_activity = now(),
    updated_at = now()
  WHERE id = v_lib_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_verification_count
  AFTER INSERT OR DELETE ON public.seed_library_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_seed_library_verification_count();

-- Testimonials
CREATE TABLE public.seed_library_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.seed_libraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_seed_library_testimonial()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'content too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_seed_library_testimonial
  BEFORE INSERT OR UPDATE ON public.seed_library_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.validate_seed_library_testimonial();

-- Auto-update testimonial count
CREATE OR REPLACE FUNCTION public.update_seed_library_testimonial_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_count INTEGER;
  v_lib_id UUID;
BEGIN
  v_lib_id := COALESCE(NEW.library_id, OLD.library_id);
  SELECT COUNT(*) INTO v_count FROM seed_library_testimonials WHERE library_id = v_lib_id AND is_hidden = false;
  UPDATE seed_libraries SET
    testimonial_count = v_count,
    last_community_activity = now(),
    updated_at = now()
  WHERE id = v_lib_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_testimonial_count
  AFTER INSERT OR UPDATE OR DELETE ON public.seed_library_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_seed_library_testimonial_count();

-- RLS
ALTER TABLE public.seed_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_library_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_library_testimonials ENABLE ROW LEVEL SECURITY;

-- seed_libraries: public read (non-hidden), authenticated insert, curator update
CREATE POLICY "Anyone can view active seed libraries"
  ON public.seed_libraries FOR SELECT
  USING (is_hidden = false AND status != 'hidden');

CREATE POLICY "Authenticated users can submit seed libraries"
  ON public.seed_libraries FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Curators can update seed libraries"
  ON public.seed_libraries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

-- verifications: public read, authenticated insert own
CREATE POLICY "Anyone can view verifications"
  ON public.seed_library_verifications FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add verifications"
  ON public.seed_library_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own verifications"
  ON public.seed_library_verifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- testimonials: public read (non-hidden), authenticated insert own
CREATE POLICY "Anyone can view visible testimonials"
  ON public.seed_library_testimonials FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "Authenticated users can add testimonials"
  ON public.seed_library_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own testimonials"
  ON public.seed_library_testimonials FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Curators can update any testimonial"
  ON public.seed_library_testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'curator') OR public.has_role(auth.uid(), 'keeper'));

-- Indexes
CREATE INDEX idx_seed_libraries_country ON public.seed_libraries(country);
CREATE INDEX idx_seed_libraries_type ON public.seed_libraries(library_type);
CREATE INDEX idx_seed_libraries_status ON public.seed_libraries(verification_status);
CREATE INDEX idx_seed_libraries_slug ON public.seed_libraries(slug);
CREATE INDEX idx_seed_library_verifications_library ON public.seed_library_verifications(library_id);
CREATE INDEX idx_seed_library_testimonials_library ON public.seed_library_testimonials(library_id);

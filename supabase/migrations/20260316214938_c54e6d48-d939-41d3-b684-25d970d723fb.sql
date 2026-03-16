-- Grove Guardians table
CREATE TABLE public.grove_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id UUID NOT NULL REFERENCES public.groves(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guardian',
  contribution_score INTEGER NOT NULL DEFAULT 0,
  visits_count INTEGER NOT NULL DEFAULT 0,
  offerings_count INTEGER NOT NULL DEFAULT 0,
  stories_count INTEGER NOT NULL DEFAULT 0,
  trees_added INTEGER NOT NULL DEFAULT 0,
  since_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grove_id, user_id)
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_grove_guardian()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.role NOT IN ('founder', 'guardian', 'steward', 'story_keeper') THEN
    RAISE EXCEPTION 'Invalid grove guardian role: %', NEW.role;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_grove_guardian
  BEFORE INSERT OR UPDATE ON public.grove_guardians
  FOR EACH ROW EXECUTE FUNCTION public.validate_grove_guardian();

-- Indexes
CREATE INDEX idx_grove_guardians_grove ON public.grove_guardians(grove_id);
CREATE INDEX idx_grove_guardians_user ON public.grove_guardians(user_id);

-- RLS
ALTER TABLE public.grove_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grove guardians"
  ON public.grove_guardians FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Authenticated users can become guardians"
  ON public.grove_guardians FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guardians can update own record"
  ON public.grove_guardians FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Guardians can remove themselves"
  ON public.grove_guardians FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add guardian_count to groves
ALTER TABLE public.groves ADD COLUMN IF NOT EXISTS guardian_count INTEGER NOT NULL DEFAULT 0;

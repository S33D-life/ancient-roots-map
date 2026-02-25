
-- Tree Check-Ins table
CREATE TABLE public.tree_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id),
  user_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  season_stage text NOT NULL DEFAULT 'other',
  weather text,
  reflection text,
  media_url text,
  mood_score smallint,
  canopy_proof boolean NOT NULL DEFAULT false,
  birdsong_heard boolean DEFAULT false,
  fungi_present boolean DEFAULT false,
  health_notes text,
  minted_status text NOT NULL DEFAULT 'unminted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tree_checkins_tree_id ON public.tree_checkins(tree_id);
CREATE INDEX idx_tree_checkins_user_id ON public.tree_checkins(user_id);
CREATE INDEX idx_tree_checkins_date ON public.tree_checkins(checked_in_at);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_tree_checkin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.season_stage NOT IN ('bud', 'leaf', 'blossom', 'fruit', 'bare', 'other') THEN
    RAISE EXCEPTION 'Invalid season_stage: %', NEW.season_stage;
  END IF;
  IF NEW.minted_status NOT IN ('unminted', 'eligible', 'minted') THEN
    RAISE EXCEPTION 'Invalid minted_status: %', NEW.minted_status;
  END IF;
  IF NEW.mood_score IS NOT NULL AND (NEW.mood_score < 1 OR NEW.mood_score > 5) THEN
    RAISE EXCEPTION 'mood_score must be 1-5';
  END IF;
  IF NEW.reflection IS NOT NULL AND length(NEW.reflection) > 2000 THEN
    RAISE EXCEPTION 'reflection too long (max 2000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_tree_checkin_trigger
  BEFORE INSERT OR UPDATE ON public.tree_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tree_checkin();

-- RLS
ALTER TABLE public.tree_checkins ENABLE ROW LEVEL SECURITY;

-- Anyone can view check-ins (for timeline/community features)
CREATE POLICY "Check-ins are publicly readable"
  ON public.tree_checkins FOR SELECT
  USING (true);

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins"
  ON public.tree_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users can update own check-ins"
  ON public.tree_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own check-ins
CREATE POLICY "Users can delete own check-ins"
  ON public.tree_checkins FOR DELETE
  USING (auth.uid() = user_id);

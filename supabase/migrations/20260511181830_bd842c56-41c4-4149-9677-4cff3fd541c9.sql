
-- Life Groves: living tree-libraries for life events
CREATE TABLE public.life_groves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  grove_type TEXT NOT NULL DEFAULT 'family',
  grove_title TEXT NOT NULL,
  remembered_or_celebrated_name TEXT,
  relationship_label TEXT,
  tree_name TEXT,
  tree_archetype_species TEXT NOT NULL DEFAULT 'oak',
  tree_species_detail TEXT,
  planting_type TEXT NOT NULL DEFAULT 'symbolic_ethereal_tree',
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  event_date DATE,
  birth_date DATE,
  passing_date DATE,
  story_intro TEXT,
  privacy TEXT NOT NULL DEFAULT 'invite_only',
  planting_package TEXT NOT NULL DEFAULT 'symbolic',
  package_price_pence INTEGER NOT NULL DEFAULT 0,
  hearts_applied INTEGER NOT NULL DEFAULT 0,
  discount_pence INTEGER NOT NULL DEFAULT 0,
  cover_photo_url TEXT,
  generated_tree_image_url TEXT,
  generated_tree_prompt TEXT,
  source_tree_photo_ids JSONB,
  invite_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '') UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_groves_created_by ON public.life_groves(created_by);
CREATE INDEX idx_life_groves_invite_token ON public.life_groves(invite_token);

ALTER TABLE public.life_groves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groves are readable by anyone"
  ON public.life_groves FOR SELECT
  USING (privacy = 'public' OR auth.uid() = created_by);

CREATE POLICY "Owners can insert their own groves"
  ON public.life_groves FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their own groves"
  ON public.life_groves FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete their own groves"
  ON public.life_groves FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER trg_life_groves_updated_at
  BEFORE UPDATE ON public.life_groves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Offerings hung in the branches
CREATE TABLE public.life_grove_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_grove_id UUID NOT NULL REFERENCES public.life_groves(id) ON DELETE CASCADE,
  contributor_user_id UUID,
  contributor_name TEXT NOT NULL,
  contributor_email TEXT,
  offering_type TEXT NOT NULL DEFAULT 'story',
  title TEXT,
  body_text TEXT,
  media_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'family_only',
  memory_position_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_grove_offerings_grove ON public.life_grove_offerings(life_grove_id);

ALTER TABLE public.life_grove_offerings ENABLE ROW LEVEL SECURITY;

-- Public offerings visible if grove is public; family_only visible to grove owner
CREATE POLICY "Read offerings based on grove privacy"
  ON public.life_grove_offerings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.life_groves g
      WHERE g.id = life_grove_id
        AND (
          g.created_by = auth.uid()
          OR (g.privacy = 'public' AND life_grove_offerings.visibility = 'public')
        )
    )
  );

-- Anyone (incl. anon) can leave an offering — invite token validated in app
CREATE POLICY "Anyone can leave an offering"
  ON public.life_grove_offerings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can delete offerings on their grove"
  ON public.life_grove_offerings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.life_groves g
      WHERE g.id = life_grove_id AND g.created_by = auth.uid()
    )
  );

-- Helper RPC: fetch a grove by invite token (bypasses RLS for invite flow)
CREATE OR REPLACE FUNCTION public.get_life_grove_by_invite_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  grove_type TEXT,
  grove_title TEXT,
  remembered_or_celebrated_name TEXT,
  tree_archetype_species TEXT,
  tree_name TEXT,
  story_intro TEXT,
  privacy TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, grove_type, grove_title, remembered_or_celebrated_name,
         tree_archetype_species, tree_name, story_intro, privacy
  FROM public.life_groves
  WHERE invite_token = p_token
  LIMIT 1;
$$;

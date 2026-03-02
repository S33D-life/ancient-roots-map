
-- Calendar Lenses registry
CREATE TABLE public.calendar_lenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  lens_type text NOT NULL DEFAULT 'astronomical',
  is_default boolean NOT NULL DEFAULT false,
  icon text DEFAULT '📅',
  region text,
  lineage text,
  attribution text,
  disclaimer text,
  sources jsonb DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: readable by all authenticated, writable by curators only
ALTER TABLE public.calendar_lenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lenses" ON public.calendar_lenses FOR SELECT USING (true);
CREATE POLICY "Curators manage lenses" ON public.calendar_lenses FOR ALL
  USING (public.has_role(auth.uid(), 'curator'))
  WITH CHECK (public.has_role(auth.uid(), 'curator'));

-- User calendar preferences
CREATE TABLE public.user_calendar_preferences (
  user_id uuid NOT NULL PRIMARY KEY,
  enabled_lens_ids uuid[] NOT NULL DEFAULT '{}',
  primary_lens_id uuid,
  hemisphere text NOT NULL DEFAULT 'north',
  region text,
  label_style text NOT NULL DEFAULT 'plain',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_calendar_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.user_calendar_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_calendar_prefs()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.hemisphere NOT IN ('north', 'south') THEN
    RAISE EXCEPTION 'hemisphere must be north or south';
  END IF;
  IF NEW.label_style NOT IN ('plain', 'poetic') THEN
    RAISE EXCEPTION 'label_style must be plain or poetic';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_calendar_prefs
  BEFORE INSERT OR UPDATE ON public.user_calendar_preferences
  FOR EACH ROW EXECUTE FUNCTION public.validate_calendar_prefs();

-- Seed default lenses
INSERT INTO public.calendar_lenses (slug, name, description, lens_type, is_default, icon, disclaimer) VALUES
  ('astronomical', 'Astronomical', 'Moon phases, solstices, equinoxes, and cross-quarter days.', 'astronomical', true, '🌙', 'Lunar phases are calculated algorithmically and may differ by ±1 day from observed values.'),
  ('seasonal', 'Seasonal & Phenology', 'Bloom windows, seed cycles, and harvest seasons from the Seed Cellar.', 'seasonal', true, '🌸', 'Seasonal data is based on general patterns and may vary by microclimate.'),
  ('mayan', 'Mayan Tzolkin', 'The 260-day sacred calendar of the Maya, showing day signs and trecena numbers.', 'cultural', false, '🐍', 'This lens presents the Tzolkin cycle based on the GMT correlation (584283). Multiple scholarly correlations exist. This is offered as a lens of meaning, not as authoritative cultural practice. We honour the living Maya traditions from which this knowledge originates.');

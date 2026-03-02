
-- The Living Printing Press: published literary works
CREATE TABLE public.press_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  form TEXT NOT NULL DEFAULT 'reflection',
  epigraph TEXT,
  source_book_id UUID REFERENCES public.bookshelf_entries(id) ON DELETE SET NULL,
  season TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_press_work()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.form NOT IN ('reflection', 'letter', 'seasonal_weaving', 'dialogue', 'myth_retold', 'story', 'essay', 'other') THEN
    RAISE EXCEPTION 'Invalid form: %', NEW.form;
  END IF;
  IF NEW.visibility NOT IN ('private', 'circle', 'tribe', 'public') THEN
    RAISE EXCEPTION 'Invalid visibility: %', NEW.visibility;
  END IF;
  IF length(NEW.title) > 300 THEN
    RAISE EXCEPTION 'title too long (max 300 chars)';
  END IF;
  IF length(NEW.body) > 50000 THEN
    RAISE EXCEPTION 'body too long (max 50000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_press_work
  BEFORE INSERT OR UPDATE ON public.press_works
  FOR EACH ROW EXECUTE FUNCTION public.validate_press_work();

-- RLS
ALTER TABLE public.press_works ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Users manage own press works"
  ON public.press_works FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public reads for published works
CREATE POLICY "Public can read published press works"
  ON public.press_works FOR SELECT
  USING (visibility = 'public' AND published_at IS NOT NULL);

-- Index for listing
CREATE INDEX idx_press_works_user ON public.press_works(user_id, created_at DESC);
CREATE INDEX idx_press_works_published ON public.press_works(published_at DESC) WHERE published_at IS NOT NULL AND visibility = 'public';

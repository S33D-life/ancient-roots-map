
-- Chapters: the literary units of a living book
CREATE TABLE public.press_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES public.press_works(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  epigraph TEXT,
  artwork_url TEXT,
  chapter_order SMALLINT NOT NULL DEFAULT 0,
  linked_tree_id UUID REFERENCES public.trees(id) ON DELETE SET NULL,
  linked_bio_region_id TEXT REFERENCES public.bio_regions(id) ON DELETE SET NULL,
  unlock_mode TEXT NOT NULL DEFAULT 'always_available',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_press_chapter()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.unlock_mode NOT IN ('always_available', 'tree_visit_required', 'council_granted') THEN
    RAISE EXCEPTION 'Invalid unlock_mode: %', NEW.unlock_mode;
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

CREATE TRIGGER trg_validate_press_chapter
  BEFORE INSERT OR UPDATE ON public.press_chapters
  FOR EACH ROW EXECUTE FUNCTION public.validate_press_chapter();

-- RLS
ALTER TABLE public.press_chapters ENABLE ROW LEVEL SECURITY;

-- Authors manage chapters of their own works
CREATE POLICY "Authors manage own chapters"
  ON public.press_chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM press_works pw WHERE pw.id = work_id AND pw.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM press_works pw WHERE pw.id = work_id AND pw.user_id = auth.uid()));

-- Public can read published chapters (visibility = public, parent work published)
CREATE POLICY "Public read published chapters"
  ON public.press_chapters FOR SELECT
  USING (
    visibility = 'public'
    AND EXISTS (SELECT 1 FROM press_works pw WHERE pw.id = work_id AND pw.published_at IS NOT NULL AND pw.visibility = 'public')
  );

-- Indexes
CREATE INDEX idx_press_chapters_work ON public.press_chapters(work_id, chapter_order);
CREATE INDEX idx_press_chapters_tree ON public.press_chapters(linked_tree_id) WHERE linked_tree_id IS NOT NULL;

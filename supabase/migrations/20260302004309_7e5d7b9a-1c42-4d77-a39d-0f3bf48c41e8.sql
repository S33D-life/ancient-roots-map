
-- Phase 1: Bookshelves table
CREATE TABLE public.bookshelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Your Shelf',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 2: Extend bookshelf_entries with shelf + physical copy fields
ALTER TABLE public.bookshelf_entries
  ADD COLUMN shelf_id UUID REFERENCES public.bookshelves(id) ON DELETE SET NULL,
  ADD COLUMN is_physical_copy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN notes_count INTEGER NOT NULL DEFAULT 0;

-- Phase 3: Book notes/musings table
CREATE TABLE public.book_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_entry_id UUID NOT NULL REFERENCES public.bookshelf_entries(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  page_reference TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  offered_to_tree_id UUID,
  offering_id UUID REFERENCES public.offerings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger for book_notes
CREATE OR REPLACE FUNCTION public.validate_book_note()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $func$
BEGIN
  IF NEW.note_type NOT IN ('note', 'quote', 'reflection', 'musing') THEN
    RAISE EXCEPTION 'Invalid note_type: %', NEW.note_type;
  END IF;
  IF NEW.visibility NOT IN ('private', 'circle', 'tribe', 'public') THEN
    RAISE EXCEPTION 'Invalid visibility: %', NEW.visibility;
  END IF;
  IF length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'content too long (max 5000 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_validate_book_note
  BEFORE INSERT OR UPDATE ON public.book_notes
  FOR EACH ROW EXECUTE FUNCTION public.validate_book_note();

-- Validation trigger for bookshelves
CREATE OR REPLACE FUNCTION public.validate_bookshelf()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $func$
BEGIN
  IF NEW.visibility NOT IN ('private', 'circle', 'tribe', 'public') THEN
    RAISE EXCEPTION 'Invalid visibility: %', NEW.visibility;
  END IF;
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'name too long (max 200 chars)';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_validate_bookshelf
  BEFORE INSERT OR UPDATE ON public.bookshelves
  FOR EACH ROW EXECUTE FUNCTION public.validate_bookshelf();

-- Trigger to keep notes_count in sync
CREATE OR REPLACE FUNCTION public.sync_book_notes_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $func$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bookshelf_entries SET notes_count = notes_count + 1 WHERE id = NEW.book_entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bookshelf_entries SET notes_count = notes_count - 1 WHERE id = OLD.book_entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$func$;

CREATE TRIGGER trg_sync_book_notes_count
  AFTER INSERT OR DELETE ON public.book_notes
  FOR EACH ROW EXECUTE FUNCTION public.sync_book_notes_count();

-- RLS policies
ALTER TABLE public.bookshelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;

-- Bookshelves: owner CRUD
CREATE POLICY "Users can manage own shelves" ON public.bookshelves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookshelves: public read for shared shelves
CREATE POLICY "Public can view shared shelves" ON public.bookshelves
  FOR SELECT USING (visibility IN ('public', 'circle', 'tribe'));

-- Book notes: owner CRUD
CREATE POLICY "Users can manage own notes" ON public.book_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Book notes: public read for shared notes
CREATE POLICY "Public can view shared notes" ON public.book_notes
  FOR SELECT USING (visibility IN ('public', 'circle', 'tribe'));

-- Indexes
CREATE INDEX idx_bookshelves_user_id ON public.bookshelves(user_id);
CREATE INDEX idx_bookshelf_entries_shelf_id ON public.bookshelf_entries(shelf_id);
CREATE INDEX idx_book_notes_book_entry_id ON public.book_notes(book_entry_id);
CREATE INDEX idx_book_notes_user_id ON public.book_notes(user_id);

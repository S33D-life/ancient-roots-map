
-- Personal bookshelf entries table
CREATE TABLE public.bookshelf_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  catalog_book_id uuid REFERENCES public.book_catalog(id) ON DELETE SET NULL,
  offering_id uuid REFERENCES public.offerings(id) ON DELETE SET NULL,
  title text NOT NULL,
  author text NOT NULL,
  genre text,
  cover_url text,
  quote text,
  reflection text,
  visibility text NOT NULL DEFAULT 'private',
  linked_tree_ids uuid[] DEFAULT '{}',
  linked_council_sessions text[] DEFAULT '{}',
  species_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookshelf_user ON public.bookshelf_entries(user_id);
CREATE INDEX idx_bookshelf_visibility ON public.bookshelf_entries(visibility);
CREATE INDEX idx_bookshelf_catalog ON public.bookshelf_entries(catalog_book_id) WHERE catalog_book_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.bookshelf_entries ENABLE ROW LEVEL SECURITY;

-- Owner full CRUD
CREATE POLICY "Users can CRUD own bookshelf entries"
  ON public.bookshelf_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public books readable by authenticated users
CREATE POLICY "Public bookshelf entries readable by authenticated"
  ON public.bookshelf_entries FOR SELECT
  USING (visibility = 'public' AND auth.uid() IS NOT NULL);

-- Circle/tribe books readable by authenticated (for wanderer feeds)
CREATE POLICY "Shared bookshelf entries readable by authenticated"
  ON public.bookshelf_entries FOR SELECT
  USING (visibility IN ('circle', 'tribe') AND auth.uid() IS NOT NULL);

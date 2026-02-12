-- Create song catalog for smart autocomplete
CREATE TABLE public.song_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  artwork_url TEXT,
  preview_url TEXT,
  external_url TEXT,
  source TEXT NOT NULL DEFAULT 'curated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read the catalog
CREATE POLICY "Song catalog is publicly readable"
  ON public.song_catalog FOR SELECT
  USING (true);

-- Only service role inserts (seeding)
-- No user insert/update/delete needed

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fast fuzzy search
CREATE INDEX idx_song_catalog_title_trgm ON public.song_catalog USING GIN (title gin_trgm_ops);
CREATE INDEX idx_song_catalog_artist_trgm ON public.song_catalog USING GIN (artist gin_trgm_ops);
CREATE INDEX idx_song_catalog_genre ON public.song_catalog (genre);

-- Fuzzy search function
CREATE OR REPLACE FUNCTION public.search_songs(
  query TEXT,
  result_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  album TEXT,
  genre TEXT,
  artwork_url TEXT,
  preview_url TEXT,
  external_url TEXT,
  source TEXT,
  similarity REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id, s.title, s.artist, s.album, s.genre,
    s.artwork_url, s.preview_url, s.external_url, s.source,
    GREATEST(
      similarity(s.title, query),
      similarity(s.artist, query),
      similarity(s.title || ' ' || s.artist, query)
    ) AS similarity
  FROM song_catalog s
  WHERE
    s.title % query
    OR s.artist % query
    OR (s.title || ' ' || s.artist) % query
    OR s.title ILIKE '%' || query || '%'
    OR s.artist ILIKE '%' || query || '%'
  ORDER BY similarity DESC, s.title ASC
  LIMIT result_limit;
$$;

-- Track recently offered songs per tree (for suggestions)
CREATE OR REPLACE FUNCTION public.get_recent_tree_songs(
  p_tree_id UUID,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  title TEXT,
  artist TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.title, o.content AS artist, o.media_url, o.created_at
  FROM offerings o
  WHERE o.tree_id = p_tree_id AND o.type = 'song'
  ORDER BY o.created_at DESC
  LIMIT result_limit;
$$;

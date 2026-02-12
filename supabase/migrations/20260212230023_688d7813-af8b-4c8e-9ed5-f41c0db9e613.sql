-- Add 'book' to the offering_type enum
ALTER TYPE public.offering_type ADD VALUE IF NOT EXISTS 'book';

-- Create book_catalog table
CREATE TABLE public.book_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.book_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Book catalog is publicly readable" ON public.book_catalog FOR SELECT USING (true);

-- Trigram indexes for fuzzy search
CREATE INDEX idx_book_catalog_title_trgm ON public.book_catalog USING GIN (title gin_trgm_ops);
CREATE INDEX idx_book_catalog_author_trgm ON public.book_catalog USING GIN (author gin_trgm_ops);

-- Fuzzy search RPC
CREATE OR REPLACE FUNCTION public.search_books(query text, result_limit integer DEFAULT 12)
RETURNS TABLE(id uuid, title text, author text, genre text, cover_url text, similarity real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    b.id, b.title, b.author, b.genre, b.cover_url,
    GREATEST(
      similarity(b.title, query),
      similarity(b.author, query),
      similarity(b.title || ' ' || b.author, query)
    ) AS similarity
  FROM book_catalog b
  WHERE
    b.title % query
    OR b.author % query
    OR (b.title || ' ' || b.author) % query
    OR b.title ILIKE '%' || query || '%'
    OR b.author ILIKE '%' || query || '%'
  ORDER BY similarity DESC, b.title ASC
  LIMIT result_limit;
$$;

-- Seed popular books across genres
INSERT INTO public.book_catalog (title, author, genre) VALUES
-- Nature & Trees
('The Hidden Life of Trees', 'Peter Wohlleben', 'Nature'),
('Braiding Sweetgrass', 'Robin Wall Kimmerer', 'Nature'),
('The Overstory', 'Richard Powers', 'Fiction'),
('The Secret Life of Trees', 'Colin Tudge', 'Nature'),
('Lab Girl', 'Hope Jahren', 'Memoir'),
('Finding the Mother Tree', 'Suzanne Simard', 'Science'),
('The Songs of Trees', 'David George Haskell', 'Nature'),
-- Ecology & Earth
('Silent Spring', 'Rachel Carson', 'Science'),
('Sand County Almanac', 'Aldo Leopold', 'Nature'),
('The Ecology of Wisdom', 'Arne Naess', 'Philosophy'),
('Entangled Life', 'Merlin Sheldrake', 'Science'),
('The Web of Life', 'Fritjof Capra', 'Science'),
-- Myth & Folklore
('The Hero with a Thousand Faces', 'Joseph Campbell', 'Mythology'),
('Women Who Run with the Wolves', 'Clarissa Pinkola Estés', 'Mythology'),
('The Mabinogion', 'Anonymous', 'Mythology'),
('Norse Mythology', 'Neil Gaiman', 'Mythology'),
('Circe', 'Madeline Miller', 'Fiction'),
-- Poetry
('Leaves of Grass', 'Walt Whitman', 'Poetry'),
('Devotions', 'Mary Oliver', 'Poetry'),
('The Wild Iris', 'Louise Glück', 'Poetry'),
('Milk and Honey', 'Rupi Kaur', 'Poetry'),
('New and Selected Poems', 'Mary Oliver', 'Poetry'),
('The Prophet', 'Kahlil Gibran', 'Poetry'),
-- Philosophy & Spirituality
('Tao Te Ching', 'Lao Tzu', 'Philosophy'),
('Siddhartha', 'Hermann Hesse', 'Fiction'),
('Walden', 'Henry David Thoreau', 'Philosophy'),
('The Alchemist', 'Paulo Coelho', 'Fiction'),
('Meditations', 'Marcus Aurelius', 'Philosophy'),
('The Art of Stillness', 'Pico Iyer', 'Philosophy'),
-- Classic Literature
('The Lord of the Rings', 'J.R.R. Tolkien', 'Fiction'),
('One Hundred Years of Solitude', 'Gabriel García Márquez', 'Fiction'),
('The Little Prince', 'Antoine de Saint-Exupéry', 'Fiction'),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction'),
('Beloved', 'Toni Morrison', 'Fiction'),
('The Giving Tree', 'Shel Silverstein', 'Fiction'),
-- Science & Wonder
('Cosmos', 'Carl Sagan', 'Science'),
('A Short History of Nearly Everything', 'Bill Bryson', 'Science'),
('The Botany of Desire', 'Michael Pollan', 'Nature'),
('Sapiens', 'Yuval Noah Harari', 'History'),
('The Old Ways', 'Robert Macfarlane', 'Nature'),
('Underland', 'Robert Macfarlane', 'Nature'),
-- Children & Wisdom
('The Secret Garden', 'Frances Hodgson Burnett', 'Fiction'),
('My Side of the Mountain', 'Jean Craighead George', 'Fiction'),
('The Lorax', 'Dr. Seuss', 'Fiction'),
('Hatchet', 'Gary Paulsen', 'Fiction'),
-- Contemporary
('The Word for World Is Forest', 'Ursula K. Le Guin', 'Fiction'),
('Pilgrim at Tinker Creek', 'Annie Dillard', 'Nature'),
('The Invention of Nature', 'Andrea Wulf', 'Biography'),
('Ishmael', 'Daniel Quinn', 'Fiction'),
('The Baron in the Trees', 'Italo Calvino', 'Fiction'),
('The Man Who Planted Trees', 'Jean Giono', 'Fiction');
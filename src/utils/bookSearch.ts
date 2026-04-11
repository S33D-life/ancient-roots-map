/**
 * Hybrid book search: Google Books (primary) → Open Library (fallback).
 * Returns a normalized BookResult[] regardless of source.
 */

export interface BookResult {
  title: string;
  authors: string[];
  publishedYear: string | null;
  isbn: string | null;
  coverUrl: string | null;
  description: string | null;
  source: "google" | "openlibrary" | "catalog";
  externalId: string;
}

/* ── Google Books ─────────────────────────────────── */

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

function normalizeGoogle(item: GoogleVolume): BookResult {
  const v = item.volumeInfo;
  const isbn =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier ??
    null;
  const cover = v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;
  return {
    title: v.title ?? "Untitled",
    authors: v.authors ?? ["Unknown"],
    publishedYear: v.publishedDate?.slice(0, 4) ?? null,
    isbn,
    coverUrl: cover,
    description: v.description?.slice(0, 300) ?? null,
    source: "google",
    externalId: item.id,
  };
}

async function searchGoogle(query: string, limit: number): Promise<BookResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&printType=books&orderBy=relevance`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items as GoogleVolume[] | undefined)?.map(normalizeGoogle) ?? [];
}

/* ── Open Library ─────────────────────────────────── */

interface OLDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
}

function normalizeOL(doc: OLDoc): BookResult {
  const cover = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : null;
  return {
    title: doc.title ?? "Untitled",
    authors: doc.author_name ?? ["Unknown"],
    publishedYear: doc.first_publish_year?.toString() ?? null,
    isbn: doc.isbn?.[0] ?? null,
    coverUrl: cover,
    description: null,
    source: "openlibrary",
    externalId: doc.key,
  };
}

async function searchOpenLibrary(query: string, limit: number): Promise<BookResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs as OLDoc[] | undefined)?.map(normalizeOL) ?? [];
}

/* ── Hybrid search ────────────────────────────────── */

export async function searchBooks(query: string, limit = 8): Promise<BookResult[]> {
  if (query.trim().length < 2) return [];

  // Try Google first
  const google = await searchGoogle(query, limit).catch(() => [] as BookResult[]);
  if (google.length >= 3) return google.slice(0, limit);

  // Fallback / supplement with Open Library
  const ol = await searchOpenLibrary(query, limit).catch(() => [] as BookResult[]);

  // Merge: Google results first, then OL results not already present
  const seen = new Set(google.map((b) => `${b.title.toLowerCase()}|${b.authors[0]?.toLowerCase()}`));
  const merged = [...google];
  for (const book of ol) {
    const key = `${book.title.toLowerCase()}|${book.authors[0]?.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(book);
    }
  }
  return merged.slice(0, limit);
}

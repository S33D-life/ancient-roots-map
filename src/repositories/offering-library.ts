/**
 * Offering → Library routing queries.
 *
 * Centralises the mapping from offerings to Library rooms:
 *   offering.type === "song"  → Music Room (My Songs / Forest Radio)
 *   offering.type === "book"  → Bookshelf (My Books / Forest Books)
 *
 * All queries join the tree table for name + species context.
 * No record duplication — derived views only.
 */
import { supabase } from "@/integrations/supabase/client";

/* ── Shared enriched types ──────────────────────────────── */

export interface LibrarySongOffering {
  id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  tree_id: string;
  tree_name: string;
  species: string;
  created_by: string | null;
  created_at: string;
}

export interface LibraryBookOffering {
  id: string;
  title: string;
  content: string | null;
  media_url: string | null;   // cover_url
  tree_id: string;
  tree_name: string;
  species: string;
  created_by: string | null;
  created_at: string;
  visibility: string;
}

/* ── Internal enrichment helper ─────────────────────────── */

async function enrichWithTrees<T extends { tree_id: string }>(
  rows: T[]
): Promise<(T & { tree_name: string; species: string })[]> {
  if (rows.length === 0) return [];
  const treeIds = [...new Set(rows.map(r => r.tree_id))];
  const { data: trees } = await supabase
    .from("trees")
    .select("id, name, species")
    .in("id", treeIds);

  const treeMap = new Map(
    (trees || []).map(t => [t.id, { name: t.name || "Unknown Tree", species: t.species || "Unknown" }])
  );

  return rows.map(r => {
    const tree = treeMap.get(r.tree_id) || { name: "Unknown Tree", species: "Unknown" };
    return { ...r, tree_name: tree.name, species: tree.species };
  });
}

/* ── Song offerings ─────────────────────────────────────── */

/** All song offerings (Forest Radio / global view). */
export async function getAllSongOfferings(): Promise<LibrarySongOffering[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("id, title, content, media_url, tree_id, created_by, created_at")
    .eq("type", "song")
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllSongOfferings:", error); return []; }
  return enrichWithTrees(data || []);
}

/** Current user's song offerings (My Songs). */
export async function getUserSongOfferings(userId: string): Promise<LibrarySongOffering[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("id, title, content, media_url, tree_id, created_by, created_at")
    .eq("type", "song")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("getUserSongOfferings:", error); return []; }
  return enrichWithTrees(data || []);
}

/* ── Book offerings ─────────────────────────────────────── */

/** All book offerings across the forest (Forest Books). */
export async function getAllBookOfferings(): Promise<LibraryBookOffering[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("id, title, content, media_url, tree_id, created_by, created_at, visibility")
    .eq("type", "book")
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllBookOfferings:", error); return []; }
  return enrichWithTrees(data || []);
}

/** Current user's book offerings (My Books). */
export async function getUserBookOfferings(userId: string): Promise<LibraryBookOffering[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("id, title, content, media_url, tree_id, created_by, created_at, visibility")
    .eq("type", "book")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("getUserBookOfferings:", error); return []; }
  return enrichWithTrees(data || []);
}

/* ── Content parsing helpers ────────────────────────────── */

/** Parse the structured content field of a book offering. */
export function parseBookOfferingContent(content: string | null): {
  author: string;
  genre: string | null;
  quote: string | null;
  reflection: string | null;
} {
  if (!content) return { author: "Unknown", genre: null, quote: null, reflection: null };
  const lines = content.split("\n").filter(Boolean);
  const author = lines[0] || "Unknown";
  let genre: string | null = null;
  let quote: string | null = null;
  let reflection: string | null = null;

  for (const line of lines.slice(1)) {
    if (line.startsWith("Genre: ")) genre = line.replace("Genre: ", "");
    else if (line.startsWith('"') && line.endsWith('"')) quote = line.slice(1, -1);
    else if (line.trim()) reflection = line.trim();
  }
  return { author, genre, quote, reflection };
}

/** Parse artist from a song offering's content field. */
export function parseSongArtist(content: string | null): string {
  if (!content) return "Unknown Artist";
  // First line is usually "Artist: X" or just the artist name
  const firstLine = content.split("\n")[0] || "";
  return firstLine.replace(/^Artist:\s*/i, "").trim() || "Unknown Artist";
}

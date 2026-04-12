/**
 * Bookshelf deduplication helper.
 * Prevents duplicate rows by matching on user_id + normalized title + author.
 * If a match exists, merges tree links and enriches metadata.
 */
import { supabase } from "@/integrations/supabase/client";

function normalize(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

interface UpsertBookshelfParams {
  user_id: string;
  title: string;
  author: string;
  cover_url?: string | null;
  quote?: string | null;
  reflection?: string | null;
  visibility?: string;
  linked_tree_ids?: string[];
  offering_id?: string | null;
  source?: string;
  genre?: string | null;
  species_category?: string | null;
  catalog_book_id?: string | null;
}

/**
 * Insert or merge a bookshelf entry.
 * - If a row with the same user + title + author exists, appends new tree IDs
 *   and enriches empty fields (quote, reflection, cover).
 * - Otherwise inserts a new row.
 * Returns the entry id.
 */
export async function upsertBookshelfEntry(params: UpsertBookshelfParams): Promise<string | null> {
  const normTitle = normalize(params.title);
  const normAuthor = normalize(params.author);

  if (!normTitle) return null;

  // Check for existing entry (case-insensitive match)
  const { data: existing } = await supabase
    .from("bookshelf_entries")
    .select("id, linked_tree_ids, quote, reflection, cover_url, offering_id")
    .eq("user_id", params.user_id)
    .ilike("title", normTitle)
    .ilike("author", normAuthor)
    .limit(1);

  const match = existing?.[0];

  if (match) {
    // Merge tree IDs (deduplicated)
    const currentTrees: string[] = (match.linked_tree_ids as string[]) || [];
    const newTrees = params.linked_tree_ids || [];
    const mergedTrees = [...new Set([...currentTrees, ...newTrees])];

    // Enrich: only overwrite empty fields
    const updates: Record<string, any> = {
      linked_tree_ids: mergedTrees,
      updated_at: new Date().toISOString(),
    };

    if (!match.quote && params.quote) updates.quote = params.quote;
    if (!match.reflection && params.reflection) updates.reflection = params.reflection;
    if (!match.cover_url && params.cover_url) updates.cover_url = params.cover_url;
    if (!match.offering_id && params.offering_id) updates.offering_id = params.offering_id;

    await supabase
      .from("bookshelf_entries")
      .update(updates)
      .eq("id", match.id);

    return match.id;
  }

  // No match — insert new
  const { data, error } = await supabase
    .from("bookshelf_entries")
    .insert({
      user_id: params.user_id,
      title: params.title,
      author: params.author,
      cover_url: params.cover_url || null,
      quote: params.quote || null,
      reflection: params.reflection || null,
      visibility: params.visibility || "private",
      linked_tree_ids: params.linked_tree_ids || [],
      offering_id: params.offering_id || null,
      source: params.source || "manual",
      genre: params.genre || null,
      species_category: params.species_category || null,
      catalog_book_id: params.catalog_book_id || null,
    } as any)
    .select("id")
    .single();

  if (error) {
    console.warn("Bookshelf upsert insert failed:", error.message);
    return null;
  }
  return data?.id || null;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookshelfEntry {
  id: string;
  user_id: string;
  catalog_book_id: string | null;
  offering_id: string | null;
  title: string;
  author: string;
  genre: string | null;
  cover_url: string | null;
  quote: string | null;
  reflection: string | null;
  visibility: string;
  linked_tree_ids: string[];
  linked_council_sessions: string[];
  species_category: string | null;
  created_at: string;
  updated_at: string;
}

export type BookshelfVisibility = "private" | "circle" | "tribe" | "public";

export interface CreateBookshelfEntry {
  title: string;
  author: string;
  genre?: string | null;
  cover_url?: string | null;
  quote?: string | null;
  reflection?: string | null;
  visibility?: BookshelfVisibility;
  linked_tree_ids?: string[];
  linked_council_sessions?: string[];
  species_category?: string | null;
  catalog_book_id?: string | null;
}

interface UseBookshelfOptions {
  userId: string | null;
  filter?: BookshelfVisibility | "all" | "tree-linked";
}

export function useBookshelf({ userId, filter = "all" }: UseBookshelfOptions) {
  const [entries, setEntries] = useState<BookshelfEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!userId) { setEntries([]); return; }
    setLoading(true);
    try {
      let query = supabase
        .from("bookshelf_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filter === "private") query = query.eq("visibility", "private");
      else if (filter === "public") query = query.eq("visibility", "public");
      else if (filter === "circle") query = query.eq("visibility", "circle");
      else if (filter === "tribe") query = query.eq("visibility", "tribe");
      // "tree-linked" handled client-side after fetch

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as unknown as BookshelfEntry[];
      if (filter === "tree-linked") {
        result = result.filter(e => e.linked_tree_ids && e.linked_tree_ids.length > 0);
      }
      setEntries(result);
    } catch (err) {
      console.error("Error fetching bookshelf:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = useCallback(async (entry: CreateBookshelfEntry) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("bookshelf_entries")
      .insert({
        user_id: userId,
        title: entry.title,
        author: entry.author,
        genre: entry.genre || null,
        cover_url: entry.cover_url || null,
        quote: entry.quote || null,
        reflection: entry.reflection || null,
        visibility: entry.visibility || "private",
        linked_tree_ids: entry.linked_tree_ids || [],
        linked_council_sessions: entry.linked_council_sessions || [],
        species_category: entry.species_category || null,
        catalog_book_id: entry.catalog_book_id || null,
      } as any)
      .select("*")
      .single();
    if (error) throw error;
    await fetchEntries();
    return data as unknown as BookshelfEntry;
  }, [userId, fetchEntries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<CreateBookshelfEntry>) => {
    const { error } = await supabase
      .from("bookshelf_entries")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
    await fetchEntries();
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookshelf_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchEntries();
  }, [fetchEntries]);

  const stats = {
    total: entries.length,
    private: entries.filter(e => e.visibility === "private").length,
    shared: entries.filter(e => e.visibility !== "private").length,
    treeLinked: entries.filter(e => e.linked_tree_ids?.length > 0).length,
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry, refetch: fetchEntries, stats };
}

/** Fetch public/shared books from other users (wanderer feed) */
export function useWandererBooks() {
  const [books, setBooks] = useState<BookshelfEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("bookshelf_entries")
        .select("*")
        .in("visibility", ["public", "circle", "tribe"])
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setBooks((data || []) as unknown as BookshelfEntry[]);
    } catch (err) {
      console.error("Error fetching wanderer books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { books, loading, refetch: fetch };
}

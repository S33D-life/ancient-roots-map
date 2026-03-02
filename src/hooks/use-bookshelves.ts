import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Bookshelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export function useBookshelves(userId: string | null) {
  const [shelves, setShelves] = useState<Bookshelf[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShelves = useCallback(async () => {
    if (!userId) { setShelves([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookshelves")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setShelves((data || []) as unknown as Bookshelf[]);
    } catch (err) {
      console.error("Error fetching shelves:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchShelves(); }, [fetchShelves]);

  const createShelf = useCallback(async (name: string, description?: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("bookshelves")
      .insert({ user_id: userId, name, description: description || null, sort_order: shelves.length } as any)
      .select("*")
      .single();
    if (error) throw error;
    await fetchShelves();
    return data as unknown as Bookshelf;
  }, [userId, shelves.length, fetchShelves]);

  const updateShelf = useCallback(async (id: string, updates: Partial<Pick<Bookshelf, "name" | "description" | "visibility" | "sort_order">>) => {
    const { error } = await supabase
      .from("bookshelves")
      .update(updates as any)
      .eq("id", id);
    if (error) throw error;
    await fetchShelves();
  }, [fetchShelves]);

  const deleteShelf = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookshelves")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchShelves();
  }, [fetchShelves]);

  const ensureDefaultShelf = useCallback(async () => {
    if (!userId || shelves.length > 0) return shelves[0] || null;
    return createShelf("Your Shelf");
  }, [userId, shelves, createShelf]);

  return { shelves, loading, createShelf, updateShelf, deleteShelf, ensureDefaultShelf, refetch: fetchShelves };
}

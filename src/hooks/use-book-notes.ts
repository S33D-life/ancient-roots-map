import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookNote {
  id: string;
  user_id: string;
  book_entry_id: string;
  note_type: "note" | "quote" | "reflection" | "musing";
  content: string;
  page_reference: string | null;
  visibility: string;
  offered_to_tree_id: string | null;
  offering_id: string | null;
  created_at: string;
  updated_at: string;
}

export type NoteType = "note" | "quote" | "reflection" | "musing";

export function useBookNotes(bookEntryId: string | null) {
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!bookEntryId) { setNotes([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("book_notes")
        .select("*")
        .eq("book_entry_id", bookEntryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes((data || []) as unknown as BookNote[]);
    } catch (err) {
      console.error("Error fetching book notes:", err);
    } finally {
      setLoading(false);
    }
  }, [bookEntryId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (note: {
    user_id: string;
    note_type: NoteType;
    content: string;
    page_reference?: string;
    visibility?: string;
  }) => {
    if (!bookEntryId) return null;
    const { data, error } = await supabase
      .from("book_notes")
      .insert({
        book_entry_id: bookEntryId,
        user_id: note.user_id,
        note_type: note.note_type,
        content: note.content,
        page_reference: note.page_reference || null,
        visibility: note.visibility || "private",
      } as any)
      .select("*")
      .single();
    if (error) throw error;
    await fetchNotes();
    return data as unknown as BookNote;
  }, [bookEntryId, fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("book_notes")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, addNote, deleteNote, refetch: fetchNotes };
}

import { supabase } from "@/integrations/supabase/client";
import type { BrainNote, BrainNotePatch } from "@/lib/brain/types";
import { titleToSlug } from "@/lib/brain/wikilinks";

export async function listBrainNotes(userId: string): Promise<BrainNote[]> {
  const { data, error } = await supabase
    .from("brain_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrainNote[];
}

export async function getBrainNote(id: string): Promise<BrainNote | null> {
  const { data, error } = await supabase
    .from("brain_notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as BrainNote | null;
}

export async function createBrainNote(
  userId: string,
  title: string,
  content = "",
): Promise<BrainNote> {
  const slug = titleToSlug(title) || null;
  const { data, error } = await supabase
    .from("brain_notes")
    .insert({ user_id: userId, title, slug, content })
    .select()
    .single();
  if (error) throw error;
  return data as BrainNote;
}

export async function updateBrainNote(
  id: string,
  patch: BrainNotePatch,
): Promise<BrainNote> {
  const payload: Record<string, unknown> = { ...patch };
  if (patch.title !== undefined) {
    payload.slug = titleToSlug(patch.title) || null;
  }
  const { data, error } = await supabase
    .from("brain_notes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BrainNote;
}

export async function deleteBrainNote(id: string): Promise<void> {
  const { error } = await supabase.from("brain_notes").delete().eq("id", id);
  if (error) throw error;
}

export async function searchBrainNotes(
  userId: string,
  query: string,
): Promise<BrainNote[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("brain_notes")
    .select("*")
    .eq("user_id", userId)
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as BrainNote[];
}

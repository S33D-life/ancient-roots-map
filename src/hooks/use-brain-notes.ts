import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listBrainNotes,
  createBrainNote,
  updateBrainNote,
  deleteBrainNote,
  searchBrainNotes,
} from "@/repositories/brain-notes";
import type { BrainNotePatch } from "@/lib/brain/types";

function useCurrentUserId() {
  const { data } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: Infinity,
  });
  return data ?? null;
}

export const BRAIN_NOTES_KEY = (userId: string) => ["brain-notes", userId];

export function useBrainNotes() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? BRAIN_NOTES_KEY(userId) : ["brain-notes-anon"],
    queryFn: () => (userId ? listBrainNotes(userId) : []),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBrainNoteSearch(query: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ["brain-notes-search", userId, query],
    queryFn: () => (userId ? searchBrainNotes(userId, query) : []),
    enabled: !!userId && query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCreateBrainNote() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content?: string }) => {
      if (!userId) throw new Error("Sign in to create notes");
      return createBrainNote(userId, title, content);
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: BRAIN_NOTES_KEY(userId) });
    },
  });
}

export function useUpdateBrainNote() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BrainNotePatch }) =>
      updateBrainNote(id, patch),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: BRAIN_NOTES_KEY(userId) });
    },
  });
}

export function useDeleteBrainNote() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrainNote(id),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: BRAIN_NOTES_KEY(userId) });
    },
  });
}

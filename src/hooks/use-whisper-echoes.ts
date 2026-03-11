/**
 * useWhisperEchoes — Fetches recent public whispers with tree metadata.
 * Lightweight: single query, 5-min stale time, no polling.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNowStrict } from "date-fns";

export interface WhisperEcho {
  id: string;
  message: string;
  createdAt: string;
  relativeTime: string;
  treeId: string;
  treeName: string;
  treeSpecies: string | null;
  treeNation: string | null;
}

async function fetchPublicWhisperEchoes(limit = 30): Promise<WhisperEcho[]> {
  // Fetch recent public whispers
  const { data: whispers, error } = await supabase
    .from("tree_whispers" as any)
    .select("id, message_content, created_at, tree_anchor_id")
    .eq("recipient_scope", "PUBLIC")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !whispers?.length) return [];

  // Get unique tree IDs
  const treeIds = [...new Set((whispers as any[]).map((w) => w.tree_anchor_id))];

  const { data: trees } = await supabase
    .from("trees")
    .select("id, name, species, nation")
    .in("id", treeIds);

  const treeMap = new Map(
    (trees || []).map((t: any) => [t.id, t])
  );

  const now = new Date();

  return (whispers as any[])
    .map((w) => {
      const tree = treeMap.get(w.tree_anchor_id);
      if (!tree) return null;
      return {
        id: w.id,
        message: w.message_content,
        createdAt: w.created_at,
        relativeTime: formatDistanceToNowStrict(new Date(w.created_at), { addSuffix: true }),
        treeId: w.tree_anchor_id,
        treeName: tree.name,
        treeSpecies: tree.species,
        treeNation: tree.nation,
      };
    })
    .filter(Boolean) as WhisperEcho[];
}

export function useWhisperEchoes(limit = 30) {
  return useQuery({
    queryKey: ["whisper-echoes", limit],
    queryFn: () => fetchPublicWhisperEchoes(limit),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

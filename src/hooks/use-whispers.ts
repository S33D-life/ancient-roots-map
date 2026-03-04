/**
 * Hooks for the "Whispers in the Canopy" system.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TreeWhisper {
  id: string;
  sender_user_id: string;
  recipient_scope: "PRIVATE" | "CIRCLE" | "PUBLIC";
  recipient_user_id: string | null;
  tree_anchor_id: string;
  message_content: string;
  media_url: string | null;
  created_at: string;
  expires_at: string | null;
  delivery_scope: "ANY_TREE" | "SPECIFIC_TREE" | "SPECIES_MATCH";
  delivery_tree_id: string | null;
  delivery_species_key: string | null;
  status: string;
  collected_at: string | null;
  collected_tree_id: string | null;
}

export interface WhisperCollection {
  id: string;
  whisper_id: string;
  user_id: string;
  collected_at: string;
  collected_tree_id: string | null;
}

export interface RecentWhisperConnection {
  id: string;
  created_at: string;
  sender_user_id: string;
  target_tree_id: string;
  from: { lat: number; lng: number } | null;
  to: { lat: number; lng: number } | null;
}

/** Send a whisper through a tree */
export async function sendWhisper(params: {
  senderUserId: string;
  recipientScope: "PRIVATE" | "CIRCLE" | "PUBLIC";
  recipientUserId?: string;
  treeAnchorId: string;
  messageContent: string;
  mediaUrl?: string;
  expiresAt?: string;
  deliveryScope: "ANY_TREE" | "SPECIFIC_TREE" | "SPECIES_MATCH";
  deliveryTreeId?: string;
  deliverySpeciesKey?: string;
}) {
  const { data, error } = await supabase
    .from("tree_whispers" as any)
    .insert({
      sender_user_id: params.senderUserId,
      recipient_scope: params.recipientScope,
      recipient_user_id: params.recipientUserId || null,
      tree_anchor_id: params.treeAnchorId,
      message_content: params.messageContent,
      media_url: params.mediaUrl || null,
      expires_at: params.expiresAt || null,
      delivery_scope: params.deliveryScope,
      delivery_tree_id: params.deliveryTreeId || null,
      delivery_species_key: params.deliverySpeciesKey || null,
    })
    .select()
    .single();
  return { data, error };
}

/** Collect a private whisper */
export async function collectPrivateWhisper(whisperId: string, collectedTreeId: string) {
  const { error } = await supabase
    .from("tree_whispers" as any)
    .update({
      status: "collected",
      collected_at: new Date().toISOString(),
      collected_tree_id: collectedTreeId,
    })
    .eq("id", whisperId);
  return { error };
}

/** Collect a circle/public whisper */
export async function collectSharedWhisper(whisperId: string, userId: string, collectedTreeId: string) {
  const { error } = await supabase
    .from("tree_whisper_collections" as any)
    .insert({
      whisper_id: whisperId,
      user_id: userId,
      collected_tree_id: collectedTreeId,
    });
  return { error };
}

/** Fetch whispers the user has sent */
export function useSentWhispers(userId?: string | null) {
  const [whispers, setWhispers] = useState<TreeWhisper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setWhispers([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("tree_whispers" as any)
      .select("*")
      .eq("sender_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    setWhispers((data as unknown as TreeWhisper[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { whispers, loading, refetch: fetch };
}

/** Fetch whispers waiting for the user (private + public, uncollected) */
export function useWaitingWhispers(userId?: string | null) {
  const [whispers, setWhispers] = useState<TreeWhisper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setWhispers([]); setLoading(false); return; }
    setLoading(true);

    // Private whispers addressed to user, not yet collected
    const { data: privateW } = await supabase
      .from("tree_whispers" as any)
      .select("*")
      .eq("recipient_scope", "PRIVATE")
      .eq("recipient_user_id", userId)
      .eq("status", "sent")
      .order("created_at", { ascending: false });

    // Public whispers not yet collected by this user
    const { data: publicW } = await supabase
      .from("tree_whispers" as any)
      .select("*")
      .eq("recipient_scope", "PUBLIC")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(50);

    // Check which public ones user already collected
    let uncollectedPublic = publicW || [];
    if (uncollectedPublic.length > 0) {
      const { data: collections } = await supabase
        .from("tree_whisper_collections" as any)
        .select("whisper_id")
        .eq("user_id", userId);
      const collectedIds = new Set((collections || []).map((c: any) => c.whisper_id));
      uncollectedPublic = uncollectedPublic.filter((w: any) => !collectedIds.has(w.id));
    }

    setWhispers([...(privateW || []), ...uncollectedPublic] as unknown as TreeWhisper[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { whispers, loading, refetch: fetch };
}

/** Fetch collected whispers for the user */
export function useCollectedWhispers(userId?: string | null) {
  const [whispers, setWhispers] = useState<TreeWhisper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setWhispers([]); setLoading(false); return; }
    setLoading(true);

    // Private collected whispers
    const { data: privateCollected } = await supabase
      .from("tree_whispers" as any)
      .select("*")
      .eq("recipient_scope", "PRIVATE")
      .eq("recipient_user_id", userId)
      .eq("status", "collected")
      .order("collected_at", { ascending: false });

    // Public/circle collected via collections table
    const { data: collections } = await supabase
      .from("tree_whisper_collections" as any)
      .select("whisper_id, collected_at, collected_tree_id")
      .eq("user_id", userId)
      .order("collected_at", { ascending: false });

    let publicCollected: TreeWhisper[] = [];
    if (collections && collections.length > 0) {
      const whisperIds = (collections as any[]).map(c => c.whisper_id);
      const { data: ws } = await supabase
        .from("tree_whispers" as any)
        .select("*")
        .in("id", whisperIds);
      publicCollected = (ws || []) as unknown as TreeWhisper[];
      // Merge collected_at from collections
      const colMap = new Map((collections as any[]).map(c => [c.whisper_id, c]));
      publicCollected = publicCollected.map(w => ({
        ...w,
        collected_at: colMap.get(w.id)?.collected_at || w.collected_at,
        collected_tree_id: colMap.get(w.id)?.collected_tree_id || w.collected_tree_id,
      }));
    }

    setWhispers([...(privateCollected || []), ...publicCollected] as TreeWhisper[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { whispers, loading, refetch: fetch };
}

/** Check if whispers are available at a specific tree for a user */
export async function checkWhispersAtTree(
  userId: string,
  treeId: string,
  treeSpecies: string
): Promise<TreeWhisper[]> {
  // Private whispers for this user
  const { data: privateW } = await supabase
    .from("tree_whispers" as any)
    .select("*")
    .eq("recipient_scope", "PRIVATE")
    .eq("recipient_user_id", userId)
    .eq("status", "sent");

  // Public whispers
  const { data: publicW } = await supabase
    .from("tree_whispers" as any)
    .select("*")
    .eq("recipient_scope", "PUBLIC")
    .eq("status", "sent");

  // Filter out already-collected public
  let filteredPublic = publicW || [];
  if (filteredPublic.length > 0) {
    const { data: cols } = await supabase
      .from("tree_whisper_collections" as any)
      .select("whisper_id")
      .eq("user_id", userId);
    const collectedIds = new Set((cols || []).map((c: any) => c.whisper_id));
    filteredPublic = filteredPublic.filter((w: any) => !collectedIds.has(w.id));
  }

  const allWhispers = [...(privateW || []), ...filteredPublic] as unknown as TreeWhisper[];

  // Match delivery rules
  return allWhispers.filter(w => {
    if (w.delivery_scope === "ANY_TREE") return true;
    if (w.delivery_scope === "SPECIFIC_TREE") return w.delivery_tree_id === treeId;
    if (w.delivery_scope === "SPECIES_MATCH") {
      const speciesKey = treeSpecies?.toLowerCase().replace(/\s+/g, "_");
      return w.delivery_species_key === speciesKey;
    }
    return false;
  });
}

/** Best-effort recent whisper links for map overlays (event-driven visualization). */
export async function fetchRecentWhisperConnections(limit = 200): Promise<RecentWhisperConnection[]> {
  const safeLimit = Math.max(1, Math.min(limit, 300));
  const { data, error } = await supabase
    .from("tree_whispers" as any)
    .select("id, created_at, sender_user_id, tree_anchor_id, delivery_tree_id, collected_tree_id")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data?.length) return [];

  const rows = data as Array<{
    id: string;
    created_at: string;
    sender_user_id: string;
    tree_anchor_id: string;
    delivery_tree_id: string | null;
    collected_tree_id: string | null;
  }>;

  const treeIds = new Set<string>();
  rows.forEach((row) => {
    treeIds.add(row.tree_anchor_id);
    if (row.collected_tree_id) treeIds.add(row.collected_tree_id);
    if (row.delivery_tree_id) treeIds.add(row.delivery_tree_id);
  });

  const { data: trees } = await supabase
    .from("trees")
    .select("id, latitude, longitude")
    .in("id", Array.from(treeIds));

  const treeMap = new Map<string, { lat: number; lng: number }>();
  (trees || []).forEach((tree: { id: string; latitude: number | null; longitude: number | null }) => {
    if (tree.latitude == null || tree.longitude == null) return;
    treeMap.set(tree.id, { lat: tree.latitude, lng: tree.longitude });
  });

  return rows
    .map((row) => {
      const target = treeMap.get(row.tree_anchor_id) || null;
      const sourceTreeId = row.collected_tree_id || row.delivery_tree_id || null;
      const from = sourceTreeId ? treeMap.get(sourceTreeId) || null : null;
      return {
        id: row.id,
        created_at: row.created_at,
        sender_user_id: row.sender_user_id,
        target_tree_id: row.tree_anchor_id,
        from,
        to: target,
      };
    })
    .filter((row) => row.to !== null);
}

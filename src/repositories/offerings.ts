/**
 * Offerings Repository — centralises recurring offering queries so
 * components call typed helpers instead of building raw Supabase queries.
 *
 * Pattern: pure async functions, no hooks — wrap in useQuery/useEffect
 * at the call-site for reactivity.
 */
import { supabase } from "@/integrations/supabase/client";

// ── User offering count ────────────────────────────────────

/** Total offerings created by a user (head-only, O(1)). */
export async function getUserOfferingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("offerings")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId);
  if (error) {
    console.error("getUserOfferingCount error:", error);
    return 0;
  }
  return count ?? 0;
}

// ── Global offering count ──────────────────────────────────

/** Total offerings across the whole platform. */
export async function getGlobalOfferingCount(): Promise<number> {
  const { count, error } = await supabase
    .from("offerings")
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error("getGlobalOfferingCount error:", error);
    return 0;
  }
  return count ?? 0;
}

// ── Recent offerings window count ──────────────────────────

/** Offerings created since a given ISO timestamp. */
export async function getOfferingCountSince(since: string): Promise<number> {
  const { count, error } = await supabase
    .from("offerings")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) {
    console.error("getOfferingCountSince error:", error);
    return 0;
  }
  return count ?? 0;
}

// ── Tree offering summary (uses DB function) ───────────────

export interface TreeOfferingSummary {
  type: string;
  cnt: number;
  has_photo: boolean;
}

/**
 * Per-type breakdown for a single tree.
 * Uses the `get_tree_offering_summary` RPC for a single round-trip.
 */
export async function getTreeOfferingSummary(
  treeId: string
): Promise<TreeOfferingSummary[]> {
  const { data, error } = await supabase.rpc("get_tree_offering_summary", {
    p_tree_id: treeId,
  });
  if (error) {
    console.error("getTreeOfferingSummary error:", error);
    return [];
  }
  return (data || []) as TreeOfferingSummary[];
}

// ── Recent offerings for a tree ────────────────────────────

export interface RecentOffering {
  id: string;
  title: string | null;
  type: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Fetch the N most recent offerings for a tree.
 * Lightweight select — no full row scan.
 */
export async function getRecentOfferings(
  treeId: string,
  limit = 10
): Promise<RecentOffering[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("id, title, type, content, media_url, created_at, created_by")
    .eq("tree_id", treeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getRecentOfferings error:", error);
    return [];
  }
  return (data || []) as RecentOffering[];
}

// ── Recent songs for a tree (uses DB function) ─────────────

export interface RecentTreeSong {
  title: string | null;
  artist: string | null;
  media_url: string | null;
  created_at: string;
}

export async function getRecentTreeSongs(
  treeId: string,
  limit = 5
): Promise<RecentTreeSong[]> {
  const { data, error } = await supabase.rpc("get_recent_tree_songs", {
    p_tree_id: treeId,
    result_limit: limit,
  });
  if (error) {
    console.error("getRecentTreeSongs error:", error);
    return [];
  }
  return (data || []) as RecentTreeSong[];
}

// ── User photo tree IDs (for avatar gallery, etc.) ─────────

/** Returns tree_id list where user has contributed photos. */
export async function getUserPhotoTreeIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("offerings")
    .select("tree_id")
    .eq("created_by", userId)
    .eq("type", "photo");
  if (error) {
    console.error("getUserPhotoTreeIds error:", error);
    return [];
  }
  return (data || []).map((r) => r.tree_id);
}

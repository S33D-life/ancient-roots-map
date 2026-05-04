import { supabase } from "@/integrations/supabase/client";
import type { AncientFriendsSummary } from "./types";

/**
 * Fetch Ancient Friends activity for a user within [start, end].
 * Resilient: each query is isolated. Missing tables/columns log a warning
 * and return zeros for that slice rather than throwing.
 */
export async function fetchAncientFriendsSummary(
  userId: string,
  start: string,
  end: string,
): Promise<AncientFriendsSummary> {
  const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Moonroot] ${label} failed:`, err);
      return fallback;
    }
  };

  // Trees mapped (created_by) in window
  const treesMapped = await safe("trees mapped", async () => {
    const { count, error } = await supabase
      .from("trees")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId)
      .gte("created_at", start)
      .lte("created_at", end);
    if (error) throw error;
    return count ?? 0;
  }, 0);

  // Check-ins in window — distinct trees + total visits + top tree
  const checkins = await safe("checkins", async () => {
    const { data, error } = await supabase
      .from("tree_checkins")
      .select("tree_id, checked_in_at")
      .eq("user_id", userId)
      .gte("checked_in_at", start)
      .lte("checked_in_at", end);
    if (error) throw error;
    return data ?? [];
  }, [] as Array<{ tree_id: string; checked_in_at: string }>);

  const totalVisits = checkins.length;
  const visitsByTree = new Map<string, number>();
  for (const c of checkins) {
    visitsByTree.set(c.tree_id, (visitsByTree.get(c.tree_id) ?? 0) + 1);
  }
  const treesVisited = visitsByTree.size;

  let topTree: AncientFriendsSummary["topTree"] = null;
  if (visitsByTree.size > 0) {
    const [topId, visits] = [...visitsByTree.entries()].sort((a, b) => b[1] - a[1])[0];
    const { data: tree } = await supabase
      .from("trees")
      .select("id, name, species")
      .eq("id", topId)
      .maybeSingle();
    if (tree) topTree = { id: tree.id, name: tree.name, species: tree.species, visits };
  }

  // Offerings in window
  const offerings = await safe("offerings", async () => {
    const { data, error } = await supabase
      .from("offerings")
      .select("id, type, media_url, photos")
      .eq("created_by", userId)
      .gte("created_at", start)
      .lte("created_at", end);
    if (error) throw error;
    return data ?? [];
  }, [] as Array<{ id: string; type: string; media_url: string | null; photos: string[] | null }>);

  const offeringsCount = offerings.length;
  const songsCount = offerings.filter((o) =>
    ["song", "music", "audio", "birdsong"].includes(String(o.type).toLowerCase()),
  ).length;
  const photosCount = offerings.reduce((sum, o) => {
    const fromArray = Array.isArray(o.photos) ? o.photos.length : 0;
    const fromMedia = !fromArray && o.media_url && String(o.type).toLowerCase().includes("photo") ? 1 : 0;
    return sum + fromArray + fromMedia;
  }, 0);

  // Whispers sent
  const whispersSent = await safe("whispers sent", async () => {
    const { count, error } = await supabase
      .from("tree_whispers")
      .select("id", { count: "exact", head: true })
      .eq("sender_user_id", userId)
      .gte("created_at", start)
      .lte("created_at", end);
    if (error) throw error;
    return count ?? 0;
  }, 0);

  // Whispers received (collected by this user)
  const whispersReceived = await safe("whispers received", async () => {
    const { count, error } = await supabase
      .from("tree_whispers")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .gte("created_at", start)
      .lte("created_at", end);
    if (error) throw error;
    return count ?? 0;
  }, 0);

  // Hearts earned (positive credits) — try heart_ledger then heart_transactions
  const heartsEarned = await safe("hearts earned", async () => {
    const { data: ledger, error: lErr } = await supabase
      .from("heart_ledger")
      .select("amount")
      .eq("user_id", userId)
      .gt("amount", 0)
      .gte("created_at", start)
      .lte("created_at", end);
    if (!lErr && ledger) {
      return ledger.reduce((s, r: any) => s + (Number(r.amount) || 0), 0);
    }
    const { data: tx } = await supabase
      .from("heart_transactions")
      .select("amount, transaction_type")
      .eq("user_id", userId)
      .gte("created_at", start)
      .lte("created_at", end);
    return (tx ?? []).reduce((s, r: any) => s + (Number(r.amount) > 0 ? Number(r.amount) : 0), 0);
  }, 0);

  // Recent trees + species set
  const recentTreeIds = [...new Set(checkins.map((c) => c.tree_id))].slice(0, 5);
  let recentTrees: AncientFriendsSummary["recentTrees"] = [];
  let speciesSet = new Set<string>();
  if (recentTreeIds.length > 0) {
    const { data } = await supabase
      .from("trees")
      .select("id, name, species")
      .in("id", recentTreeIds);
    if (data) {
      recentTrees = data.map((t: any) => ({ id: t.id, name: t.name, species: t.species }));
      data.forEach((t: any) => t.species && speciesSet.add(t.species));
    }
  }

  return {
    treesMappedCount: treesMapped,
    treesVisitedCount: treesVisited,
    totalVisitsCount: totalVisits,
    offeringsCount,
    photosCount,
    songsCount,
    whispersSentCount: whispersSent,
    whispersReceivedCount: whispersReceived,
    heartsEarnedCount: heartsEarned,
    topTree,
    speciesConnectedWith: [...speciesSet],
    recentTrees,
  };
}

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
  // Per-tree species map (for returning trees + recurring species)
  let treeMeta = new Map<string, { id: string; name: string; species: string }>();
  if (recentTreeIds.length > 0) {
    const { data } = await supabase
      .from("trees")
      .select("id, name, species")
      .in("id", recentTreeIds);
    if (data) {
      recentTrees = data.map((t: any) => ({ id: t.id, name: t.name, species: t.species }));
      data.forEach((t: any) => {
        if (t.species) speciesSet.add(t.species);
        treeMeta.set(t.id, { id: t.id, name: t.name, species: t.species });
      });
    }
  }

  // Also resolve returning-tree metadata for any tree visited 2+ times
  // that isn't in `recentTrees` (slice(0,5) above may have dropped some).
  const returningCandidateIds = [...visitsByTree.entries()]
    .filter(([, v]) => v >= 2)
    .map(([id]) => id)
    .filter((id) => !treeMeta.has(id));
  if (returningCandidateIds.length > 0) {
    const { data } = await supabase
      .from("trees")
      .select("id, name, species")
      .in("id", returningCandidateIds);
    if (data) {
      data.forEach((t: any) => {
        treeMeta.set(t.id, { id: t.id, name: t.name, species: t.species });
        if (t.species) speciesSet.add(t.species);
      });
    }
  }

  // Returning trees — visited 2+ times this cycle, strongest first
  const returningTrees: AncientFriendsSummary["returningTrees"] = [...visitsByTree.entries()]
    .filter(([, v]) => v >= 2)
    .map(([id, v]) => {
      const m = treeMeta.get(id);
      return m ? { id, name: m.name, species: m.species, visits: v } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Recurring species — same species across multiple distinct trees
  const speciesTreeCount = new Map<string, Set<string>>();
  treeMeta.forEach((m) => {
    if (!m.species) return;
    if (!speciesTreeCount.has(m.species)) speciesTreeCount.set(m.species, new Set());
    speciesTreeCount.get(m.species)!.add(m.id);
  });
  const recurringSpecies: AncientFriendsSummary["recurringSpecies"] = [...speciesTreeCount.entries()]
    .filter(([, set]) => set.size >= 2)
    .map(([species, set]) => ({ species, treeCount: set.size }))
    .sort((a, b) => b.treeCount - a.treeCount)
    .slice(0, 4);

  // Longest streak of consecutive days with a check-in
  const dayKeys = new Set(
    checkins.map((c) => new Date(c.checked_in_at).toISOString().slice(0, 10)),
  );
  const sortedDays = [...dayKeys].sort();
  let longestStreakDays = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sortedDays) {
    const d = new Date(`${k}T00:00:00Z`);
    if (prev && (d.getTime() - prev.getTime()) === 86_400_000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longestStreakDays) longestStreakDays = run;
    prev = d;
  }

  // Cycle themes — soft, behaviour-derived
  const themes: string[] = [];
  if (totalVisits >= 5) themes.push("Presence");
  if (returningTrees.length >= 1) themes.push("Return");
  if (offeringsCount >= 3) themes.push("Blooming");
  if (whispersSent + whispersReceived >= 3) themes.push("Listening");
  if (whispersReceived >= 2) themes.push("Companionship");
  if (treesMapped >= 1) themes.push("Witnessing");

  // Sparse emotional memory lines
  const emotionalMemory: string[] = [];
  if (returningTrees[0]) {
    emotionalMemory.push(`You returned often to the ${returningTrees[0].name}.`);
  }
  if (offeringsCount > 0) {
    emotionalMemory.push(
      `${offeringsCount} offering${offeringsCount === 1 ? " was" : "s were"} left beneath the canopy.`,
    );
  }
  if (recurringSpecies[0]) {
    emotionalMemory.push(
      `The ${recurringSpecies[0].species.toLowerCase()} paths widened this moon.`,
    );
  }
  if (longestStreakDays >= 3) {
    emotionalMemory.push(`A quiet rhythm: ${longestStreakDays} days walked in a row.`);
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
    returningTrees,
    longestStreakDays,
    recurringSpecies,
    cycleThemes: themes,
    emotionalMemory,
  };
}

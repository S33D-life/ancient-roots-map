/**
 * useTreeLedger — Data hook for the Tree Ledger page.
 * Fetches trees, visit counts, heart counts, and aggregates.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LedgerTree {
  id: string;
  name: string;
  species: string | null;
  w3w: string | null;
  nation: string | null;
  state: string | null;
  created_by: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

export function useTreeLedger() {
  const [trees, setTrees] = useState<LedgerTree[]>([]);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({});
  const [lastVisitDates, setLastVisitDates] = useState<Record<string, string>>({});
  const [windfallsTriggered, setWindfallsTriggered] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [treesRes, checkinsRes, heartsRes, windfallsRes] = await Promise.all([
      supabase
        .from("trees")
        .select("id, name, species, what3words, nation, state, created_by, created_at, latitude, longitude")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("tree_checkins")
        .select("tree_id, checked_in_at")
        .order("checked_in_at", { ascending: false })
        .limit(1000),
      supabase
        .from("heart_transactions")
        .select("tree_id, amount")
        .not("tree_id", "is", null)
        .limit(1000),
      supabase
        .from("tree_heart_pools")
        .select("windfall_count"),
    ]);

    const treesData = (treesRes.data || []).map(t => ({
      ...t,
      w3w: (t as any).what3words || null,
    })) as LedgerTree[];
    setTrees(treesData);

    // Aggregate visit counts
    const vc: Record<string, number> = {};
    const lvd: Record<string, string> = {};
    for (const c of checkinsRes.data || []) {
      vc[c.tree_id] = (vc[c.tree_id] || 0) + 1;
      if (!lvd[c.tree_id] || c.checked_in_at > lvd[c.tree_id]) {
        lvd[c.tree_id] = c.checked_in_at;
      }
    }
    setVisitCounts(vc);
    setLastVisitDates(lvd);

    // Aggregate heart counts
    const hc: Record<string, number> = {};
    for (const h of heartsRes.data || []) {
      if (h.tree_id) {
        hc[h.tree_id] = (hc[h.tree_id] || 0) + h.amount;
      }
    }
    setHeartCounts(hc);

    // Windfall total
    const wt = (windfallsRes.data || []).reduce((s, r) => s + (r.windfall_count || 0), 0);
    setWindfallsTriggered(wt);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived aggregates
  const speciesList = useMemo(
    () => [...new Set(trees.map(t => t.species).filter(Boolean) as string[])].sort(),
    [trees]
  );

  const nationsList = useMemo(
    () => [...new Set(trees.map(t => t.nation).filter(Boolean) as string[])].sort(),
    [trees]
  );

  const totalVisits = useMemo(
    () => Object.values(visitCounts).reduce((s, v) => s + v, 0),
    [visitCounts]
  );

  const totalHearts = useMemo(
    () => Object.values(heartCounts).reduce((s, v) => s + v, 0),
    [heartCounts]
  );

  const uniqueMappers = useMemo(
    () => new Set(trees.map(t => t.created_by).filter(Boolean)).size,
    [trees]
  );

  // Species node data for spiral
  const speciesNodes = useMemo(() => {
    const map = new Map<string, { treeCount: number; visitCount: number; heartsGenerated: number }>();
    for (const t of trees) {
      const sp = t.species || "Unknown";
      const existing = map.get(sp) || { treeCount: 0, visitCount: 0, heartsGenerated: 0 };
      existing.treeCount++;
      existing.visitCount += visitCounts[t.id] || 0;
      existing.heartsGenerated += heartCounts[t.id] || 0;
      map.set(sp, existing);
    }
    return Array.from(map.entries())
      .map(([species, data]) => ({ species, ...data }))
      .sort((a, b) => b.treeCount - a.treeCount);
  }, [trees, visitCounts, heartCounts]);

  // Trees grouped by species for spiral strings
  const treesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const t of trees) {
      const sp = t.species || "Unknown";
      if (!map[sp]) map[sp] = [];
      map[sp].push({
        id: t.id,
        name: t.name,
        species: sp,
        w3w: t.w3w,
        location: [t.nation, t.state].filter(Boolean).join(", "),
        visitCount: visitCounts[t.id] || 0,
        heartsGenerated: heartCounts[t.id] || 0,
        visits: Array.from({ length: visitCounts[t.id] || 0 }).map(() => ({ filled: true })),
      });
    }
    return map;
  }, [trees, visitCounts, heartCounts]);

  return {
    trees,
    visitCounts,
    heartCounts,
    lastVisitDates,
    loading,
    speciesList,
    nationsList,
    totalVisits,
    totalHearts,
    uniqueMappers,
    windfallsTriggered,
    speciesNodes,
    treesMap,
    refresh: fetchData,
  };
}

/**
 * useAtlasProgression — Determines which Blooming Clock layers a user has unlocked
 * based on their activity: trees mapped, hearts staked, offerings created, councils attended.
 *
 * Layer 1 — Beauty Mode: Always available (default)
 * Layer 2 — Insight Mode: 1+ tree mapped
 * Layer 3 — Tuning Mode: 5+ trees mapped, 10+ hearts staked
 * Layer 4 — Research Mode: 15+ trees, 50+ hearts, 5+ offerings, 1+ council
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AtlasLayer = "beauty" | "insight" | "tuning" | "research";

export interface AtlasProgressionStats {
  treesMapped: number;
  heartsStaked: number;
  offeringsCreated: number;
  councilsAttended: number;
}

export interface AtlasProgressionResult {
  stats: AtlasProgressionStats;
  unlockedLayers: AtlasLayer[];
  highestLayer: AtlasLayer;
  loading: boolean;
  /** Returns progress toward next layer as 0-1 */
  nextLayerProgress: number;
  /** Human-readable hint for next unlock */
  nextUnlockHint: string | null;
}

const LAYER_ORDER: AtlasLayer[] = ["beauty", "insight", "tuning", "research"];

const THRESHOLDS: Record<AtlasLayer, Partial<AtlasProgressionStats>> = {
  beauty: {},
  insight: { treesMapped: 1 },
  tuning: { treesMapped: 5, heartsStaked: 10 },
  research: { treesMapped: 15, heartsStaked: 50, offeringsCreated: 5, councilsAttended: 1 },
};

function isUnlocked(layer: AtlasLayer, stats: AtlasProgressionStats): boolean {
  const req = THRESHOLDS[layer];
  if (req.treesMapped && stats.treesMapped < req.treesMapped) return false;
  if (req.heartsStaked && stats.heartsStaked < req.heartsStaked) return false;
  if (req.offeringsCreated && stats.offeringsCreated < req.offeringsCreated) return false;
  if (req.councilsAttended && stats.councilsAttended < req.councilsAttended) return false;
  return true;
}

export function useAtlasProgression(): AtlasProgressionResult {
  const [stats, setStats] = useState<AtlasProgressionStats>({
    treesMapped: 0, heartsStaked: 0, offeringsCreated: 0, councilsAttended: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const [treesRes, heartsRes, offeringsRes] = await Promise.all([
        supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", user.id),
        supabase.from("heart_transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("offerings").select("id", { count: "exact", head: true }).eq("created_by", user.id),
      ]);

      if (cancelled) return;

      setStats({
        treesMapped: treesRes.count || 0,
        heartsStaked: heartsRes.count || 0,
        offeringsCreated: offeringsRes.count || 0,
        councilsAttended: 0, // Council attendance tracking TBD
      });
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const result = useMemo(() => {
    const unlocked = LAYER_ORDER.filter(l => isUnlocked(l, stats));
    const highest = unlocked[unlocked.length - 1] || "beauty";
    const highestIdx = LAYER_ORDER.indexOf(highest);
    const nextLayer = highestIdx < LAYER_ORDER.length - 1 ? LAYER_ORDER[highestIdx + 1] : null;

    let nextLayerProgress = 1;
    let nextUnlockHint: string | null = null;

    if (nextLayer) {
      const req = THRESHOLDS[nextLayer];
      const checks: number[] = [];
      if (req.treesMapped) checks.push(Math.min(1, stats.treesMapped / req.treesMapped));
      if (req.heartsStaked) checks.push(Math.min(1, stats.heartsStaked / req.heartsStaked));
      if (req.offeringsCreated) checks.push(Math.min(1, stats.offeringsCreated / req.offeringsCreated));
      if (req.councilsAttended) checks.push(Math.min(1, stats.councilsAttended / req.councilsAttended));
      nextLayerProgress = checks.length > 0 ? checks.reduce((a, b) => a + b, 0) / checks.length : 1;

      // Generate hint
      const hints: string[] = [];
      if (req.treesMapped && stats.treesMapped < req.treesMapped)
        hints.push(`Map ${req.treesMapped - stats.treesMapped} more tree${req.treesMapped - stats.treesMapped > 1 ? "s" : ""}`);
      if (req.heartsStaked && stats.heartsStaked < req.heartsStaked)
        hints.push(`Stake ${req.heartsStaked - stats.heartsStaked} more heart${req.heartsStaked - stats.heartsStaked > 1 ? "s" : ""}`);
      if (req.offeringsCreated && stats.offeringsCreated < req.offeringsCreated)
        hints.push(`Create ${req.offeringsCreated - stats.offeringsCreated} more offering${req.offeringsCreated - stats.offeringsCreated > 1 ? "s" : ""}`);
      nextUnlockHint = hints.length > 0 ? hints.join(" · ") : null;
    }

    return { stats, unlockedLayers: unlocked, highestLayer: highest, loading, nextLayerProgress, nextUnlockHint };
  }, [stats, loading]);

  return result;
}

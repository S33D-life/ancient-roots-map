/**
 * CommunityAdapter — Uses user-submitted phenology observations
 * to provide locally-accurate phenology signals.
 */
import { supabase } from "@/integrations/supabase/client";
import type { PhenologyAdapter, PhenologyRegion, PhenologySignal, DateRange } from "../types";

const OBS_TO_PHASE: Record<string, PhenologySignal["phase"]> = {
  bud: "budding",
  flower: "flowering",
  fruit: "fruiting",
  leaf_fall: "leaf_fall",
  first_frost: "dormant",
  bare: "dormant",
  other: "unknown",
};

export class CommunityAdapter implements PhenologyAdapter {
  readonly name = "community";
  readonly priority = 50; // preferred over heuristic

  async getSignals(region: PhenologyRegion, dateRange: DateRange): Promise<PhenologySignal[]> {
    let q = supabase
      .from("phenology_observations")
      .select("species_key, observation_type, observed_at, latitude, longitude")
      .eq("moderation_status", "approved")
      .gte("observed_at", dateRange.from.toISOString())
      .lte("observed_at", dateRange.to.toISOString())
      .order("observed_at", { ascending: false })
      .limit(200);

    const { data } = await q;
    if (!data || data.length === 0) return [];

    // Aggregate by species_key: most frequent observation_type wins
    const speciesMap = new Map<string, Map<string, number>>();
    for (const obs of data) {
      if (!obs.species_key) continue;
      if (!speciesMap.has(obs.species_key)) speciesMap.set(obs.species_key, new Map());
      const counts = speciesMap.get(obs.species_key)!;
      counts.set(obs.observation_type, (counts.get(obs.observation_type) || 0) + 1);
    }

    const signals: PhenologySignal[] = [];
    for (const [speciesKey, counts] of speciesMap) {
      let topType = "other";
      let topCount = 0;
      for (const [type, count] of counts) {
        if (count > topCount) { topType = type; topCount = count; }
      }
      signals.push({
        speciesKey,
        phase: OBS_TO_PHASE[topType] || "unknown",
        confidence: topCount >= 5 ? "high" : topCount >= 2 ? "medium" : "low",
        source: this.name,
      });
    }
    return signals;
  }

  async getSpeciesPhase(speciesKey: string, _region: PhenologyRegion, date?: Date): Promise<PhenologySignal | null> {
    const d = date || new Date();
    const windowStart = new Date(d);
    windowStart.setDate(windowStart.getDate() - 30);

    const { data } = await supabase
      .from("phenology_observations")
      .select("observation_type")
      .eq("species_key", speciesKey)
      .eq("moderation_status", "approved")
      .gte("observed_at", windowStart.toISOString())
      .lte("observed_at", d.toISOString())
      .order("observed_at", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return null;

    // Most frequent type
    const counts = new Map<string, number>();
    for (const o of data) counts.set(o.observation_type, (counts.get(o.observation_type) || 0) + 1);
    let topType = "other";
    let topCount = 0;
    for (const [type, count] of counts) {
      if (count > topCount) { topType = type; topCount = count; }
    }

    return {
      speciesKey,
      phase: OBS_TO_PHASE[topType] || "unknown",
      confidence: topCount >= 5 ? "high" : topCount >= 2 ? "medium" : "low",
      source: this.name,
    };
  }

  async getBloomWindow(speciesKey: string): Promise<{ start: number; end: number } | null> {
    const { data } = await supabase
      .from("phenology_observations")
      .select("observed_at")
      .eq("species_key", speciesKey)
      .eq("observation_type", "flower")
      .eq("moderation_status", "approved")
      .order("observed_at")
      .limit(100);

    if (!data || data.length < 3) return null;
    const months = data.map(d => new Date(d.observed_at).getMonth() + 1);
    return { start: Math.min(...months), end: Math.max(...months) };
  }

  async healthCheck(): Promise<boolean> {
    return true; // always available, just may have no data
  }
}

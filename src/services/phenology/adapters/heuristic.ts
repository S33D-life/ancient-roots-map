/**
 * HeuristicAdapter — Uses existing food_cycles + species_phenology data
 * to derive phenology signals without external API calls.
 * This is the always-available fallback adapter.
 */
import { supabase } from "@/integrations/supabase/client";
import type { PhenologyAdapter, PhenologyRegion, PhenologySignal, DateRange } from "../types";

export class HeuristicAdapter implements PhenologyAdapter {
  readonly name = "heuristic";
  readonly priority = 100; // fallback

  async getSignals(region: PhenologyRegion, dateRange: DateRange): Promise<PhenologySignal[]> {
    const month = dateRange.from.getMonth() + 1;
    const { data: foods } = await supabase
      .from("food_cycles")
      .select("name, scientific_name, icon, flowering_months, fruiting_months, harvest_months, dormant_months, peak_months, hemisphere")
      .order("sort_order");

    if (!foods) return [];

    const signals: PhenologySignal[] = [];
    for (const f of foods) {
      // Filter by hemisphere if region provides it
      if (region.hemisphere && f.hemisphere !== "both" && f.hemisphere !== region.hemisphere) continue;

      const speciesKey = f.name.toLowerCase().replace(/ /g, "_");
      let phase: PhenologySignal["phase"] = "unknown";
      let confidence: PhenologySignal["confidence"] = "medium";

      if ((f.peak_months as number[]).includes(month)) { phase = "peak"; confidence = "high"; }
      else if ((f.flowering_months as number[]).includes(month)) { phase = "flowering"; confidence = "medium"; }
      else if ((f.fruiting_months as number[]).includes(month)) { phase = "fruiting"; confidence = "medium"; }
      else if ((f.harvest_months as number[]).includes(month)) { phase = "fruiting"; confidence = "low"; }
      else if ((f.dormant_months as number[]).includes(month)) { phase = "dormant"; confidence = "high"; }
      else continue; // no signal this month

      signals.push({
        speciesKey,
        speciesName: f.name,
        phase,
        confidence,
        source: this.name,
        typicalWindowStart: (f.flowering_months as number[])[0],
        typicalWindowEnd: (f.dormant_months as number[])[0] ? (f.dormant_months as number[])[0] - 1 : undefined,
      });
    }
    return signals;
  }

  async getSpeciesPhase(speciesKey: string, region: PhenologyRegion, date?: Date): Promise<PhenologySignal | null> {
    const month = (date || new Date()).getMonth() + 1;

    // Try species_phenology first (observation-backed)
    const { data: phenRow } = await supabase
      .from("species_phenology")
      .select("*")
      .eq("month", month)
      .ilike("species", speciesKey.replace(/_/g, " "))
      .order("observation_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (phenRow) {
      const stageMap: Record<string, PhenologySignal["phase"]> = {
        bud: "budding", blossom: "flowering", fruit: "fruiting", leaf: "peak", bare: "dormant",
      };
      return {
        speciesKey,
        phase: stageMap[phenRow.season_stage] || "unknown",
        confidence: (phenRow.observation_count || 0) >= 10 ? "high" : (phenRow.observation_count || 0) >= 3 ? "medium" : "low",
        source: this.name,
      };
    }

    // Fallback to food_cycles
    const signals = await this.getSignals(region, { from: date || new Date(), to: date || new Date() });
    return signals.find(s => s.speciesKey === speciesKey) || null;
  }

  async getBloomWindow(speciesKey: string): Promise<{ start: number; end: number } | null> {
    const name = speciesKey.replace(/_/g, " ");
    const { data } = await supabase
      .from("food_cycles")
      .select("flowering_months, peak_months")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    const months = [...(data.flowering_months as number[]), ...(data.peak_months as number[])].sort((a, b) => a - b);
    if (months.length === 0) return null;
    return { start: months[0], end: months[months.length - 1] };
  }

  async healthCheck(): Promise<boolean> {
    const { count } = await supabase.from("food_cycles").select("id", { count: "exact", head: true });
    return (count || 0) > 0;
  }
}

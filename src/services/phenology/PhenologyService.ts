/**
 * PhenologyService — Unified entry point for all phenology data.
 * 
 * UI code calls ONLY this service, never adapters directly.
 * The service tries adapters by priority (lower = preferred),
 * falls back to the next if one returns nothing.
 */
import type { PhenologyAdapter, PhenologyRegion, PhenologySignal, DateRange, PhenologyPhase, CachedSignal } from "./types";
import { supabase } from "@/integrations/supabase/client";

class PhenologyServiceImpl {
  private adapters: PhenologyAdapter[] = [];

  /** Register an adapter. Lower priority = tried first. */
  registerAdapter(adapter: PhenologyAdapter) {
    this.adapters.push(adapter);
    this.adapters.sort((a, b) => a.priority - b.priority);
  }

  /** Get signals, checking cache first, then adapters in priority order */
  async getSignals(region: PhenologyRegion, dateRange: DateRange): Promise<PhenologySignal[]> {
    // 1. Check cached signals
    const cached = await this.getCachedSignals(region, dateRange);
    if (cached.length > 0) return cached;

    // 2. Try adapters in priority order
    for (const adapter of this.adapters) {
      try {
        const ok = await adapter.healthCheck();
        if (!ok) continue;
        const signals = await adapter.getSignals(region, dateRange);
        if (signals.length > 0) {
          // Cache results (fire and forget)
          this.cacheSignals(region, dateRange, signals).catch(() => {});
          return signals;
        }
      } catch (e) {
        console.warn(`[PhenologyService] adapter ${adapter.name} failed:`, e);
      }
    }
    return [];
  }

  /** Get current phase for a specific species */
  async getSpeciesPhase(speciesKey: string, region: PhenologyRegion, date?: Date): Promise<PhenologySignal | null> {
    for (const adapter of this.adapters) {
      try {
        const result = await adapter.getSpeciesPhase(speciesKey, region, date);
        if (result) return result;
      } catch (e) {
        console.warn(`[PhenologyService] adapter ${adapter.name} species phase failed:`, e);
      }
    }
    return null;
  }

  /** Get bloom window for a species */
  async getBloomWindow(speciesKey: string, region: PhenologyRegion): Promise<{ start: number; end: number } | null> {
    for (const adapter of this.adapters) {
      try {
        const result = await adapter.getBloomWindow(speciesKey, region);
        if (result) return result;
      } catch (e) {
        console.warn(`[PhenologyService] adapter ${adapter.name} bloom window failed:`, e);
      }
    }
    return null;
  }

  /** Read from phenology_signals cache */
  private async getCachedSignals(region: PhenologyRegion, dateRange: DateRange): Promise<PhenologySignal[]> {
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase
      .from("phenology_signals")
      .select("*")
      .gte("signal_date", dateRange.from.toISOString().slice(0, 10))
      .lte("signal_date", dateRange.to.toISOString().slice(0, 10))
      .gte("expires_at", today)
      .limit(200);

    if (region.bioregionId) q = q.eq("bioregion_id", region.bioregionId);

    const { data } = await q;
    if (!data || data.length === 0) return [];

    return (data as CachedSignal[]).map(d => ({
      speciesKey: d.species_key || "unknown",
      phase: d.phase as PhenologyPhase,
      confidence: d.confidence as PhenologySignal["confidence"],
      source: d.source_adapter,
      typicalWindowStart: d.typical_window_start ?? undefined,
      typicalWindowEnd: d.typical_window_end ?? undefined,
      metadata: d.metadata,
    }));
  }

  /** Write signals to cache */
  private async cacheSignals(region: PhenologyRegion, dateRange: DateRange, signals: PhenologySignal[]) {
    const dateStr = dateRange.from.toISOString().slice(0, 10);
    const rows = signals.map(s => ({
      bioregion_id: region.bioregionId || null,
      region_name: region.regionName || null,
      latitude: region.latitude || null,
      longitude: region.longitude || null,
      signal_date: dateStr,
      species_key: s.speciesKey,
      phase: s.phase,
      confidence: s.confidence,
      source_adapter: s.source,
      typical_window_start: s.typicalWindowStart || null,
      typical_window_end: s.typicalWindowEnd || null,
      metadata: s.metadata || {},
    }));

    await supabase.from("phenology_signals").insert(rows);
  }
}

// Singleton
export const phenologyService = new PhenologyServiceImpl();

/**
 * Phenology Integration Layer — Shared types
 */

export type PhenologyPhase = 'dormant' | 'budding' | 'flowering' | 'fruiting' | 'leaf_fall' | 'peak' | 'unknown';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface PhenologyRegion {
  bioregionId?: string;
  regionName?: string;
  latitude?: number;
  longitude?: number;
  hemisphere?: 'north' | 'south';
}

export interface PhenologySignal {
  speciesKey: string;
  speciesName?: string;
  phase: PhenologyPhase;
  confidence: ConfidenceLevel;
  source: string;
  typicalWindowStart?: number; // month 1-12
  typicalWindowEnd?: number;
  metadata?: Record<string, any>;
}

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * PhenologyAdapter — Interface that all data source adapters must implement.
 * UI code NEVER calls adapters directly — only through PhenologyService.
 */
export interface PhenologyAdapter {
  readonly name: string;
  readonly priority: number; // lower = preferred

  /** Get all phenology signals for a region on a date range */
  getSignals(region: PhenologyRegion, dateRange: DateRange): Promise<PhenologySignal[]>;

  /** Get current phase for a specific species in a region */
  getSpeciesPhase(speciesKey: string, region: PhenologyRegion, date?: Date): Promise<PhenologySignal | null>;

  /** Get bloom window months for a species in a region */
  getBloomWindow(speciesKey: string, region: PhenologyRegion): Promise<{ start: number; end: number } | null>;

  /** Check if adapter is operational */
  healthCheck(): Promise<boolean>;
}

export interface CachedSignal {
  id: string;
  bioregion_id: string | null;
  region_name: string | null;
  signal_date: string;
  species_key: string | null;
  phase: PhenologyPhase;
  confidence: ConfidenceLevel;
  source_adapter: string;
  typical_window_start: number | null;
  typical_window_end: number | null;
  metadata: Record<string, any>;
  expires_at: string;
}

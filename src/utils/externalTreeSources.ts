/**
 * External Tree Source Registry
 *
 * A pluggable framework for connecting any tree database to the Ancient Friends map.
 * New sources are added via configuration — no core map logic changes required.
 *
 * Supported source types:
 *   - "overpass"  — OpenStreetMap Overpass API
 *   - "arcgis"    — ArcGIS Feature Service
 *   - "geojson"   — Static or dynamic GeoJSON endpoint
 *   - "rest"      — Generic REST API with bbox query support
 *   - "csv"       — Static CSV file with lat/lng columns
 */

// ── Universal data model ────────────────────────────────────────────────────

export interface ExternalTreeCandidate {
  /** Unique ID scoped to source, e.g. "osm-12345" */
  id: string;
  /** Source registry id */
  source: string;
  /** Original feature ID from external database */
  source_id: string;
  lat: number;
  lng: number;
  species?: string;
  genus?: string;
  title: string;
  classification?: string;
  height?: number;
  /** Arbitrary key-value metadata from the source */
  metadata: Record<string, unknown>;
  /** Whether this candidate can be "bloomed" into an Ancient Friend */
  bloomable: boolean;
}

// ── Source configuration ────────────────────────────────────────────────────

export type SourceType = "overpass" | "arcgis" | "geojson" | "rest" | "csv";

export interface ExternalTreeSource {
  /** Unique source identifier */
  id: string;
  /** Human-readable name shown in UI */
  name: string;
  /** Source type determines which fetcher adapter is used */
  type: SourceType;
  /** API endpoint or resource URL */
  endpoint: string;
  /** Attribution text shown in map footer and discovery panels */
  attribution: string;
  /** Whether this source is available to toggle on */
  enabled: boolean;
  /** Whether trees from this source can be bloomed into Ancient Friends */
  bloomable: boolean;
  /** Minimum zoom level required before querying (prevents over-fetching) */
  minZoom: number;
  /** Maximum features to return per viewport query */
  maxResults: number;
  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
  /** Marker style configuration */
  style: ExternalSourceStyle;
  /** Optional proxy URL for CORS/rate-limited APIs */
  proxyUrl?: string;
  /** Priority for layer ordering (lower = rendered first / below) */
  priority: number;
  /** Extra config for specific source types */
  config?: Record<string, unknown>;
}

export interface ExternalSourceStyle {
  /** Marker fill color (HSL string) */
  color: string;
  /** Marker border color (HSL string) */
  borderColor: string;
  /** Glow/shadow color (HSLA string) */
  glowColor: string;
  /** Marker size in pixels */
  size: number;
  /** CSS class suffix for custom styling */
  cssClass: string;
}

// ── Source Registry ─────────────────────────────────────────────────────────

export const EXTERNAL_TREE_SOURCES: ExternalTreeSource[] = [
  {
    id: "osm",
    name: "OpenStreetMap",
    type: "overpass",
    endpoint: "https://overpass-api.de/api/interpreter",
    attribution: "OpenStreetMap Contributors",
    enabled: true,
    bloomable: true,
    minZoom: 13,
    maxResults: 500,
    cacheTtlMs: 5 * 60 * 1000,
    priority: 10,
    style: {
      color: "hsl(180,60%,45%)",
      borderColor: "hsl(180,40%,30%)",
      glowColor: "hsla(180,60%,50%,0.4)",
      size: 12,
      cssClass: "osm",
    },
  },
  // Example: ArcGIS source (disabled — configure endpoint to enable)
  // {
  //   id: "notable-trees-arcgis",
  //   name: "Notable Trees Registry",
  //   type: "arcgis",
  //   endpoint: "https://services.arcgis.com/YOUR_SERVICE/arcgis/rest/services/Notable_Trees/FeatureServer/0",
  //   attribution: "Notable Trees Program",
  //   enabled: false,
  //   bloomable: true,
  //   minZoom: 10,
  //   maxResults: 300,
  //   cacheTtlMs: 10 * 60 * 1000,
  //   priority: 20,
  //   style: {
  //     color: "hsl(45,70%,50%)",
  //     borderColor: "hsl(45,50%,35%)",
  //     glowColor: "hsla(45,70%,50%,0.4)",
  //     size: 14,
  //     cssClass: "arcgis",
  //   },
  //   config: {
  //     speciesField: "SPECIES",
  //     nameField: "COMMON_NAME",
  //     classificationField: "HERITAGE_STATUS",
  //   },
  // },
];

/** Get all enabled sources, sorted by priority */
export function getEnabledSources(): ExternalTreeSource[] {
  return EXTERNAL_TREE_SOURCES
    .filter((s) => s.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/** Get a source by ID */
export function getSourceById(id: string): ExternalTreeSource | undefined {
  return EXTERNAL_TREE_SOURCES.find((s) => s.id === id);
}

// ── Bounding Box ────────────────────────────────────────────────────────────

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Clamp and validate a BBox. Returns null if any value is NaN/Infinity
 * or if the ranges are inverted.
 */
export function sanitizeBBox(bbox: BBox): BBox | null {
  const s = Number(bbox.south);
  const w = Number(bbox.west);
  const n = Number(bbox.north);
  const e = Number(bbox.east);
  if (!Number.isFinite(s) || !Number.isFinite(w) || !Number.isFinite(n) || !Number.isFinite(e)) return null;
  const cs = Math.max(-90, Math.min(90, s));
  const cn = Math.max(-90, Math.min(90, n));
  const cw = Math.max(-180, Math.min(180, w));
  const ce = Math.max(-180, Math.min(180, e));
  if (cs >= cn) return null;
  return { south: cs, west: cw, north: cn, east: ce };
}

// ── Cache System ────────────────────────────────────────────────────────────

interface CacheEntry {
  trees: ExternalTreeCandidate[];
  timestamp: number;
}

const sourceCache = new Map<string, Map<string, CacheEntry>>();

function getCacheMap(sourceId: string): Map<string, CacheEntry> {
  if (!sourceCache.has(sourceId)) {
    sourceCache.set(sourceId, new Map());
  }
  return sourceCache.get(sourceId)!;
}

function bboxKey(bbox: BBox): string {
  return `${bbox.south.toFixed(3)},${bbox.west.toFixed(3)},${bbox.north.toFixed(3)},${bbox.east.toFixed(3)}`;
}

function getCached(sourceId: string, bbox: BBox, ttl: number): ExternalTreeCandidate[] | null {
  const cache = getCacheMap(sourceId);
  const entry = cache.get(bboxKey(bbox));
  if (entry && Date.now() - entry.timestamp < ttl) return entry.trees;
  return null;
}

function setCache(sourceId: string, bbox: BBox, trees: ExternalTreeCandidate[]): void {
  const cache = getCacheMap(sourceId);
  cache.set(bboxKey(bbox), { trees, timestamp: Date.now() });
  // Evict old entries per source
  if (cache.size > 20) {
    const sorted = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < sorted.length - 15; i++) cache.delete(sorted[i][0]);
  }
}

// ── Fetcher Adapters ────────────────────────────────────────────────────────

async function fetchOverpass(
  source: ExternalTreeSource,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  const latSpan = bbox.north - bbox.south;
  const lngSpan = bbox.east - bbox.west;
  if (latSpan > 0.6 || lngSpan > 0.6) return [];

  const query = `
[out:json][timeout:10];
(
  node["natural"="tree"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out body ${source.maxResults};
`;

  const res = await fetch(source.endpoint, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return (data.elements || []).map((el: any) => ({
    id: `${source.id}-${el.id}`,
    source: source.id,
    source_id: String(el.id),
    lat: el.lat,
    lng: el.lon,
    species: el.tags?.["species"] || el.tags?.["species:en"] || undefined,
    genus: el.tags?.["genus"] || el.tags?.["genus:en"] || undefined,
    title: el.tags?.["name"] || el.tags?.["name:en"] || el.tags?.["species"] || "Tree",
    classification: el.tags?.["heritage"] || el.tags?.["protected"] || undefined,
    height: el.tags?.["height"] ? parseFloat(el.tags.height) : undefined,
    metadata: el.tags || {},
    bloomable: source.bloomable,
  }));
}

async function fetchArcGIS(
  source: ExternalTreeSource,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  const cfg = (source.config || {}) as Record<string, string>;
  const speciesField = cfg.speciesField || "SPECIES";
  const nameField = cfg.nameField || "NAME";
  const classField = cfg.classificationField || "STATUS";

  const geometry = encodeURIComponent(JSON.stringify({
    xmin: bbox.west, ymin: bbox.south, xmax: bbox.east, ymax: bbox.north,
    spatialReference: { wkid: 4326 },
  }));

  const url = `${source.endpoint}/query?where=1%3D1&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&outFields=*&f=json&resultRecordCount=${source.maxResults}`;

  const res = await fetch(source.proxyUrl ? `${source.proxyUrl}?url=${encodeURIComponent(url)}` : url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return (data.features || []).map((f: any) => ({
    id: `${source.id}-${f.attributes.OBJECTID || f.attributes.FID || Math.random()}`,
    source: source.id,
    source_id: String(f.attributes.OBJECTID || f.attributes.FID || ""),
    lat: f.geometry.y,
    lng: f.geometry.x,
    species: f.attributes[speciesField] || undefined,
    title: f.attributes[nameField] || f.attributes[speciesField] || "Tree",
    classification: f.attributes[classField] || undefined,
    metadata: f.attributes,
    bloomable: source.bloomable,
  }));
}

async function fetchGeoJSON(
  source: ExternalTreeSource,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  const cfg = (source.config || {}) as Record<string, string>;
  const speciesKey = cfg.speciesKey || "species";
  const nameKey = cfg.nameKey || "name";
  const classKey = cfg.classificationKey || "classification";

  const url = source.endpoint.includes("?")
    ? `${source.endpoint}&bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}`
    : `${source.endpoint}?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

  const res = await fetch(source.proxyUrl ? `${source.proxyUrl}?url=${encodeURIComponent(url)}` : url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const features = data.features || data;
  return features.slice(0, source.maxResults).map((f: any) => {
    const coords = f.geometry?.coordinates || [0, 0];
    const props = f.properties || {};
    return {
      id: `${source.id}-${f.id || props.id || Math.random()}`,
      source: source.id,
      source_id: String(f.id || props.id || ""),
      lat: coords[1],
      lng: coords[0],
      species: props[speciesKey] || undefined,
      title: props[nameKey] || props[speciesKey] || "Tree",
      classification: props[classKey] || undefined,
      metadata: props,
      bloomable: source.bloomable,
    };
  });
}

async function fetchREST(
  source: ExternalTreeSource,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  const cfg = (source.config || {}) as Record<string, string>;
  const latKey = cfg.latKey || "latitude";
  const lngKey = cfg.lngKey || "longitude";
  const speciesKey = cfg.speciesKey || "species";
  const nameKey = cfg.nameKey || "name";

  let url = source.endpoint
    .replace("{south}", String(bbox.south))
    .replace("{west}", String(bbox.west))
    .replace("{north}", String(bbox.north))
    .replace("{east}", String(bbox.east))
    .replace("{limit}", String(source.maxResults));

  const res = await fetch(source.proxyUrl ? `${source.proxyUrl}?url=${encodeURIComponent(url)}` : url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.results || data.data || data.features || [];

  return items.slice(0, source.maxResults).map((item: any) => ({
    id: `${source.id}-${item.id || Math.random()}`,
    source: source.id,
    source_id: String(item.id || ""),
    lat: Number(item[latKey]),
    lng: Number(item[lngKey]),
    species: item[speciesKey] || undefined,
    title: item[nameKey] || item[speciesKey] || "Tree",
    metadata: item,
    bloomable: source.bloomable,
  }));
}

// ── Runtime Validation ──────────────────────────────────────────────────────

/**
 * Validate and sanitize an ExternalTreeCandidate at the ingestion boundary.
 * Rejects entries with missing/invalid coordinates or IDs.
 * Returns null for invalid entries so callers can filter them out silently.
 */
function validateCandidate(raw: Partial<ExternalTreeCandidate>): ExternalTreeCandidate | null {
  // Required fields
  if (!raw.id || typeof raw.id !== "string") return null;
  if (!raw.source || typeof raw.source !== "string") return null;

  // Coordinates must be finite numbers in valid ranges
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return null;

  // Title: fallback to "Tree" if missing, truncate excessive length
  const title = typeof raw.title === "string" && raw.title.trim()
    ? raw.title.trim().slice(0, 300)
    : "Tree";

  // Species: sanitize if present
  const species = typeof raw.species === "string" && raw.species.trim()
    ? raw.species.trim().slice(0, 200)
    : undefined;

  // Height: must be a reasonable positive number if present
  const height = typeof raw.height === "number" && Number.isFinite(raw.height) && raw.height > 0 && raw.height < 200
    ? raw.height
    : undefined;

  return {
    id: raw.id,
    source: raw.source,
    source_id: typeof raw.source_id === "string" ? raw.source_id : "",
    lat,
    lng,
    species,
    genus: typeof raw.genus === "string" ? raw.genus.trim().slice(0, 200) : undefined,
    title,
    classification: typeof raw.classification === "string" ? raw.classification.trim().slice(0, 200) : undefined,
    height,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
    bloomable: raw.bloomable === true,
  };
}

/**
 * Validate an array of candidates, silently filtering invalid entries.
 * Logs a warning if any were dropped.
 */
function validateCandidates(candidates: Partial<ExternalTreeCandidate>[], sourceName: string): ExternalTreeCandidate[] {
  const valid: ExternalTreeCandidate[] = [];
  let dropped = 0;
  for (const raw of candidates) {
    const validated = validateCandidate(raw);
    if (validated) {
      valid.push(validated);
    } else {
      dropped++;
    }
  }
  if (dropped > 0) {
    console.warn(`[ExternalTrees] ${sourceName}: dropped ${dropped} invalid candidates out of ${candidates.length}`);
  }
  return valid;
}

// ── Unified Fetch ───────────────────────────────────────────────────────────

const FETCHER_MAP: Record<SourceType, (s: ExternalTreeSource, b: BBox, signal?: AbortSignal) => Promise<ExternalTreeCandidate[]>> = {
  overpass: fetchOverpass,
  arcgis: fetchArcGIS,
  geojson: fetchGeoJSON,
  rest: fetchREST,
  csv: async () => [], // CSV is loaded once at startup, not per viewport
};

/**
 * Fetch trees from a single source within the given bounding box.
 * Handles caching, error isolation, and abort signals.
 */
export async function fetchSourceTrees(
  source: ExternalTreeSource,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  // Validate bbox at the ingestion boundary
  const safeBBox = sanitizeBBox(bbox);
  if (!safeBBox) {
    console.warn(`[ExternalTrees] ${source.name}: invalid bbox rejected`, bbox);
    return [];
  }

  // Check cache first
  const cached = getCached(source.id, safeBBox, source.cacheTtlMs);
  if (cached) return cached;

  const fetcher = FETCHER_MAP[source.type];
  if (!fetcher) {
    console.warn(`[ExternalTrees] No fetcher for source type: ${source.type}`);
    return [];
  }

  try {
    const raw = await fetcher(source, safeBBox, signal);
    const trees = validateCandidates(raw, source.name);
    setCache(source.id, safeBBox, trees);
    return trees;
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.warn(`[ExternalTrees] ${source.name} error:`, err.message);
    // Return stale cache if available
    const stale = getCached(source.id, safeBBox, Infinity);
    return stale ?? [];
  }
}

/**
 * Fetch trees from all enabled sources in parallel.
 * Returns a flat array of candidates, tagged by source.
 */
export async function fetchAllSourceTrees(
  bbox: BBox,
  activeSourceIds: string[],
  signal?: AbortSignal,
): Promise<ExternalTreeCandidate[]> {
  const sources = getEnabledSources().filter((s) => activeSourceIds.includes(s.id));
  const results = await Promise.allSettled(
    sources.map((s) => fetchSourceTrees(s, bbox, signal)),
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// ── Attribution Helper ──────────────────────────────────────────────────────

export function getActiveAttributions(activeSourceIds: string[]): string[] {
  return getEnabledSources()
    .filter((s) => activeSourceIds.includes(s.id))
    .map((s) => s.attribution);
}

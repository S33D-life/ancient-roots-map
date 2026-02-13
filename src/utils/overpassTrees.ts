/**
 * Fetch trees from OpenStreetMap via Overpass API.
 * Returns trees within the given bounding box.
 * Results are cached per bbox key with a 5-minute TTL.
 */

export interface ExternalTree {
  id: string;
  latitude: number;
  longitude: number;
  species?: string;
  genus?: string;
  name?: string;
  height?: number;
  source: "osm";
}

interface CacheEntry {
  trees: ExternalTree[];
  timestamp: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes — reduce redundant API calls
const MAX_RESULTS = 300; // cap results for faster parsing & rendering

function bboxKey(s: number, w: number, n: number, e: number): string {
  return `${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
}

export async function fetchOverpassTrees(
  south: number,
  west: number,
  north: number,
  east: number,
  signal?: AbortSignal
): Promise<ExternalTree[]> {
  const key = bboxKey(south, west, north, east);

  // Check cache
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.trees;
  }

  // Limit bbox area to prevent excessive queries (roughly 0.3° × 0.3° max)
  const latSpan = north - south;
  const lngSpan = east - west;
  if (latSpan > 0.35 || lngSpan > 0.35) {
    return []; // Too zoomed out — don't query
  }

  const query = `
[out:json][timeout:10];
(
  node["natural"="tree"](${south},${west},${north},${east});
);
out body ${MAX_RESULTS};
`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });

    if (!res.ok) {
      console.warn("[Overpass] HTTP", res.status);
      return cached?.trees ?? [];
    }

    const data = await res.json();

    const trees: ExternalTree[] = (data.elements || []).map((el: any) => ({
      id: `osm-${el.id}`,
      latitude: el.lat,
      longitude: el.lon,
      species: el.tags?.["species"] || el.tags?.["species:en"] || undefined,
      genus: el.tags?.["genus"] || el.tags?.["genus:en"] || undefined,
      name: el.tags?.["name"] || el.tags?.["name:en"] || undefined,
      height: el.tags?.["height"] ? parseFloat(el.tags.height) : undefined,
      source: "osm" as const,
    }));

    CACHE.set(key, { trees, timestamp: Date.now() });

    // Evict old entries
    if (CACHE.size > 20) {
      const oldest = [...CACHE.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < oldest.length - 15; i++) {
        CACHE.delete(oldest[i][0]);
      }
    }

    return trees;
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.warn("[Overpass] fetch error:", err.message);
    return cached?.trees ?? [];
  }
}

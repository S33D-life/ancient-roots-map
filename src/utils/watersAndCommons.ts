/**
 * Waters & Commons — Landscape POI layer for the Arboreal Atlas.
 * 
 * Fetches churches, waterways, commons, and parklands from OpenStreetMap
 * via the Overpass API, providing cultural-ecological context for tree mapping.
 * 
 * Designed as a template for expansion to other countries and landscape types.
 */

export type LandscapeCategory = "waterway" | "churchyard" | "parkland" | "commons";

export interface LandscapePOI {
  id: string;
  lat: number;
  lng: number;
  category: LandscapeCategory;
  name?: string;
  /** e.g. "river", "stream", "spring", "church", "chapel" */
  subtype?: string;
  source: "osm";
}

/** Guardian tag suggestions based on proximity to landscape features */
export const GUARDIAN_TAGS: Record<LandscapeCategory, {
  tag: string;
  icon: string;
  whisper: string;
  color: string;
  glowColor: string;
}> = {
  waterway: {
    tag: "Waterside Guardian",
    icon: "🌊",
    whisper: "Water remembers. Does an Ancient Friend stand watch by this water?",
    color: "hsl(200, 55%, 50%)",
    glowColor: "hsla(200, 60%, 55%, 0.35)",
  },
  churchyard: {
    tag: "Church Guardian",
    icon: "⛪",
    whisper: "You are near a place of gathering and remembrance. Does an Ancient Friend stand watch here?",
    color: "hsl(35, 65%, 50%)",
    glowColor: "hsla(35, 70%, 55%, 0.35)",
  },
  parkland: {
    tag: "Parkland Elder",
    icon: "🏛️",
    whisper: "Many old trees stand together here — notice who has been overlooked.",
    color: "hsl(145, 45%, 45%)",
    glowColor: "hsla(145, 50%, 50%, 0.35)",
  },
  commons: {
    tag: "Commons Witness",
    icon: "🌾",
    whisper: "Many feet passed here. This tree has heard generations.",
    color: "hsl(75, 45%, 45%)",
    glowColor: "hsla(75, 50%, 50%, 0.35)",
  },
};

/** Proximity radius in km for each category */
export const PROXIMITY_KM: Record<LandscapeCategory, number> = {
  waterway: 0.15,   // 150m
  churchyard: 0.1,  // 100m
  parkland: 0.2,    // 200m
  commons: 0.15,    // 150m
};

// ── Cache ──

interface CacheEntry {
  pois: LandscapePOI[];
  timestamp: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_RESULTS_PER_TYPE = 100;

function bboxKey(s: number, w: number, n: number, e: number): string {
  return `wc-${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
}

/**
 * Fetch landscape POIs within a bounding box from Overpass.
 * Returns churches, waterways, commons, and parklands.
 */
export async function fetchLandscapePOIs(
  south: number,
  west: number,
  north: number,
  east: number,
  signal?: AbortSignal
): Promise<LandscapePOI[]> {
  const key = bboxKey(south, west, north, east);

  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.pois;
  }

  // Limit bbox area to prevent excessive queries (~0.5° × 0.5° max)
  const latSpan = north - south;
  const lngSpan = east - west;
  if (latSpan > 0.55 || lngSpan > 0.55) {
    return [];
  }

  const bb = `(${south},${west},${north},${east})`;

  // Combined query for all landscape categories
  const query = `
[out:json][timeout:15];
(
  // Churches, chapels, cathedrals
  node["amenity"="place_of_worship"]["religion"="christian"]${bb};
  way["amenity"="place_of_worship"]["religion"="christian"]${bb};
  // Churchyards and cemeteries near churches
  way["landuse"="cemetery"]${bb};
  // Commons, village greens
  node["landuse"="village_green"]${bb};
  way["landuse"="village_green"]${bb};
  node["leisure"="common"]${bb};
  way["leisure"="common"]${bb};
  way["designation"~"common|village_green"]${bb};
  // National Trust, English Heritage, historic parkland
  way["operator"~"National Trust|English Heritage|Historic Scotland",i]${bb};
  relation["operator"~"National Trust|English Heritage|Historic Scotland",i]${bb};
  way["leisure"="park"]["historic"]${bb};
  // Waterways — nodes for springs/wells, ways for rivers/streams
  node["natural"="spring"]${bb};
  node["natural"="water"]["water"="well"]${bb};
  way["waterway"~"river|stream|canal"]${bb};
);
out center ${MAX_RESULTS_PER_TYPE * 4};
`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });

    if (!res.ok) {
      console.warn("[Waters&Commons] HTTP", res.status);
      return cached?.pois ?? [];
    }

    const data = await res.json();
    const pois: LandscapePOI[] = [];

    for (const el of data.elements || []) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags || {};
      const poi = classifyElement(el.id, lat, lng, tags);
      if (poi) pois.push(poi);
    }

    CACHE.set(key, { pois, timestamp: Date.now() });

    // Evict old entries
    if (CACHE.size > 15) {
      const oldest = [...CACHE.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < oldest.length - 10; i++) {
        CACHE.delete(oldest[i][0]);
      }
    }

    return pois;
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.warn("[Waters&Commons] fetch error:", err.message);
    return cached?.pois ?? [];
  }
}

/** Classify an OSM element into a LandscapePOI */
function classifyElement(
  id: number,
  lat: number,
  lng: number,
  tags: Record<string, string>
): LandscapePOI | null {
  const name = tags.name || tags["name:en"];

  // Churches & chapels
  if (tags.amenity === "place_of_worship" && tags.religion === "christian") {
    const subtype = tags.building === "cathedral" ? "cathedral"
      : tags.building === "chapel" ? "chapel"
      : "church";
    return { id: `wc-ch-${id}`, lat, lng, category: "churchyard", name, subtype, source: "osm" };
  }

  // Cemeteries (often churchyards)
  if (tags.landuse === "cemetery") {
    return { id: `wc-cm-${id}`, lat, lng, category: "churchyard", name, subtype: "churchyard", source: "osm" };
  }

  // Commons & village greens
  if (tags.landuse === "village_green" || tags.leisure === "common" ||
      (tags.designation && /common|village_green/i.test(tags.designation))) {
    return { id: `wc-co-${id}`, lat, lng, category: "commons", name, subtype: tags.landuse || tags.leisure || "common", source: "osm" };
  }

  // National Trust / English Heritage / Historic parklands
  if (tags.operator && /National Trust|English Heritage|Historic Scotland/i.test(tags.operator)) {
    return { id: `wc-pk-${id}`, lat, lng, category: "parkland", name, subtype: "heritage estate", source: "osm" };
  }
  if (tags.leisure === "park" && tags.historic) {
    return { id: `wc-pk-${id}`, lat, lng, category: "parkland", name, subtype: "historic park", source: "osm" };
  }

  // Waterways
  if (tags.natural === "spring") {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: "spring", source: "osm" };
  }
  if (tags.natural === "water" && tags.water === "well") {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: "well", source: "osm" };
  }
  if (tags.waterway && /river|stream|canal/.test(tags.waterway)) {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: tags.waterway, source: "osm" };
  }

  return null;
}

/** Check if a tree coordinate is near any landscape POI */
export function getNearbyLandscapeContext(
  treeLat: number,
  treeLng: number,
  pois: LandscapePOI[]
): { category: LandscapeCategory; poi: LandscapePOI; distanceKm: number } | null {
  let closest: { category: LandscapeCategory; poi: LandscapePOI; distanceKm: number } | null = null;

  for (const poi of pois) {
    const dist = quickDistKm(treeLat, treeLng, poi.lat, poi.lng);
    const threshold = PROXIMITY_KM[poi.category];
    if (dist <= threshold) {
      if (!closest || dist < closest.distanceKm) {
        closest = { category: poi.category, poi, distanceKm: dist };
      }
    }
  }

  return closest;
}

/** Quick haversine approximation for short distances */
function quickDistKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

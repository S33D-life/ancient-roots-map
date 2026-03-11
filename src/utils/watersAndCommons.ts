/**
 * Waters & Commons + Cultural & Landscape Layers.
 * 
 * Fetches churches, waterways, commons, parklands, footpaths, trails,
 * heritage buildings, castles, and monuments from OpenStreetMap
 * via the Overpass API.
 */

export type LandscapeCategory =
  | "waterway"
  | "churchyard"
  | "parkland"
  | "commons"
  | "footpath"
  | "heritage"
  | "castle"
  | "library"
  | "bookshop"
  | "botanical_garden";

export interface LandscapePOI {
  id: string;
  lat: number;
  lng: number;
  category: LandscapeCategory;
  name?: string;
  subtype?: string;
  source: "osm";
  /** For line geometries (rivers, paths) — array of [lat,lng] */
  geometry?: [number, number][];
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
    color: "hsl(210, 35%, 75%)",
    glowColor: "hsla(210, 40%, 78%, 0.35)",
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
  footpath: {
    tag: "Wayfarer's Path",
    icon: "🥾",
    whisper: "Follow the path — Ancient Friends often watch the way.",
    color: "hsl(42, 75%, 52%)",
    glowColor: "hsla(42, 80%, 55%, 0.30)",
  },
  heritage: {
    tag: "Heritage Sentinel",
    icon: "🏰",
    whisper: "History lingers in these stones — and in the trees that witnessed it.",
    color: "hsl(25, 55%, 50%)",
    glowColor: "hsla(25, 60%, 55%, 0.35)",
  },
  castle: {
    tag: "Castle Guardian",
    icon: "🏰",
    whisper: "Fortified in stone, guarded by trees. Ancient companions to an ancient keep.",
    color: "hsl(0, 35%, 50%)",
    glowColor: "hsla(0, 40%, 55%, 0.35)",
  },
  library: {
    tag: "Knowledge Keeper",
    icon: "📚",
    whisper: "Stories sleep in shelves here — and in the rings of nearby trees.",
    color: "hsl(270, 45%, 55%)",
    glowColor: "hsla(270, 50%, 60%, 0.35)",
  },
  bookshop: {
    tag: "Book Haven",
    icon: "📖",
    whisper: "Words take root here. A place where stories and seeds are exchanged.",
    color: "hsl(310, 40%, 50%)",
    glowColor: "hsla(310, 45%, 55%, 0.35)",
  },
  botanical_garden: {
    tag: "Living Archive",
    icon: "🌺",
    whisper: "A garden of living knowledge — where species are studied, protected, and celebrated.",
    color: "hsl(160, 50%, 45%)",
    glowColor: "hsla(160, 55%, 50%, 0.35)",
  },
};

/** Proximity radius in km for each category */
export const PROXIMITY_KM: Record<LandscapeCategory, number> = {
  waterway: 0.15,
  churchyard: 0.1,
  parkland: 0.2,
  commons: 0.15,
  footpath: 0.1,
  heritage: 0.15,
  castle: 0.2,
  library: 0.15,
  bookshop: 0.1,
  botanical_garden: 0.3,
};

// ── Cache ──

interface CacheEntry {
  pois: LandscapePOI[];
  timestamp: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000;
const MAX_RESULTS_PER_TYPE = 100;

function bboxKey(s: number, w: number, n: number, e: number, layers: string): string {
  return `wc-${layers}-${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
}

export interface FetchLandscapeOptions {
  includeWaterways?: boolean;
  includeChurches?: boolean;
  includeCommons?: boolean;
  includeParklands?: boolean;
  includeFootpaths?: boolean;
  includeHeritage?: boolean;
  includeCastles?: boolean;
  includeLibraries?: boolean;
  includeBookshops?: boolean;
  includeBotanicalGardens?: boolean;
}

/**
 * Fetch landscape POIs within a bounding box from Overpass.
 */
export async function fetchLandscapePOIs(
  south: number,
  west: number,
  north: number,
  east: number,
  signal?: AbortSignal,
  options?: FetchLandscapeOptions
): Promise<LandscapePOI[]> {
  const opts: FetchLandscapeOptions = {
    includeWaterways: true,
    includeChurches: true,
    includeCommons: true,
    includeParklands: true,
    includeFootpaths: false,
    includeHeritage: false,
    includeCastles: false,
    includeLibraries: false,
    includeBookshops: false,
    includeBotanicalGardens: false,
    ...options,
  };

  const layerKey = Object.entries(opts).filter(([, v]) => v).map(([k]) => k[7]?.toLowerCase() || k[0]).join("");
  const key = bboxKey(south, west, north, east, layerKey);

  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.pois;
  }

  const latSpan = north - south;
  const lngSpan = east - west;
  if (latSpan > 0.55 || lngSpan > 0.55) {
    return [];
  }

  const bb = `(${south},${west},${north},${east})`;

  const queryParts: string[] = [];

  if (opts.includeChurches) {
    queryParts.push(`
      node["amenity"="place_of_worship"]["religion"="christian"]${bb};
      way["amenity"="place_of_worship"]["religion"="christian"]${bb};
      way["landuse"="cemetery"]${bb};
    `);
  }

  if (opts.includeCommons) {
    queryParts.push(`
      node["landuse"="village_green"]${bb};
      way["landuse"="village_green"]${bb};
      node["leisure"="common"]${bb};
      way["leisure"="common"]${bb};
      way["designation"~"common|village_green"]${bb};
    `);
  }

  if (opts.includeParklands) {
    queryParts.push(`
      way["operator"~"National Trust|English Heritage|Historic Scotland",i]${bb};
      relation["operator"~"National Trust|English Heritage|Historic Scotland",i]${bb};
      way["leisure"="park"]["historic"]${bb};
    `);
  }

  if (opts.includeWaterways) {
    queryParts.push(`
      node["natural"="spring"]${bb};
      node["natural"="water"]["water"="well"]${bb};
      way["waterway"~"river|stream|canal"]${bb};
    `);
  }

  if (opts.includeFootpaths) {
    queryParts.push(`
      way["highway"="footway"]${bb};
      way["highway"="path"]${bb};
      way["highway"="bridleway"]${bb};
      relation["route"="hiking"]${bb};
    `);
  }

  if (opts.includeHeritage) {
    queryParts.push(`
      node["historic"~"monument|memorial|manor|building"]${bb};
      way["historic"~"monument|memorial|manor|building"]${bb};
      node["tourism"~"museum|attraction"]${bb};
      way["tourism"~"museum|attraction"]${bb};
      node["building"~"stately_home|manor"]${bb};
      way["building"~"stately_home|manor"]${bb};
      node["heritage"]${bb};
      way["heritage"]${bb};
    `);
  }

  if (opts.includeCastles) {
    queryParts.push(`
      node["historic"="castle"]${bb};
      way["historic"="castle"]${bb};
      node["castle_type"]${bb};
      way["castle_type"]${bb};
    `);
  }

  if (opts.includeLibraries) {
    queryParts.push(`
      node["amenity"="library"]${bb};
      way["amenity"="library"]${bb};
    `);
  }

  if (opts.includeBookshops) {
    queryParts.push(`
      node["shop"="books"]${bb};
      way["shop"="books"]${bb};
    `);
  }

  if (opts.includeBotanicalGardens) {
    queryParts.push(`
      node["leisure"="garden"]["garden:type"="botanical"]${bb};
      way["leisure"="garden"]["garden:type"="botanical"]${bb};
      node["tourism"="attraction"]["attraction"="botanical_garden"]${bb};
      way["tourism"="attraction"]["attraction"="botanical_garden"]${bb};
    `);
  }

  if (queryParts.length === 0) return [];

  const query = `
[out:json][timeout:20];
(
${queryParts.join("\n")}
);
out body geom ${MAX_RESULTS_PER_TYPE * 4};
`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });

    if (!res.ok) {
      console.warn("[Landscape] HTTP", res.status);
      return cached?.pois ?? [];
    }

    const data = await res.json();
    const pois: LandscapePOI[] = [];

    for (const el of data.elements || []) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags || {};
      const poi = classifyElement(el.id, lat, lng, tags, el);
      if (poi) pois.push(poi);
    }

    CACHE.set(key, { pois, timestamp: Date.now() });

    if (CACHE.size > 20) {
      const oldest = [...CACHE.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < oldest.length - 12; i++) {
        CACHE.delete(oldest[i][0]);
      }
    }

    return pois;
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.warn("[Landscape] fetch error:", err.message);
    return cached?.pois ?? [];
  }
}

/** Classify an OSM element into a LandscapePOI */
function classifyElement(
  id: number,
  lat: number,
  lng: number,
  tags: Record<string, string>,
  el: any
): LandscapePOI | null {
  const name = tags.name || tags["name:en"];

  // Extract line geometry if available
  const geometry: [number, number][] | undefined =
    el.geometry && Array.isArray(el.geometry)
      ? el.geometry.map((g: any) => [g.lat, g.lon] as [number, number])
      : undefined;

  // Churches & chapels
  if (tags.amenity === "place_of_worship" && tags.religion === "christian") {
    const subtype = tags.building === "cathedral" ? "cathedral"
      : tags.building === "chapel" ? "chapel"
      : "church";
    return { id: `wc-ch-${id}`, lat, lng, category: "churchyard", name, subtype, source: "osm" };
  }

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

  // Castles (check before generic heritage)
  if (tags.historic === "castle" || tags.castle_type) {
    const subtype = tags.castle_type || "castle";
    return { id: `wc-ca-${id}`, lat, lng, category: "castle", name, subtype, source: "osm" };
  }

  // Heritage buildings, monuments, museums, stately homes
  if (tags.historic && /monument|memorial|manor|building/.test(tags.historic)) {
    return { id: `wc-hr-${id}`, lat, lng, category: "heritage", name, subtype: tags.historic, source: "osm" };
  }
  if (tags.tourism && /museum|attraction/.test(tags.tourism)) {
    return { id: `wc-hr-${id}`, lat, lng, category: "heritage", name, subtype: tags.tourism, source: "osm" };
  }
  if (tags.building && /stately_home|manor/.test(tags.building)) {
    return { id: `wc-hr-${id}`, lat, lng, category: "heritage", name, subtype: tags.building, source: "osm" };
  }
  if (tags.heritage) {
    return { id: `wc-hr-${id}`, lat, lng, category: "heritage", name, subtype: "listed building", source: "osm" };
  }

  // Footpaths, bridleways, trails
  if (tags.highway && /footway|path|bridleway/.test(tags.highway)) {
    const subtype = tags.highway === "bridleway" ? "bridleway"
      : tags.highway === "path" ? "path"
      : "footpath";
    return { id: `wc-fp-${id}`, lat, lng, category: "footpath", name, subtype, source: "osm", geometry };
  }
  if (tags.route === "hiking") {
    return { id: `wc-fp-${id}`, lat, lng, category: "footpath", name, subtype: "long-distance trail", source: "osm", geometry };
  }

  // Waterways
  if (tags.natural === "spring") {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: "spring", source: "osm" };
  }
  if (tags.natural === "water" && tags.water === "well") {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: "well", source: "osm" };
  }
  if (tags.waterway && /river|stream|canal/.test(tags.waterway)) {
    return { id: `wc-wt-${id}`, lat, lng, category: "waterway", name, subtype: tags.waterway, source: "osm", geometry };
  }

  // Libraries
  if (tags.amenity === "library") {
    return { id: `wc-lb-${id}`, lat, lng, category: "library", name, subtype: "library", source: "osm" };
  }

  // Bookshops
  if (tags.shop === "books") {
    return { id: `wc-bs-${id}`, lat, lng, category: "bookshop", name, subtype: "bookshop", source: "osm" };
  }

  // Botanical gardens
  if ((tags.leisure === "garden" && tags["garden:type"] === "botanical") ||
      (tags.tourism === "attraction" && tags.attraction === "botanical_garden")) {
    return { id: `wc-bg-${id}`, lat, lng, category: "botanical_garden", name, subtype: "botanical garden", source: "osm" };
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

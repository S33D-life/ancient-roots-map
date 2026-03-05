import { normalizeName, nowIso } from "../utils.mjs";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Template A: forests / parks / protected areas by bbox.
export const overpassGrovesTemplateA = (bbox) => {
  const [south, west, north, east] = bbox;
  return `
[out:json][timeout:60];
(
  relation["boundary"="protected_area"](${south},${west},${north},${east});
  relation["boundary"="national_park"](${south},${west},${north},${east});
  relation["leisure"="park"](${south},${west},${north},${east});
  relation["leisure"="nature_reserve"](${south},${west},${north},${east});
  way["leisure"="park"](${south},${west},${north},${east});
  way["leisure"="nature_reserve"](${south},${west},${north},${east});
  relation["landuse"="forest"](${south},${west},${north},${east});
  way["landuse"="forest"](${south},${west},${north},${east});
  relation["natural"="wood"](${south},${west},${north},${east});
  way["natural"="wood"](${south},${west},${north},${east});
);
out tags center bb;`.trim();
};

const candidateFromElement = (element, countryCode, fetchedAt, query) => {
  const tags = element.tags || {};
  const name = tags.name || tags["name:en"];
  if (!name) return null;

  const center = element.center || null;
  const lat = center?.lat ?? null;
  const lng = center?.lon ?? null;
  const bb = element.bounds
    ? {
        south: element.bounds.minlat,
        west: element.bounds.minlon,
        north: element.bounds.maxlat,
        east: element.bounds.maxlon,
      }
    : undefined;

  const themeTags = ["research", "overpass", "grove"];
  if (tags.boundary === "protected_area") themeTags.push("protected_area");
  if (tags.boundary === "national_park") themeTags.push("national_park", "protected_area");
  if (tags.leisure === "park") themeTags.push("park");
  if (tags.leisure === "nature_reserve") themeTags.push("nature_reserve", "protected_area");
  if (tags.landuse === "forest" || tags.natural === "wood") themeTags.push("forest");

  const confidence =
    tags.boundary === "national_park" || tags.boundary === "protected_area" || tags.leisure === "nature_reserve"
      ? "high"
      : tags.landuse === "forest" || tags.natural === "wood" || tags.leisure === "park"
        ? "medium"
        : "low";

  return {
    type: "grove",
    name: String(name).trim(),
    normalized_name: normalizeName(name),
    country_code: countryCode,
    lat,
    lng,
    bbox: bb,
    description_short: "Candidate grove/forest from OpenStreetMap protected-area and forest tags.",
    lore_short: "A living landscape node imported for research and local verification.",
    confidence,
    tags: Array.from(new Set(themeTags)),
    sources: [
      {
        source: "overpass",
        name: "OpenStreetMap Overpass",
        query,
        url: OVERPASS_URL,
        retrieved_at: fetchedAt,
        license_note: "ODbL 1.0 (OpenStreetMap contributors)",
        confidence,
      },
    ],
  };
};

export async function fetchOverpassGroves({ countryCode, bbox, limit = 180 }) {
  if (!bbox) return { candidates: [], source: "overpass", error: "missing_bbox" };

  const query = overpassGrovesTemplateA(bbox);
  const fetchedAt = nowIso();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort("timeout"), 20_000);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ data: query }),
      signal: abort.signal,
    });

    if (!response.ok) {
      return {
        candidates: [],
        source: "overpass",
        error: `http_${response.status}`,
      };
    }

    const payload = await response.json();
    const elements = Array.isArray(payload?.elements) ? payload.elements : [];
    const candidates = [];
    const seen = new Set();

    for (const element of elements) {
      const candidate = candidateFromElement(element, countryCode, fetchedAt, query);
      if (!candidate) continue;
      const key = `${candidate.normalized_name}:${candidate.lat ?? "na"}:${candidate.lng ?? "na"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(candidate);
      if (candidates.length >= limit) break;
    }

    return { candidates, source: "overpass", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "overpass",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

import { normalizeName, nowIso } from "../utils.mjs";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Template B: notable individual trees (monument-ish tags) by bbox.
export const overpassNotableTreesTemplateB = (bbox) => {
  const [south, west, north, east] = bbox;
  return `
[out:json][timeout:60];
(
  node["natural"="tree"]["name"](${south},${west},${north},${east});
  way["natural"="tree"]["name"](${south},${west},${north},${east});
  relation["natural"="tree"]["name"](${south},${west},${north},${east});
);
out tags center;`.trim();
};

const toCenter = (element) => {
  if (element?.center?.lat != null && element?.center?.lon != null) {
    return { lat: Number(element.center.lat), lng: Number(element.center.lon) };
  }
  if (element?.lat != null && element?.lon != null) {
    return { lat: Number(element.lat), lng: Number(element.lon) };
  }
  return { lat: null, lng: null };
};

const hasMonumentSignal = (tags) =>
  tags?.denotation === "natural_monument" ||
  tags?.denotation === "protected" ||
  tags?.historic === "memorial" ||
  tags?.protected === "yes" ||
  tags?.heritage === "yes" ||
  tags?.tourism === "attraction";

const candidateFromElement = (element, countryCode, fetchedAt, query) => {
  const tags = element?.tags || {};
  const name = tags?.name || tags?.["name:en"];
  if (!name) return null;

  const center = toCenter(element);
  if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return null;

  const confidence = hasMonumentSignal(tags) ? "high" : "medium";
  const themedTags = ["research", "overpass", "tree", "fallback_tree"];
  if (hasMonumentSignal(tags)) themedTags.push("monument_tree");
  if (tags?.species) themedTags.push("species_tagged");
  if (tags?.denotation) themedTags.push(`denotation_${String(tags.denotation).toLowerCase()}`);

  return {
    type: "tree",
    name: String(name).trim(),
    normalized_name: normalizeName(name),
    country_code: countryCode,
    lat: center.lat,
    lng: center.lng,
    species: typeof tags?.species === "string" ? tags.species : null,
    description_short: "Fallback notable-tree candidate from OpenStreetMap natural=tree records.",
    lore_short: "A provisional notable tree marker, imported for local verification.",
    confidence,
    tags: Array.from(new Set(themedTags)),
    sources: [
      {
        source: "overpass",
        name: "OpenStreetMap Overpass",
        query,
        retrieved_at: fetchedAt,
        url: OVERPASS_URL,
        confidence,
        license_note: "ODbL 1.0 (OpenStreetMap contributors)",
      },
    ],
  };
};

export async function fetchOverpassNotableTreesFallback({ countryCode, bbox, limit = 220 }) {
  if (!bbox) return { candidates: [], source: "overpass_trees_fallback", error: "missing_bbox" };

  const query = overpassNotableTreesTemplateB(bbox);
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
      return { candidates: [], source: "overpass_trees_fallback", error: `http_${response.status}` };
    }

    const payload = await response.json();
    const elements = Array.isArray(payload?.elements) ? payload.elements : [];
    const candidates = [];
    const seen = new Set();

    for (const element of elements) {
      const candidate = candidateFromElement(element, countryCode, fetchedAt, query);
      if (!candidate) continue;
      const key = `${candidate.normalized_name}:${candidate.lat.toFixed(5)}:${candidate.lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(candidate);
      if (candidates.length >= limit) break;
    }

    return { candidates, source: "overpass_trees_fallback", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "overpass_trees_fallback",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

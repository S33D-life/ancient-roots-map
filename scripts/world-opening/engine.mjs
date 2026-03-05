import { getCountryBounds } from "./adapters/countryBounds.mjs";
import { fetchOverpassGroves } from "./adapters/overpassGroves.mjs";
import { fetchOverpassNotableTreesFallback } from "./adapters/overpassNotableTreesFallback.mjs";
import { fetchWdpaProtectedAreas } from "./adapters/wdpaProtectedAreas.mjs";
import { fetchWikidataNotableTrees } from "./adapters/wikidataNotableTrees.mjs";
import { fetchWikidataNaturalMonumentsFallback } from "./adapters/wikidataNaturalMonumentsFallback.mjs";
import { haversineMeters, inBounds, makeId, normalizeName, nowIso, slugify } from "./utils.mjs";
import { selectTopN } from "./selectTopN.mjs";

const normalizeProvenance = (sources, candidateConfidence) => {
  if (!Array.isArray(sources) || sources.length === 0) return [];
  return sources
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const source = typeof entry.source === "string" && entry.source
        ? entry.source
        : typeof entry.name === "string" && entry.name
          ? entry.name.toLowerCase().replace(/\s+/g, "_")
          : "unknown";
      const url = typeof entry.url === "string" ? entry.url : "";
      if (!url) return null;
      return {
        source,
        query: typeof entry.query === "string" ? entry.query : "",
        retrieved_at:
          typeof entry.retrieved_at === "string" && entry.retrieved_at
            ? entry.retrieved_at
            : nowIso(),
        url,
        confidence: entry.confidence || candidateConfidence || "medium",
        name: entry.name || source,
        license_note: entry.license_note || null,
      };
    })
    .filter((entry) => entry !== null);
};

const normalizeCandidate = (candidate, batchId) => {
  const normalizedName = normalizeName(candidate.name);
  const lat = candidate.lat != null ? Number(candidate.lat) : null;
  const lng = candidate.lng != null ? Number(candidate.lng) : null;
  const confidence = candidate.confidence || "medium";
  return {
    id: candidate.id || `${candidate.country_code.toLowerCase()}-${candidate.type}-${slugify(normalizedName)}-${makeId(candidate.type, normalizedName, lat ?? "na", lng ?? "na")}`,
    type: candidate.type,
    name: candidate.name,
    country_code: String(candidate.country_code || "").toUpperCase(),
    lat,
    lng,
    bbox: candidate.bbox || null,
    polygon: candidate.polygon || null,
    description_short: candidate.description_short || "Research candidate imported for verification.",
    lore_short: candidate.lore_short || null,
    species: candidate.species || null,
    status: "research",
    tags: Array.from(new Set([...(candidate.tags || []), "research"])),
    sources: normalizeProvenance(candidate.sources || [], confidence),
    created_by: "system_import",
    imported_batch_id: batchId,
    last_seen_at: nowIso(),
    normalized_name: normalizedName,
    confidence,
  };
};

const dedupeCandidates = (items) => {
  const out = [];

  for (const item of items) {
    const existing = out.find((base) => {
      if (base.country_code !== item.country_code || base.type !== item.type) return false;
      if (base.normalized_name !== item.normalized_name) return false;
      const distance = haversineMeters(
        { lat: base.lat, lng: base.lng },
        { lat: item.lat, lng: item.lng },
      );
      return Number.isFinite(distance) && distance <= 80;
    });

    if (!existing) {
      out.push(item);
      continue;
    }

    existing.tags = Array.from(new Set([...(existing.tags || []), ...(item.tags || [])]));
    const known = new Set((existing.sources || []).map((src) => `${src.source || "unknown"}:${src.url}`));
    for (const source of item.sources || []) {
      const key = `${source.source || "unknown"}:${source.url}`;
      if (!known.has(key)) {
        existing.sources.push(source);
        known.add(key);
      }
    }
    if (existing.confidence !== "high" && item.confidence === "high") {
      existing.confidence = "high";
    } else if (existing.confidence === "low" && item.confidence === "medium") {
      existing.confidence = "medium";
    }
    if (!existing.bbox && item.bbox) existing.bbox = item.bbox;
  }
  return out;
};

export async function generateCountrySeedPlan({
  countryCode,
  wikidataQid,
  limitGroves = 33,
  limitTrees = 33,
  batchId,
}) {
  const bounds = await getCountryBounds(countryCode);
  if (!bounds) {
    throw new Error(`No country bounds found for ${countryCode}`);
  }

  const adapterResults = [];
  const addResult = (name, result) => {
    adapterResults.push({
      adapter: name,
      count: result.candidates?.length || 0,
      error: result.error || null,
      fetched_at: result.fetchedAt || null,
    });
    return result.candidates || [];
  };

  const [overpassGroves, wdpa, wikidataTrees, overpassTreesFallback, wikidataNaturalMonumentsFallback] = await Promise.all([
    fetchOverpassGroves({ countryCode, bbox: bounds.bbox, limit: 250 }),
    fetchWdpaProtectedAreas({ countryCode, bbox: bounds.bbox, limit: 250 }),
    fetchWikidataNotableTrees({ countryCode, wikidataQid, limit: 200 }),
    fetchOverpassNotableTreesFallback({ countryCode, bbox: bounds.bbox, limit: 250 }),
    fetchWikidataNaturalMonumentsFallback({ countryCode, wikidataQid, limit: 250 }),
  ]);

  const groveCandidates = [
    ...addResult("overpass", overpassGroves),
    ...addResult("wdpa", wdpa),
  ]
    .filter((item) => item.type === "grove")
    .filter((item) => item.lat != null && item.lng != null && inBounds(item.lat, item.lng, bounds.bbox))
    .map((item) => normalizeCandidate(item, batchId));

  const treePrimary = addResult("wikidata_trees", wikidataTrees)
    .filter((item) => item.type === "tree")
    .filter((item) => item.lat != null && item.lng != null && inBounds(item.lat, item.lng, bounds.bbox))
    .map((item) => normalizeCandidate(item, batchId));

  const treeFallback = [
    ...addResult("overpass_trees_fallback", overpassTreesFallback),
    ...addResult("wikidata_natural_monuments_fallback", wikidataNaturalMonumentsFallback),
  ]
    .filter((item) => item.type === "tree" || item.type === "grove")
    .filter((item) => item.lat != null && item.lng != null && inBounds(item.lat, item.lng, bounds.bbox))
    .map((item) => (item.type === "grove" ? { ...item, type: "tree" } : item))
    .map((item) => normalizeCandidate(item, batchId));

  const groveFallbackPool = treeFallback.map((item) => ({
    ...item,
    id: item.id.replace("-tree-", "-grove-"),
    type: "grove",
    tags: Array.from(new Set([...(item.tags || []), "fallback_grove"])),
    description_short: "Fallback grove candidate derived from notable natural places in Wikidata.",
  }));

  const selectedGrovesPrimary = selectTopN(dedupeCandidates(groveCandidates), {
    limit: limitGroves,
    bbox: bounds.bbox,
    grid: 7,
    preferredTag: "wdpa",
    preferredMin: Math.min(limitGroves, 12),
    maxPerCell: 2,
  });

  const groveShortfall = Math.max(0, limitGroves - selectedGrovesPrimary.length);
  const selectedGrovesFallback = groveShortfall > 0
    ? selectTopN(
        dedupeCandidates(
          groveFallbackPool.filter(
            (candidate) =>
              !selectedGrovesPrimary.some(
                (base) => base.normalized_name === candidate.normalized_name,
              ),
          ),
        ),
        { limit: groveShortfall, bbox: bounds.bbox, grid: 7, maxPerCell: 2 },
      )
    : [];
  const selectedGroves = [...selectedGrovesPrimary, ...selectedGrovesFallback];

  const selectedTreesPrimary = selectTopN(dedupeCandidates(treePrimary), {
    limit: limitTrees,
    bbox: bounds.bbox,
    grid: 7,
    preferredTag: "notable_tree",
    preferredMin: Math.min(limitTrees, 16),
    maxPerCell: 2,
  });

  const treeShortfall = Math.max(0, limitTrees - selectedTreesPrimary.length);
  const fallbackTrees = treeShortfall > 0
    ? selectTopN(
        dedupeCandidates(
          treeFallback.filter(
            (candidate) =>
              !selectedTreesPrimary.some(
                (base) => base.normalized_name === candidate.normalized_name,
              ),
          ),
        ),
        { limit: treeShortfall, bbox: bounds.bbox, grid: 7, maxPerCell: 2 },
      )
    : [];

  const selectedTrees = [...selectedTreesPrimary, ...fallbackTrees];
  const nodes = [...selectedGroves, ...selectedTrees].map(({ normalized_name, ...node }) => node);

  return {
    country: {
      country_code: bounds.country_code,
      name: bounds.name,
      bbox: bounds.bbox,
      center: bounds.center,
    },
    adapter_results: adapterResults,
    selected: {
      groves: selectedGroves.length,
      trees: selectedTrees.length,
      target_groves: limitGroves,
      target_trees: limitTrees,
      wdpa_tagged_groves: selectedGroves.filter((node) => node.tags?.includes("wdpa")).length,
      fallback_groves_used: selectedGrovesFallback.length,
      fallback_trees_used: fallbackTrees.length,
      total: nodes.length,
    },
    nodes,
  };
}

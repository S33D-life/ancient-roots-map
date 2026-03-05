import { normalizeName, nowIso } from "../utils.mjs";

const WDPA_API_BASE = process.env.WDPA_API_BASE || "https://api.protectedplanet.net/v3/protected_areas/search";

const parseCentroid = (item) => {
  if (Array.isArray(item?.centroid?.coordinates) && item.centroid.coordinates.length >= 2) {
    const [lng, lat] = item.centroid.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  if (Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude)) {
    return { lat: Number(item.latitude), lng: Number(item.longitude) };
  }
  if (Number.isFinite(item?.lat) && Number.isFinite(item?.lng)) {
    return { lat: Number(item.lat), lng: Number(item.lng) };
  }
  return { lat: null, lng: null };
};

const parseBounds = (item) => {
  const bbox = item?.bbox || item?.bounding_box || null;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    const [west, south, east, north] = bbox.map(Number);
    if ([west, south, east, north].every(Number.isFinite)) {
      return { south, west, north, east };
    }
  }

  if (
    Number.isFinite(item?.min_lat) &&
    Number.isFinite(item?.min_lon) &&
    Number.isFinite(item?.max_lat) &&
    Number.isFinite(item?.max_lon)
  ) {
    return {
      south: Number(item.min_lat),
      west: Number(item.min_lon),
      north: Number(item.max_lat),
      east: Number(item.max_lon),
    };
  }
  return undefined;
};

const candidateFromWdpa = (item, countryCode, fetchedAt) => {
  const name = item?.name || item?.site_name || item?.title;
  if (!name) return null;

  const { lat, lng } = parseCentroid(item);
  const bbox = parseBounds(item);

  const category = String(item?.iucn_category || item?.designation || "").toUpperCase();
  const isStrictCategory = ["IA", "IB", "II", "III", "IV", "V", "VI"].includes(category);

  const tags = ["research", "wdpa", "protected_area", "grove"];
  if (category) tags.push(`iucn_${category.toLowerCase()}`);
  if (item?.marine === true) tags.push("marine");

  return {
    type: "grove",
    name: String(name).trim(),
    normalized_name: normalizeName(name),
    country_code: countryCode,
    lat,
    lng,
    bbox,
    description_short: "Authoritative protected-area candidate from Protected Planet (WDPA).",
    lore_short: "A conservation-grounded grove candidate awaiting local ecological verification.",
    confidence: isStrictCategory ? "high" : "medium",
    tags: Array.from(new Set(tags)),
    sources: [
      {
        name: "Protected Planet (WDPA)",
        url: item?.url || WDPA_API_BASE,
        retrieved_at: fetchedAt,
        license_note: "Protected Planet / UNEP-WCMC terms",
        confidence: isStrictCategory ? "high" : "medium",
      },
    ],
  };
};

export async function fetchWdpaProtectedAreas({ countryCode, bbox, limit = 220 }) {
  const token = process.env.WDPA_API_TOKEN || "";
  if (!token) {
    return { candidates: [], source: "wdpa", error: "missing_wdpa_api_token" };
  }

  const fetchedAt = nowIso();
  const [south, west, north, east] = bbox || [];
  const params = new URLSearchParams({
    iso3: String(countryCode || "").toUpperCase(),
    limit: String(Math.max(limit, 33)),
  });
  if ([south, west, north, east].every((v) => typeof v === "number")) {
    params.set("bbox", `${west},${south},${east},${north}`);
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort("timeout"), 20_000);

  try {
    const response = await fetch(`${WDPA_API_BASE}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "S33D-WorldOpeningEngine/1.0 (research seeding)",
      },
      signal: abort.signal,
    });

    if (!response.ok) {
      return { candidates: [], source: "wdpa", error: `http_${response.status}` };
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const candidates = [];
    const seen = new Set();
    for (const row of rows) {
      const candidate = candidateFromWdpa(row, countryCode, fetchedAt);
      if (!candidate) continue;
      const key = `${candidate.normalized_name}:${candidate.lat ?? "na"}:${candidate.lng ?? "na"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(candidate);
      if (candidates.length >= limit) break;
    }

    return { candidates, source: "wdpa", fetchedAt };
  } catch (error) {
    return {
      candidates: [],
      source: "wdpa",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

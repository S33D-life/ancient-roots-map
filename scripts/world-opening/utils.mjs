import crypto from "node:crypto";

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export const parseWktPoint = (wkt) => {
  if (!wkt || typeof wkt !== "string") return null;
  const match = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/i);
  if (!match) return null;
  const lng = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const inBounds = (lat, lng, bbox) => {
  if (!bbox) return true;
  return lat >= bbox[0] && lat <= bbox[2] && lng >= bbox[1] && lng <= bbox[3];
};

export const haversineMeters = (a, b) => {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
    return Number.POSITIVE_INFINITY;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa =
    s1 * s1 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
};

export const makeId = (...parts) => {
  const raw = parts.filter(Boolean).join(":");
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 20);
};

export const nowIso = () => new Date().toISOString();

export const scoreCandidate = (candidate) => {
  let score = 0;
  if (candidate.confidence === "high") score += 70;
  if (candidate.confidence === "medium") score += 45;
  if (candidate.confidence === "low") score += 25;
  if (candidate.lat != null && candidate.lng != null) score += 20;
  if (candidate.sources?.length) score += 10;
  if (candidate.tags?.includes("protected_area")) score += 8;
  if (candidate.tags?.includes("wdpa")) score += 14;
  if (candidate.tags?.includes("national_park")) score += 8;
  if (candidate.tags?.includes("nature_reserve")) score += 7;
  if (candidate.bbox) score += 4;
  if (candidate.tags?.includes("wikidata")) score += 6;
  return score;
};

export const distributionCellKey = (lat, lng, bbox, grid = 6) => {
  if (!bbox || lat == null || lng == null) return "unknown";
  const [south, west, north, east] = bbox;
  const latSpan = Math.max(0.0001, north - south);
  const lngSpan = Math.max(0.0001, east - west);
  const y = Math.max(0, Math.min(grid - 1, Math.floor(((lat - south) / latSpan) * grid)));
  const x = Math.max(0, Math.min(grid - 1, Math.floor(((lng - west) / lngSpan) * grid)));
  return `${x}:${y}`;
};

/** Shared geometry utilities for the map experience */

export interface TreeCoord {
  id: string;
  latitude: number;
  longitude: number;
  species: string;
  name: string;
  what3words: string;
  description?: string;
  created_by?: string;
  nation?: string;
  estimated_age?: number | null;
}

/** Haversine distance in km */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compute convex hull of [lng, lat] points using Graham scan */
export function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  function cross(O: [number, number], A: [number, number], B: [number, number]) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  }

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Expand a hull outward by bufferKm, smoothing corners */
export function expandHull(hull: [number, number][], bufferKm: number): [number, number][] {
  if (hull.length < 2) return hull;

  const result: [number, number][] = [];
  const n = hull.length;

  for (let i = 0; i < n; i++) {
    const [lng, lat] = hull[i];
    const cx = hull.reduce((s, p) => s + p[0], 0) / n;
    const cy = hull.reduce((s, p) => s + p[1], 0) / n;
    const dx = lng - cx;
    const dy = lat - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const normDx = dx / dist;
    const normDy = dy / dist;

    const baseAngle = Math.atan2(normDy, normDx);
    for (let j = -2; j <= 2; j++) {
      const angle = baseAngle + (j * Math.PI) / 10;
      const aLat = (bufferKm / 111.32) * Math.sin(angle);
      const aLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle);
      result.push([lng + aLng, lat + aLat]);
    }
  }

  const finalHull = convexHull(result);
  finalHull.push(finalHull[0]);
  return finalHull;
}

/** Create a buffered boundary around points (expand hull outward) */
export function createGroveBoundary(trees: TreeCoord[], bufferKm: number): GeoJSON.Feature | null {
  const points: [number, number][] = trees.map((t) => [t.longitude, t.latitude]);

  if (points.length === 0) return null;

  if (points.length === 1) {
    const [lng, lat] = points[0];
    const coords: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      const dLat = (bufferKm / 111.32) * Math.cos(angle);
      const dLng = (bufferKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
      coords.push([lng + dLng, lat + dLat]);
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    };
  }

  if (points.length === 2) {
    const hull = points;
    const expanded = expandHull(hull, bufferKm);
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [expanded] },
    };
  }

  const hull = convexHull(points);
  const expanded = expandHull(hull, bufferKm);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [expanded] },
  };
}

/** Determine continent from coordinates (rough bounding boxes) */
export function getContinent(lat: number, lng: number): string {
  if (lat > 15 && lat < 72 && lng > -25 && lng < 45) return "Europe";
  if (lat > -35 && lat < 37 && lng > -20 && lng < 55) return "Africa";
  if (lat > 5 && lat < 78 && lng > 45 && lng < 180) return "Asia";
  if (lat > -50 && lat < 5 && lng > 90 && lng < 180) return "Oceania";
  if (lat > -60 && lat < -10 && lng > 110 && lng < 180) return "Oceania";
  if (lat > 15 && lat < 85 && lng > -170 && lng < -50) return "North America";
  if (lat > -60 && lat < 15 && lng > -90 && lng < -30) return "South America";
  return "Other";
}

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

export const TIME_ATMOSPHERES: Record<TimeOfDay, {
  mapFilter: string;
  vignette: string;
  vignetteBoxShadow: string;
  ambientGlow: string;
  label: string;
}> = {
  dawn: {
    mapFilter: 'sepia(0.08) brightness(1.0)',
    vignette: 'radial-gradient(ellipse at center, transparent 70%, hsla(25, 50%, 25%, 0.08) 90%, hsla(20, 45%, 15%, 0.15) 100%)',
    vignetteBoxShadow: 'inset 0 0 40px 15px hsla(25, 45%, 18%, 0.1)',
    ambientGlow: 'none',
    label: 'Dawn',
  },
  day: {
    mapFilter: 'none',
    vignette: 'radial-gradient(ellipse at center, transparent 75%, hsla(35, 45%, 20%, 0.05) 95%, hsla(30, 40%, 12%, 0.1) 100%)',
    vignetteBoxShadow: 'inset 0 0 30px 10px hsla(30, 40%, 15%, 0.08)',
    ambientGlow: 'none',
    label: 'Day',
  },
  dusk: {
    mapFilter: 'sepia(0.1) brightness(0.95)',
    vignette: 'radial-gradient(ellipse at center, transparent 60%, hsla(20, 55%, 18%, 0.1) 85%, hsla(15, 50%, 10%, 0.2) 100%)',
    vignetteBoxShadow: 'inset 0 0 60px 20px hsla(20, 50%, 12%, 0.15)',
    ambientGlow: 'none',
    label: 'Dusk',
  },
  night: {
    mapFilter: 'sepia(0.1) brightness(0.85) hue-rotate(-5deg)',
    vignette: 'radial-gradient(ellipse at center, transparent 55%, hsla(240, 30%, 10%, 0.15) 80%, hsla(240, 35%, 5%, 0.3) 100%)',
    vignetteBoxShadow: 'inset 0 0 80px 30px hsla(240, 30%, 6%, 0.25)',
    ambientGlow: 'none',
    label: 'Starlight',
  },
};

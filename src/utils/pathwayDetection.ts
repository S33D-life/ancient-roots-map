/**
 * Mycelial Pathway Detection Engine — detects ecological corridors
 * between groves based on proximity, species coherence, and shared activity.
 */
import { haversineM } from "@/utils/groveDetection";

export type PathwayType = "local" | "species" | "migration" | "story" | "restoration";
export type PathwayStrength = "seed" | "forming" | "rooted" | "thriving" | "ancient_corridor";

export interface PathwayGroveRef {
  grove_id: string;
  name: string;
  grove_type: string;
  lat: number;
  lng: number;
  radius_m: number;
  tree_count: number;
  grove_strength_score: number;
  species_common?: string;
  visit_count?: number;
  offering_count?: number;
}

export interface PathwayCandidate {
  pathway_type: PathwayType;
  groves: PathwayGroveRef[];
  distance_km: number;
  strength_score: number;
  strength: PathwayStrength;
  species_common?: string;
  suggested_name: string;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  center: { lat: number; lng: number };
  waypoints: { lat: number; lng: number }[];
}

export const PATHWAY_STRENGTH_LABELS: Record<PathwayStrength, string> = {
  seed: "Seed Thread",
  forming: "Forming",
  rooted: "Rooted Corridor",
  thriving: "Thriving Corridor",
  ancient_corridor: "Ancient Corridor",
};

export const PATHWAY_STRENGTH_COLORS: Record<PathwayStrength, string> = {
  seed: "text-muted-foreground border-border",
  forming: "text-amber-600 border-amber-400/30",
  rooted: "text-emerald-600 border-emerald-400/30",
  thriving: "text-primary border-primary/30",
  ancient_corridor: "text-amber-500 border-amber-400/40",
};

const THRESHOLDS: Record<PathwayType, number> = {
  local: 20_000,      // 20 km
  species: 150_000,   // 150 km
  migration: 500_000, // 500 km
  story: 100_000,     // 100 km
  restoration: 200_000,
};

function scoreToStrength(score: number): PathwayStrength {
  if (score >= 80) return "ancient_corridor";
  if (score >= 55) return "thriving";
  if (score >= 35) return "rooted";
  if (score >= 15) return "forming";
  return "seed";
}

function suggestPathwayName(type: PathwayType, groves: PathwayGroveRef[]): string {
  const species = groves[0]?.species_common;
  const g1 = groves[0]?.name?.replace(/\s*(Grove|Cluster).*$/i, "").trim();
  const g2 = groves[groves.length - 1]?.name?.replace(/\s*(Grove|Cluster).*$/i, "").trim();

  if (type === "species" && species) {
    return `${species} Corridor`;
  }
  if (g1 && g2 && g1 !== g2) {
    return `${g1}–${g2} Path`;
  }
  if (g1) {
    return `${g1} Network`;
  }
  return "Unnamed Pathway";
}

/** Generate organic waypoints between two points for curved rendering */
function generateWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  segments: number = 5,
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [start];
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;

  // Perpendicular offset direction for organic curve
  const perpLat = -dLng * 0.08;
  const perpLng = dLat * 0.08;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    // Sine-based curve with slight randomness
    const curveFactor = Math.sin(t * Math.PI) * (0.8 + Math.random() * 0.4);
    points.push({
      lat: start.lat + dLat * t + perpLat * curveFactor,
      lng: start.lng + dLng * t + perpLng * curveFactor,
    });
  }

  points.push(end);
  return points;
}

function computePathwayScore(
  groveA: PathwayGroveRef,
  groveB: PathwayGroveRef,
  distanceM: number,
  type: PathwayType,
): number {
  const threshold = THRESHOLDS[type];

  // Proximity score — closer = stronger
  const proximityScore = Math.max(0, 1 - distanceM / threshold) * 35;

  // Grove strength average
  const groveAvg = (groveA.grove_strength_score + groveB.grove_strength_score) / 2;
  const groveScore = Math.min(25, groveAvg * 0.5);

  // Tree density
  const totalTrees = groveA.tree_count + groveB.tree_count;
  const treeScore = Math.min(20, totalTrees * 1.5);

  // Activity
  const totalActivity = (groveA.visit_count || 0) + (groveB.visit_count || 0) +
    (groveA.offering_count || 0) + (groveB.offering_count || 0);
  const activityScore = Math.min(20, totalActivity * 3);

  return Math.round(proximityScore + groveScore + treeScore + activityScore);
}

/** Detect local pathways between nearby groves */
function detectLocalPathways(groves: PathwayGroveRef[]): PathwayCandidate[] {
  const pathways: PathwayCandidate[] = [];
  const connected = new Set<string>();

  for (let i = 0; i < groves.length; i++) {
    for (let j = i + 1; j < groves.length; j++) {
      const a = groves[i];
      const b = groves[j];
      const dist = haversineM(a.lat, a.lng, b.lat, b.lng);

      if (dist > THRESHOLDS.local) continue;

      const pairKey = [a.grove_id, b.grove_id].sort().join("-");
      if (connected.has(pairKey)) continue;
      connected.add(pairKey);

      const score = computePathwayScore(a, b, dist, "local");
      if (score < 5) continue;

      const waypoints = generateWaypoints(
        { lat: a.lat, lng: a.lng },
        { lat: b.lat, lng: b.lng },
      );

      pathways.push({
        pathway_type: "local",
        groves: [a, b],
        distance_km: Math.round(dist / 100) / 10,
        strength_score: score,
        strength: scoreToStrength(score),
        suggested_name: suggestPathwayName("local", [a, b]),
        start: { lat: a.lat, lng: a.lng },
        end: { lat: b.lat, lng: b.lng },
        center: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
        waypoints,
      });
    }
  }

  return pathways.sort((a, b) => b.strength_score - a.strength_score);
}

/** Detect species pathways between same-species groves */
function detectSpeciesPathways(groves: PathwayGroveRef[]): PathwayCandidate[] {
  const pathways: PathwayCandidate[] = [];
  const connected = new Set<string>();

  // Group by species
  const bySpecies = new Map<string, PathwayGroveRef[]>();
  groves.forEach(g => {
    if (!g.species_common) return;
    const key = g.species_common.toLowerCase();
    if (!bySpecies.has(key)) bySpecies.set(key, []);
    bySpecies.get(key)!.push(g);
  });

  bySpecies.forEach((speciesGroves, speciesKey) => {
    if (speciesGroves.length < 2) return;

    for (let i = 0; i < speciesGroves.length; i++) {
      for (let j = i + 1; j < speciesGroves.length; j++) {
        const a = speciesGroves[i];
        const b = speciesGroves[j];
        const dist = haversineM(a.lat, a.lng, b.lat, b.lng);

        if (dist > THRESHOLDS.species) continue;

        const pairKey = [a.grove_id, b.grove_id].sort().join("-");
        if (connected.has(pairKey)) continue;
        connected.add(pairKey);

        const score = computePathwayScore(a, b, dist, "species") + 10; // species bonus
        if (score < 8) continue;

        const waypoints = generateWaypoints(
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        );

        pathways.push({
          pathway_type: "species",
          groves: [a, b],
          distance_km: Math.round(dist / 100) / 10,
          strength_score: Math.min(100, score),
          strength: scoreToStrength(score),
          species_common: a.species_common,
          suggested_name: suggestPathwayName("species", [a, b]),
          start: { lat: a.lat, lng: a.lng },
          end: { lat: b.lat, lng: b.lng },
          center: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
          waypoints,
        });
      }
    }
  });

  return pathways.sort((a, b) => b.strength_score - a.strength_score);
}

/** Main detection — returns all pathway candidates */
export function detectAllPathways(groves: PathwayGroveRef[]): {
  local: PathwayCandidate[];
  species: PathwayCandidate[];
  all: PathwayCandidate[];
} {
  const local = detectLocalPathways(groves).slice(0, 50);
  const species = detectSpeciesPathways(groves).slice(0, 50);
  const all = [...local, ...species].sort((a, b) => b.strength_score - a.strength_score);
  return { local, species, all };
}

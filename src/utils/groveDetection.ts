/**
 * Grove Detection Engine — detects local and species grove candidates
 * from existing tree records using proximity and species coherence.
 */

export interface GroveCandidate {
  grove_type: "local_grove" | "species_grove";
  trees: GroveTreeRef[];
  center: { lat: number; lng: number };
  radius_m: number;
  compactness_score: number;
  grove_strength_score: number;
  grove_strength: GroveStrength;
  species_scientific?: string;
  species_common?: string;
  suggested_name: string;
  country?: string;
  region?: string;
}

export interface GroveTreeRef {
  id: string;
  name: string;
  species?: string;
  species_common?: string;
  lat: number;
  lng: number;
  source: "trees" | "research_trees";
  visited?: boolean;
  verified?: boolean;
}

export type GroveStrength = "seed" | "forming" | "rooted" | "thriving" | "ancient_grove";

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in metres */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Compute centroid */
function centroid(trees: GroveTreeRef[]): { lat: number; lng: number } {
  const n = trees.length;
  return {
    lat: trees.reduce((s, t) => s + t.lat, 0) / n,
    lng: trees.reduce((s, t) => s + t.lng, 0) / n,
  };
}

/** Max distance from centroid */
function maxRadiusM(trees: GroveTreeRef[], center: { lat: number; lng: number }): number {
  return Math.max(...trees.map(t => haversineM(center.lat, center.lng, t.lat, t.lng)));
}

/** Average pairwise distance (sample for perf) */
function avgPairwiseM(trees: GroveTreeRef[]): number {
  if (trees.length < 2) return 0;
  let total = 0;
  let count = 0;
  const limit = Math.min(trees.length, 30); // cap for performance
  for (let i = 0; i < limit; i++) {
    for (let j = i + 1; j < limit; j++) {
      total += haversineM(trees[i].lat, trees[i].lng, trees[j].lat, trees[j].lng);
      count++;
    }
  }
  return total / count;
}

/** Classify grove strength from score */
export function classifyStrength(score: number): GroveStrength {
  if (score >= 85) return "ancient_grove";
  if (score >= 65) return "thriving";
  if (score >= 45) return "rooted";
  if (score >= 25) return "forming";
  return "seed";
}

/** Calculate grove strength score (0-100) */
function calculateStrengthScore(
  trees: GroveTreeRef[],
  compactness: number,
  isSpecies: boolean,
): number {
  const n = trees.length;

  // Tree count score (3=10, 6=25, 12=50, 24=75, 50+=100)
  const treeCountScore = Math.min(100, (n / 50) * 100);

  // Proximity score — tighter = higher (compactness 0-1 → 0-100)
  const proximityScore = compactness * 100;

  // Visit density
  const visitedCount = trees.filter(t => t.visited).length;
  const visitScore = n > 0 ? (visitedCount / n) * 100 : 0;

  // Verified presence
  const verifiedCount = trees.filter(t => t.verified).length;
  const verifiedScore = n > 0 ? (verifiedCount / n) * 100 : 0;

  // Species coherence (only for species groves)
  const speciesScore = isSpecies ? 100 : 0;

  // Weighted combination
  const weights = isSpecies
    ? { tree: 0.2, proximity: 0.3, visit: 0.1, verified: 0.1, species: 0.3 }
    : { tree: 0.3, proximity: 0.35, visit: 0.15, verified: 0.2, species: 0 };

  return Math.round(
    treeCountScore * weights.tree +
    proximityScore * weights.proximity +
    visitScore * weights.visit +
    verifiedScore * weights.verified +
    speciesScore * weights.species,
  );
}

/** Compactness score (0-1): 1 = very compact, 0 = very spread */
function compactnessScore(avgDistM: number): number {
  // 50m = 1.0, 500m = 0.7, 2km = 0.3, 10km = 0.05
  if (avgDistM <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - Math.log10(avgDistM / 50) / 2.5));
}

/** Generate a suggested grove name */
function suggestName(
  type: "local_grove" | "species_grove",
  trees: GroveTreeRef[],
  species?: string,
  region?: string,
): string {
  if (type === "species_grove" && species) {
    const prefix = region || "Ancient";
    return `${prefix} ${species} Grove`;
  }
  // Local grove: use dominant species if any
  const speciesCounts = new Map<string, number>();
  trees.forEach(t => {
    if (t.species) speciesCounts.set(t.species, (speciesCounts.get(t.species) || 0) + 1);
  });
  const dominant = [...speciesCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const prefix = region || "Local";
  if (dominant && dominant[1] >= trees.length * 0.5) {
    return `${prefix} ${dominant[0]} Grove`;
  }
  return `${prefix} Grove`;
}

/* ─── Local Grove Detection ─── */

const LOCAL_GROVE_RADIUS_M = 2000; // 2km max radius for local groves
const MIN_LOCAL_TREES = 3;

export function detectLocalGroves(
  trees: GroveTreeRef[],
  maxRadiusOverride?: number,
): GroveCandidate[] {
  const radius = maxRadiusOverride || LOCAL_GROVE_RADIUS_M;
  const candidates: GroveCandidate[] = [];
  const assigned = new Set<string>();

  // Sort by density — trees with most neighbors first
  const withNeighborCount = trees.map(t => ({
    tree: t,
    neighbors: trees.filter(
      o => o.id !== t.id && haversineM(t.lat, t.lng, o.lat, o.lng) <= radius,
    ).length,
  }));
  withNeighborCount.sort((a, b) => b.neighbors - a.neighbors);

  for (const { tree } of withNeighborCount) {
    if (assigned.has(tree.id)) continue;

    const nearby = trees.filter(
      o => !assigned.has(o.id) && haversineM(tree.lat, tree.lng, o.lat, o.lng) <= radius,
    );

    if (nearby.length < MIN_LOCAL_TREES) continue;

    const center = centroid(nearby);
    const rM = maxRadiusM(nearby, center);
    const avgDist = avgPairwiseM(nearby);
    const compact = compactnessScore(avgDist);
    const score = calculateStrengthScore(nearby, compact, false);

    // Get country/region from first tree if available
    candidates.push({
      grove_type: "local_grove",
      trees: nearby,
      center,
      radius_m: rM,
      compactness_score: compact,
      grove_strength_score: score,
      grove_strength: classifyStrength(score),
      suggested_name: suggestName("local_grove", nearby),
    });

    nearby.forEach(t => assigned.add(t.id));
  }

  return candidates.sort((a, b) => b.grove_strength_score - a.grove_strength_score);
}

/* ─── Species Grove Detection ─── */

const SPECIES_GROVE_MIN = 6;

export function detectSpeciesGroves(trees: GroveTreeRef[]): GroveCandidate[] {
  const candidates: GroveCandidate[] = [];

  // Group by species
  const bySpecies = new Map<string, GroveTreeRef[]>();
  trees.forEach(t => {
    if (!t.species) return;
    const key = t.species.toLowerCase();
    if (!bySpecies.has(key)) bySpecies.set(key, []);
    bySpecies.get(key)!.push(t);
  });

  for (const [, speciesTrees] of bySpecies) {
    if (speciesTrees.length < SPECIES_GROVE_MIN) continue;

    // For each tree, find nearest N same-species trees and evaluate compactness
    // Take the best cluster of 6, then try 12
    for (const targetSize of [12, 6]) {
      if (speciesTrees.length < targetSize) continue;

      // Find the densest cluster of targetSize trees
      let bestCluster: GroveTreeRef[] | null = null;
      let bestCompactness = -1;

      // Try each tree as a seed and pick nearest N-1
      const limit = Math.min(speciesTrees.length, 50); // cap iterations
      for (let i = 0; i < limit; i++) {
        const seed = speciesTrees[i];
        const sorted = speciesTrees
          .filter(t => t.id !== seed.id)
          .map(t => ({ tree: t, dist: haversineM(seed.lat, seed.lng, t.lat, t.lng) }))
          .sort((a, b) => a.dist - b.dist);

        const cluster = [seed, ...sorted.slice(0, targetSize - 1).map(s => s.tree)];
        const avgDist = avgPairwiseM(cluster);
        const compact = compactnessScore(avgDist);

        if (compact > bestCompactness) {
          bestCompactness = compact;
          bestCluster = cluster;
        }
      }

      if (!bestCluster || bestCompactness < 0.05) continue;

      // Check if this overlaps an already-found candidate for same species
      const existingForSpecies = candidates.find(
        c =>
          c.species_scientific === bestCluster![0].species &&
          c.trees.length === targetSize,
      );
      if (existingForSpecies) continue;

      const center = centroid(bestCluster);
      const rM = maxRadiusM(bestCluster, center);
      const score = calculateStrengthScore(bestCluster, bestCompactness, true);

      candidates.push({
        grove_type: "species_grove",
        trees: bestCluster,
        center,
        radius_m: rM,
        compactness_score: bestCompactness,
        grove_strength_score: score,
        grove_strength: classifyStrength(score),
        species_scientific: bestCluster[0].species,
        species_common: bestCluster[0].species_common,
        suggested_name: suggestName(
          "species_grove",
          bestCluster,
          bestCluster[0].species_common || bestCluster[0].species,
        ),
      });
    }
  }

  return candidates.sort((a, b) => b.grove_strength_score - a.grove_strength_score);
}

/** Detect both local and species groves */
export function detectAllGroves(trees: GroveTreeRef[]): {
  local: GroveCandidate[];
  species: GroveCandidate[];
} {
  return {
    local: detectLocalGroves(trees),
    species: detectSpeciesGroves(trees),
  };
}

/** Strength label for display */
export const STRENGTH_LABELS: Record<GroveStrength, string> = {
  seed: "Seed Grove",
  forming: "Forming",
  rooted: "Rooted",
  thriving: "Thriving",
  ancient_grove: "Ancient Grove",
};

export const STRENGTH_COLORS: Record<GroveStrength, string> = {
  seed: "bg-muted text-muted-foreground border-border",
  forming: "bg-accent/15 text-accent-foreground border-accent/30",
  rooted: "bg-primary/15 text-primary/80 border-primary/30",
  thriving: "bg-primary/25 text-primary border-primary/50",
  ancient_grove: "bg-primary/35 text-primary border-primary/60",
};

/**
 * Tree Similarity Engine — calculates how likely two tree records
 * represent the same physical tree.
 *
 * Signals & weights:
 *   location proximity → 60%
 *   species similarity → 25%
 *   name similarity    → 15%
 *
 * Returns a score 0–1 and descriptive confidence label.
 */

export interface SimilarityCandidate {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  photo_url?: string | null;
}

export interface SimilarityResult {
  tree: SimilarityCandidate;
  score: number;
  distanceM: number;
  confidence: "very_likely" | "possible" | "low";
}

/* ── Haversine distance (meters) ── */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Location score (0-1, 60% weight) ── */
function locationScore(distanceM: number): number {
  if (distanceM <= 15) return 1.0;
  if (distanceM <= 30) return 0.8;
  if (distanceM <= 60) return 0.5;
  if (distanceM <= 100) return 0.3;
  if (distanceM <= 200) return 0.15;
  return 0;
}

/* ── Species score (0-1, 25% weight) ── */
function speciesScore(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0.3; // unknown → neutral
  if (na === nb) return 1.0;
  // Check genus match (first word)
  const genusA = na.split(" ")[0];
  const genusB = nb.split(" ")[0];
  if (genusA.length > 2 && genusA === genusB) return 0.7;
  // Common name containment
  if (na.includes(nb) || nb.includes(na)) return 0.6;
  return 0;
}

/* ── Name score (0-1, 15% weight) ── */
function nameScore(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1.0;
  // Containment
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  // Simple word overlap (Jaccard-like)
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/* ── Main engine ── */

const W_LOCATION = 0.6;
const W_SPECIES = 0.25;
const W_NAME = 0.15;

export function calculateSimilarity(
  source: { name: string; species: string; latitude: number; longitude: number },
  candidate: SimilarityCandidate,
): SimilarityResult {
  const distanceM = haversineDistance(
    source.latitude, source.longitude,
    candidate.latitude, candidate.longitude,
  );

  const lScore = locationScore(distanceM);
  const sScore = speciesScore(source.species, candidate.species);
  const nScore = nameScore(source.name, candidate.name);

  const score = Math.min(1, W_LOCATION * lScore + W_SPECIES * sScore + W_NAME * nScore);

  let confidence: SimilarityResult["confidence"] = "low";
  if (score >= 0.75) confidence = "very_likely";
  else if (score >= 0.5) confidence = "possible";

  return { tree: candidate, score, distanceM, confidence };
}

/**
 * Find similar trees from a list of candidates.
 * Returns candidates with score ≥ minScore, sorted by score desc.
 */
export function findSimilarTrees(
  source: { name: string; species: string; latitude: number; longitude: number },
  candidates: SimilarityCandidate[],
  minScore = 0.4,
): SimilarityResult[] {
  return candidates
    .map((c) => calculateSimilarity(source, c))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Location Refinement — confidence scoring and clustering logic.
 *
 * Aggregates multiple GPS refinement proposals to produce a weighted
 * centroid and confidence level for a tree's canonical position.
 */
import { haversineKm } from "@/utils/mapGeometry";

export interface RefinementPoint {
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  at_trunk: boolean;
  source_type: string;
  user_id: string;
  weight: number;
}

export type LocationConfidence = "approximate" | "good" | "refined" | "trunk_confirmed";

export interface ClusterResult {
  centroidLat: number;
  centroidLng: number;
  confidence: LocationConfidence;
  totalWeight: number;
  pointCount: number;
  uniqueUsers: number;
  avgAccuracy: number;
  maxDriftM: number;
  suggestedUpdate: boolean;
}

/** Compute the weight for a refinement submission */
export function computeRefinementWeight(point: {
  accuracy_m: number | null;
  at_trunk: boolean;
  source_type: string;
}): number {
  let w = 1.0;

  // Better GPS accuracy → more weight
  const acc = point.accuracy_m ?? 100;
  if (acc <= 5) w += 2.0;
  else if (acc <= 10) w += 1.5;
  else if (acc <= 20) w += 1.0;
  else if (acc <= 50) w += 0.5;
  else if (acc > 100) w *= 0.3;

  // At trunk confirmation bonus
  if (point.at_trunk) w += 1.5;

  // Manual refinement (intentional) gets slight bonus
  if (point.source_type === "manual_refinement") w += 0.5;

  return Math.round(w * 100) / 100;
}

/** Cluster refinement points into a weighted centroid */
export function clusterRefinements(
  points: RefinementPoint[],
  currentLat: number,
  currentLng: number
): ClusterResult {
  if (points.length === 0) {
    return {
      centroidLat: currentLat,
      centroidLng: currentLng,
      confidence: "approximate",
      totalWeight: 0,
      pointCount: 0,
      uniqueUsers: 0,
      avgAccuracy: 0,
      maxDriftM: 0,
      suggestedUpdate: false,
    };
  }

  let totalWeight = 0;
  let wLat = 0;
  let wLng = 0;
  let accSum = 0;
  let accCount = 0;
  const userSet = new Set<string>();

  for (const p of points) {
    totalWeight += p.weight;
    wLat += p.latitude * p.weight;
    wLng += p.longitude * p.weight;
    userSet.add(p.user_id);
    if (p.accuracy_m != null) {
      accSum += p.accuracy_m;
      accCount++;
    }
  }

  const centroidLat = wLat / totalWeight;
  const centroidLng = wLng / totalWeight;
  const avgAccuracy = accCount > 0 ? Math.round(accSum / accCount) : 50;
  const uniqueUsers = userSet.size;

  // Max drift: furthest point from centroid
  let maxDriftM = 0;
  for (const p of points) {
    const d = haversineKm(centroidLat, centroidLng, p.latitude, p.longitude) * 1000;
    if (d > maxDriftM) maxDriftM = d;
  }
  maxDriftM = Math.round(maxDriftM);

  // Distance from current canonical position
  const driftFromCurrent = haversineKm(currentLat, currentLng, centroidLat, centroidLng) * 1000;

  // Determine confidence
  const hasTrunk = points.some((p) => p.at_trunk);
  let confidence: LocationConfidence = "approximate";

  if (hasTrunk && uniqueUsers >= 2 && avgAccuracy <= 15) {
    confidence = "trunk_confirmed";
  } else if (uniqueUsers >= 2 && avgAccuracy <= 30) {
    confidence = "refined";
  } else if (totalWeight >= 3 || avgAccuracy <= 20) {
    confidence = "good";
  }

  // Suggest update if: meaningful drift (>3m), decent confidence, not too scattered
  const suggestedUpdate =
    driftFromCurrent > 3 &&
    maxDriftM < 50 &&
    totalWeight >= 3 &&
    confidence !== "approximate";

  return {
    centroidLat: Math.round(centroidLat * 1e7) / 1e7,
    centroidLng: Math.round(centroidLng * 1e7) / 1e7,
    confidence,
    totalWeight: Math.round(totalWeight * 100) / 100,
    pointCount: points.length,
    uniqueUsers,
    avgAccuracy,
    maxDriftM,
    suggestedUpdate,
  };
}

/** Human-readable confidence label */
export const CONFIDENCE_LABELS: Record<LocationConfidence, { label: string; emoji: string }> = {
  approximate: { label: "Approximate", emoji: "📍" },
  good: { label: "Good", emoji: "🎯" },
  refined: { label: "Refined", emoji: "✨" },
  trunk_confirmed: { label: "Trunk-confirmed", emoji: "🌳" },
};

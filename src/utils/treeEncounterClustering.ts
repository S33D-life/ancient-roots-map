/**
 * Tree Encounter Clustering
 * Groups nearby tree entries with similar species/names into unified encounter clusters.
 * Uses haversine distance + string similarity for grouping.
 */

interface TreeLike {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  created_by: string | null;
  what3words?: string | null;
  description?: string | null;
  estimated_age?: number | null;
}

export interface EncounterCluster<T extends TreeLike = TreeLike> {
  /** The primary/anchor tree (earliest or most offerings) */
  anchor: T;
  /** All trees in this cluster, including the anchor */
  encounters: T[];
  /** Number of unique wanderers who contributed */
  wandererCount: number;
  /** Unique wanderer IDs */
  wandererIds: string[];
  /** Whether this is a genuine cluster (>1 entry) */
  isClustered: boolean;
}

const PROXIMITY_THRESHOLD_KM = 0.05; // ~50 meters
const NAME_SIMILARITY_THRESHOLD = 0.4;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Simple Jaccard-like word overlap similarity */
function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  return intersection / Math.max(wordsA.size, wordsB.size);
}

function speciesMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // Match if one contains the other (e.g., "English Oak" vs "Oak")
  return na.includes(nb) || nb.includes(na);
}

function shouldCluster<T extends TreeLike>(a: T, b: T): boolean {
  // Must have coordinates
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return false;

  // Must be same species family
  if (!speciesMatch(a.species, b.species)) return false;

  // Must be within proximity threshold
  const dist = haversineKm(
    Number(a.latitude), Number(a.longitude),
    Number(b.latitude), Number(b.longitude)
  );
  if (dist > PROXIMITY_THRESHOLD_KM) return false;

  // Name similarity bonus — if names are similar, cluster even at slightly larger distances
  const nameSim = nameSimilarity(a.name, b.name);
  if (nameSim >= NAME_SIMILARITY_THRESHOLD) return true;

  // Very close proximity (<20m) clusters regardless of name
  return dist <= 0.02;
}

/**
 * Cluster an array of trees into encounter groups.
 * Uses union-find for efficient grouping.
 */
export function clusterTrees<T extends TreeLike>(trees: T[]): EncounterCluster<T>[] {
  if (trees.length === 0) return [];

  // Union-find
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id);
    let p = parent.get(id)!;
    while (p !== parent.get(p)!) {
      parent.set(p, parent.get(parent.get(p)!)!);
      p = parent.get(p)!;
    }
    parent.set(id, p);
    return p;
  };
  const union = (a: string, b: string) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent.set(pa, pb);
  };

  // Initialize parents
  for (const t of trees) parent.set(t.id, t.id);

  // O(n²) pairwise comparison — acceptable for typical tree counts (<5000)
  for (let i = 0; i < trees.length; i++) {
    for (let j = i + 1; j < trees.length; j++) {
      if (shouldCluster(trees[i], trees[j])) {
        union(trees[i].id, trees[j].id);
      }
    }
  }

  // Group by root
  const groups = new Map<string, T[]>();
  for (const t of trees) {
    const root = find(t.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(t);
  }

  // Build clusters
  const clusters: EncounterCluster<T>[] = [];
  for (const [, members] of groups) {
    // Sort by created_at ascending — earliest entry is anchor
    members.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const wandererIds = [...new Set(members.map(m => m.created_by).filter(Boolean) as string[])];
    clusters.push({
      anchor: members[0],
      encounters: members,
      wandererCount: wandererIds.length,
      wandererIds,
      isClustered: members.length > 1,
    });
  }

  // Sort clusters by encounter count descending, then by anchor name
  clusters.sort((a, b) => b.encounters.length - a.encounters.length || a.anchor.name.localeCompare(b.anchor.name));

  return clusters;
}

/**
 * Find nearby encounters for a specific tree.
 * Used on the tree detail page.
 */
export function findNearbyEncounters<T extends TreeLike>(tree: T, allTrees: T[]): T[] {
  return allTrees.filter(t => t.id !== tree.id && shouldCluster(tree, t));
}

/**
 * Deduplicate trees for gallery display.
 * Returns clusters with the anchor representing the group.
 */
export function deduplicateForGallery<T extends TreeLike>(trees: T[]): EncounterCluster<T>[] {
  return clusterTrees(trees);
}

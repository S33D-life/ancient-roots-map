/**
 * mapVisitedTracker — Tracks which tree markers the user has tapped
 * during the current session. Adds a subtle ✓ badge via CSS class.
 */

const STORAGE_KEY = "s33d-visited-trees";

function getVisited(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVisited(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

/** Mark a tree as visited and apply CSS class to its marker element */
export function markTreeVisited(treeId: string, markerElement?: HTMLElement | null) {
  const visited = getVisited();
  if (visited.has(treeId)) return;
  visited.add(treeId);
  saveVisited(visited);

  if (markerElement) {
    const wrap = markerElement.closest(".leaflet-tree-marker") || markerElement;
    wrap.classList.add("marker-visited");
  }
}

/** Check if a tree has been visited this session */
export function isTreeVisited(treeId: string): boolean {
  return getVisited().has(treeId);
}

/** Apply visited class to a marker element if the tree was previously visited */
export function applyVisitedClass(treeId: string, markerElement: HTMLElement) {
  if (isTreeVisited(treeId)) {
    const wrap = markerElement.closest(".leaflet-tree-marker") || markerElement;
    wrap.classList.add("marker-visited");
  }
}

/** Get count of visited trees this session */
export function getVisitedCount(): number {
  return getVisited().size;
}

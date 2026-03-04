/**
 * useMapMemory — Persists map viewport & filter state across navigation.
 *
 * Saves to sessionStorage so the map reopens where the user left it,
 * unless explicit deep-link params override.
 *
 * Usage:
 *   const { save, restore, hasMemory } = useMapMemory();
 *   // On moveend / filter change → save(...)
 *   // On init without deep-link params → restore()
 */

const STORAGE_KEY = "s33d_map_memory";

export interface MapMemory {
  lat: number;
  lng: number;
  zoom: number;
  species?: string[];
  selectedTreeId?: string;
  timestamp: number;
}

/** Save map state — call on moveend / filter change (debounced) */
export function saveMapMemory(memory: Omit<MapMemory, "timestamp">) {
  try {
    const entry: MapMemory = { ...memory, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage unavailable (private browsing, quota) — silent
  }
}

/** Restore last map state — returns null if nothing stored or stale (>4h) */
export function restoreMapMemory(): MapMemory | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const memory: MapMemory = JSON.parse(raw);
    // Expire after 4 hours
    if (Date.now() - memory.timestamp > 4 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Validate coords
    if (
      typeof memory.lat !== "number" ||
      typeof memory.lng !== "number" ||
      typeof memory.zoom !== "number"
    ) {
      return null;
    }
    return memory;
  } catch {
    return null;
  }
}

/** Check if memory exists without parsing */
export function hasMapMemory(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Clear map memory (used when user explicitly resets the map) */
export function clearMapMemory() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

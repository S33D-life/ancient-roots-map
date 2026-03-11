/**
 * Generic Offline Sync Queue — stores any pending mutation
 * in IndexedDB when offline, and syncs when connectivity returns.
 *
 * Supported record types: tree, offering, checkin, note
 */

const DB_NAME = "s33d_offline";
const DB_VERSION = 2; // bumped from v1 (tree-only) to v2 (generic)
const STORE_NAME = "pending_actions";

export type PendingActionType = "tree" | "offering" | "checkin" | "note";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  status: SyncStatus;
  /** Supabase table to insert into */
  table: string;
  /** The row payload (minus server-generated fields) */
  payload: Record<string, unknown>;
  /** Base64 photo data for offline storage (if applicable) */
  photoDataUrl?: string;
  /** Storage bucket + path for the photo */
  photoStoragePath?: string;
  /** Number of sync attempts so far */
  attempts: number;
  /** Last error message */
  lastError?: string;
  /** ISO timestamp when queued */
  queuedAt: string;
  /** ISO timestamp of last sync attempt */
  lastAttemptAt?: string;
  /** User-facing label for the sync banner */
  label: string;
}

// ── IndexedDB helpers ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Keep legacy store if it exists (migration-safe)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_status", "status", { unique: false });
        store.createIndex("by_type", "type", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue a new action for offline sync */
export async function queueAction(action: PendingAction): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Update an existing action (e.g. status change) */
export async function updateAction(action: PendingAction): Promise<void> {
  return queueAction(action); // put() upserts by keyPath
}

/** Get all pending actions */
export async function getAllActions(): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Get actions by status */
export async function getActionsByStatus(status: SyncStatus): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const idx = tx.objectStore(STORE_NAME).index("by_status");
    const req = idx.getAll(status);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a synced action */
export async function removeAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Count all pending (not yet synced) */
export async function pendingActionCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const idx = tx.objectStore(STORE_NAME).index("by_status");
    const req = idx.count("pending");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Count by type */
export async function countByType(): Promise<Record<PendingActionType, number>> {
  const all = await getAllActions();
  const counts: Record<string, number> = { tree: 0, offering: 0, checkin: 0, note: 0 };
  for (const a of all) {
    if (a.status !== "synced") {
      counts[a.type] = (counts[a.type] || 0) + 1;
    }
  }
  return counts as Record<PendingActionType, number>;
}

/** Helper: generate a unique ID for offline records */
export function offlineId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Check connectivity */
export function isOnline(): boolean {
  return navigator.onLine;
}

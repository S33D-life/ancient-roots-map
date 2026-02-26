/**
 * Offline Tree Submission Queue — stores pending tree submissions
 * in IndexedDB when the user is offline, and syncs them when
 * connectivity returns.
 */

const DB_NAME = "s33d_offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_trees";

export interface PendingTree {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  what3words: string;
  description?: string;
  photo_data_url?: string; // base64 photo for offline storage
  created_by?: string;
  queued_at: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue a tree submission for later sync */
export async function queueTree(tree: PendingTree): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(tree);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all pending trees */
export async function getPendingTrees(): Promise<PendingTree[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a synced tree from the queue */
export async function removePendingTree(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Count pending items */
export async function pendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Check if online */
export function isOnline(): boolean {
  return navigator.onLine;
}

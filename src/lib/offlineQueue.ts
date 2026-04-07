/**
 * offlineQueue — lightweight localStorage-based queue for offline actions.
 * Stores check-in and heart-collect intents when offline, syncs when back.
 */

const QUEUE_KEY = "s33d-offline-queue";

export interface OfflineAction {
  id: string;
  type: "checkin" | "heart_collect";
  treeId: string;
  userId: string;
  timestamp: number;
  payload?: Record<string, any>;
}

export function getQueue(): OfflineAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineAction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function enqueue(action: Omit<OfflineAction, "id" | "timestamp">) {
  const queue = getQueue();
  queue.push({
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export function dequeue(id: string) {
  const queue = getQueue().filter(a => a.id !== id);
  saveQueue(queue);
}

export function clearQueue() {
  try { localStorage.removeItem(QUEUE_KEY); } catch {}
}

/** Whether the browser is currently online */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Process queued actions when back online.
 * Returns the number of actions processed.
 */
export async function syncQueue(
  handlers: {
    checkin?: (action: OfflineAction) => Promise<boolean>;
    heart_collect?: (action: OfflineAction) => Promise<boolean>;
  }
): Promise<number> {
  if (!isOnline()) return 0;
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let processed = 0;
  for (const action of queue) {
    const handler = handlers[action.type];
    if (!handler) { dequeue(action.id); continue; }
    try {
      const ok = await handler(action);
      if (ok) { dequeue(action.id); processed++; }
    } catch {
      // Leave in queue for next attempt
    }
  }
  return processed;
}

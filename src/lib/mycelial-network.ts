export type MycelialPoint = {
  lat: number;
  lng: number;
};

export type MycelialThreadEvent = {
  id?: string;
  createdAt?: string;
  targetTreeId?: string;
  targetTreeName?: string;
  from?: MycelialPoint | null;
  to?: MycelialPoint | null;
  source: "whisper";
};

const EVENT_NAME = "s33d:mycelial-thread";
const QUEUE_KEY = "s33d:mycelial-thread-queue";
const QUEUE_LIMIT = 30;

function readQueue(): MycelialThreadEvent[] {
  try {
    const raw = window.sessionStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: MycelialThreadEvent[]) {
  try {
    window.sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_LIMIT)));
  } catch {
    // Ignore storage failures for private browsing or quota constraints.
  }
}

export function emitMycelialThread(event: MycelialThreadEvent) {
  if (typeof window === "undefined") return;
  const payload: MycelialThreadEvent = {
    ...event,
    createdAt: event.createdAt || new Date().toISOString(),
    id: event.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent<MycelialThreadEvent>(EVENT_NAME, { detail: payload }));
}

export function consumeQueuedMycelialThreads(): MycelialThreadEvent[] {
  if (typeof window === "undefined") return [];
  const queue = readQueue();
  if (queue.length > 0) {
    try {
      window.sessionStorage.removeItem(QUEUE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
  return queue;
}

export function onMycelialThread(handler: (event: MycelialThreadEvent) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (e: Event) => {
    const custom = e as CustomEvent<MycelialThreadEvent>;
    if (custom.detail) handler(custom.detail);
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(EVENT_NAME, listener as EventListener);
}

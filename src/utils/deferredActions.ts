/**
 * deferredActions — Utilities for deferring non-critical work
 * off the user's critical path using requestIdleCallback / setTimeout.
 *
 * Also includes helpers for tracking compute metrics client-side.
 */

type DeferredFn = () => void | Promise<void>;

const deferredQueue: DeferredFn[] = [];
let draining = false;

/**
 * Schedule a function to run when the browser is idle.
 * Falls back to setTimeout(fn, 100) if requestIdleCallback is unavailable.
 */
export function deferAction(fn: DeferredFn): void {
  deferredQueue.push(fn);
  if (!draining) {
    draining = true;
    scheduleFlush();
  }
}

function scheduleFlush(): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(flushQueue, { timeout: 2000 });
  } else {
    setTimeout(flushQueue, 100);
  }
}

function flushQueue(): void {
  const batch = deferredQueue.splice(0, 5); // process up to 5 at a time
  batch.forEach((fn) => {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.catch((err) => console.warn("[deferredAction] async error:", err));
      }
    } catch (err) {
      console.warn("[deferredAction] error:", err);
    }
  });

  if (deferredQueue.length > 0) {
    scheduleFlush();
  } else {
    draining = false;
  }
}

/**
 * Track a compute metric (fire-and-forget via deferred action).
 * Does NOT block the UI.
 */
export function trackMetric(
  metricType: string,
  metricKey: string,
  value: number = 1,
  metadata?: Record<string, unknown>
): void {
  deferAction(async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("compute_metrics").insert([{
        metric_type: metricType,
        metric_key: metricKey,
        value,
        metadata: metadata ? (metadata as any) : undefined,
      }]);
    } catch {
      // silently fail — metrics are non-critical
    }
  });
}

/**
 * Debounce wrapper that returns a cancel-able debounced function.
 * Useful for deferring non-critical re-computations.
 */
export function createDeferredDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as T & { cancel: () => void };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

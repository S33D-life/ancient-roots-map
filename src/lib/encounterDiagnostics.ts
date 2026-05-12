/**
 * Encounter diagnostics — small in-memory ring buffer of structured log entries
 * for the Collect / Plant flow. Survives across actions in the same tab so the
 * user can export the full sequence (GPS fix, accuracy, distance, radius,
 * Supabase error codes, retries, override usage) for support.
 *
 * Persistence: also mirrored to sessionStorage so a tab refresh keeps the log.
 */

export type EncounterLogEvent =
  | "attempt_start"          // a flow started (plant or collect)
  | "gps_attempt"            // a single GPS retry attempt began
  | "gps_fix"                // we got a GPS fix
  | "gps_error"              // a GPS error occurred
  | "rpc_call"               // about to call the proximity RPC
  | "rpc_response"           // RPC returned (ok or blocked)
  | "rpc_error"              // RPC threw
  | "result_ok"              // final success
  | "result_failed"          // final failure (after explanation)
  | "override_used";         // approximate-location override was applied

export interface EncounterLogEntry {
  ts: string;                // ISO timestamp
  flow: "plant" | "collect";
  event: EncounterLogEvent;
  // Free-form structured payload — kept small and JSON-serialisable.
  data?: Record<string, unknown>;
}

const STORAGE_KEY = "s33d:encounter-diag-log";
const MAX_ENTRIES = 200;

let buffer: EncounterLogEntry[] = loadFromSession();
const listeners = new Set<() => void>();

function loadFromSession(): EncounterLogEntry[] {
  try {
    if (typeof sessionStorage === "undefined") return [];
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    // sessionStorage may be unavailable (privacy mode) — log only in-memory
  }
}

function notify() {
  for (const fn of listeners) fn();
}

export function logEncounterEvent(
  flow: "plant" | "collect",
  event: EncounterLogEvent,
  data?: Record<string, unknown>,
) {
  const entry: EncounterLogEntry = {
    ts: new Date().toISOString(),
    flow,
    event,
    data,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
  persist();
  notify();
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[encounter-diag] ${flow}/${event}`, data ?? {});
  }
}

export function getEncounterLog(): EncounterLogEntry[] {
  return buffer.slice();
}

export function clearEncounterLog() {
  buffer = [];
  persist();
  notify();
}

export function subscribeEncounterLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Build a human-readable text export of the log. */
export function buildEncounterLogText(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "n/a";
  const header =
    `S33D · Encounter Diagnostics Log\n` +
    `Exported: ${new Date().toISOString()}\n` +
    `User-Agent: ${ua}\n` +
    `Entries: ${buffer.length}\n` +
    `${"-".repeat(60)}\n`;
  const lines = buffer.map((e) => {
    const data = e.data ? ` ${JSON.stringify(e.data)}` : "";
    return `${e.ts}  ${e.flow.padEnd(7)} ${e.event.padEnd(16)}${data}`;
  });
  return header + lines.join("\n") + "\n";
}

export function buildEncounterLogJSON(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      platform: typeof navigator !== "undefined" ? navigator.platform : null,
      entries: buffer,
    },
    null,
    2,
  );
}

/** Trigger a browser download of the log. */
export function downloadEncounterLog(format: "txt" | "json" = "txt") {
  const isJson = format === "json";
  const content = isJson ? buildEncounterLogJSON() : buildEncounterLogText();
  const mime = isJson ? "application/json" : "text/plain";
  const ext = isJson ? "json" : "txt";
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `s33d-encounter-log-${stamp}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy the human-readable export to the clipboard. Returns success. */
export async function copyEncounterLog(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildEncounterLogText());
    return true;
  } catch {
    return false;
  }
}

/**
 * Lightweight client telemetry.
 *
 * Pre-publish: console-only sink (visible to debug users) + a tiny in-memory
 * ring buffer that any future backend wire-up can drain. No PII, no offering /
 * whisper content, no coordinates — just action shape + reason codes.
 *
 * Wire a real sink later by replacing `dispatch()` with a Supabase insert
 * into a `telemetry_events` table.
 */

import { isDevHost } from "./env";

export type TelemetryEvent =
  | "signup_started"
  | "verification_sent"
  | "verification_resent"
  | "verification_completed"
  | "password_reset_sent"
  | "heart_planted"
  | "heart_collect_failed"
  | "whisper_sent"
  | "whisper_failed"
  | "checkin_made"
  | "checkin_failed"
  | "offering_made"
  | "offering_failed"
  | "gps_denied"
  | "gps_timeout"
  | "gps_poor_accuracy"
  | "too_far"
  | "rpc_error"
  | "override_used"
  | "admin_room_opened"
  | "admin_users_viewed"
  | "evolution_dashboard_opened"
  | "moonroot_digest_opened"
  | "moonroot_digest_previewed"
  | "moonroot_digest_regenerated"
  | "artizen_readiness_opened";

export interface TelemetryPayload {
  reason?: string | null;
  treeId?: string | null;
  userId?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
}

interface BufferedEntry extends TelemetryPayload {
  ts: string;
  event: TelemetryEvent;
  platform: string;
}

const BUFFER_LIMIT = 100;
const buffer: BufferedEntry[] = [];

function platform(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent || "unknown";
}

function dispatch(entry: BufferedEntry): void {
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
  if (isDevHost()) {
    // Only dev / preview / keepers see this in console.
    // eslint-disable-next-line no-console
    console.info("[telemetry]", entry.event, entry.reason ?? "ok", entry);
  }
}

/**
 * Fire-and-forget; never throws. Safe to call from any code path.
 */
export function track(event: TelemetryEvent, payload: TelemetryPayload = {}): void {
  try {
    dispatch({
      ts: new Date().toISOString(),
      event,
      platform: platform(),
      ...payload,
    });
  } catch {
    /* swallow — telemetry must never break UX */
  }
}

/** For dev surfaces (debug panel, future export). */
export function getTelemetryBuffer(): readonly BufferedEntry[] {
  return buffer;
}

/**
 * Invite funnel analytics — fire-and-forget client logger.
 *
 * Privacy: we hash the invite code (SHA-256) before sending. We never store
 * the raw code in the analytics table, so a leaked event row cannot be
 * replayed against the invite system.
 *
 * Events tracked (canonical names):
 *   invite_link_opened         — user landed on /auth?invite=...
 *   invite_code_detected       — code was found in URL or persisted storage
 *   invite_validation_success  — validate_invite_code RPC returned a row
 *   invite_validation_failed   — RPC returned no row / errored
 *   invite_signup_started      — supabase.auth.signUp call about to fire
 *   invite_signup_success      — signUp returned without error
 *   invite_consumed            — consume_invitation succeeded post-session
 *   invite_consume_failed      — consume_invitation errored or no-op
 *   invite_return_to_grove     — user clicked "Return to Grove" on bloom failure
 *   invite_request_fresh_clicked — user clicked "Request fresh invite"
 */
import { supabase } from "@/integrations/supabase/client";

export type InviteEventName =
  | "invite_link_opened"
  | "invite_code_detected"
  | "invite_validation_success"
  | "invite_validation_failed"
  | "invite_signup_started"
  | "invite_signup_success"
  | "invite_consumed"
  | "invite_consume_failed"
  | "invite_return_to_grove"
  | "invite_request_fresh_clicked";

export type InviteEventSource =
  | "url"
  | "storage"
  | "oauth_return"
  | "manual"
  | "system";

interface TrackOptions {
  /** The raw invite code (will be hashed before transmission). */
  code?: string | null;
  /** Where the code came from. */
  source?: InviteEventSource;
  /** User id when known (e.g. after a session is established). */
  userId?: string | null;
  /** Extra structured data — keep small and non-sensitive. */
  metadata?: Record<string, unknown>;
}

/**
 * SHA-256 hex digest using the Web Crypto API. Falls back to a marker string
 * if crypto.subtle is unavailable (very old browsers / SSR).
 */
async function hashCode(code: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = new TextEncoder().encode(code);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* ignore */
  }
  return `nohash:${code.length}`;
}

function safeUserAgent(): string | null {
  try {
    return typeof navigator !== "undefined" ? navigator.userAgent : null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget: never throws, never blocks the caller.
 * Logs to console for local debugging and writes a row to
 * `invite_analytics_events` (anon-insert allowed by RLS).
 */
export async function trackInviteEvent(
  event: InviteEventName,
  opts: TrackOptions = {},
): Promise<void> {
  const payload = {
    event_name: event,
    invite_code_hash: opts.code ? await hashCode(opts.code) : null,
    source: opts.source ?? null,
    user_id: opts.userId ?? null,
    user_agent: safeUserAgent(),
    metadata: {
      ...(opts.metadata ?? {}),
      ts_client: new Date().toISOString(),
    },
  };

  // Console mirror — useful for QA and Safari debugging.
  // eslint-disable-next-line no-console
  console.log("[invite-analytics]", event, {
    source: payload.source,
    hash: payload.invite_code_hash?.slice(0, 8),
    userId: payload.user_id,
  });

  try {
    await supabase.from("invite_analytics_events").insert(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[invite-analytics] insert failed", err);
  }
}

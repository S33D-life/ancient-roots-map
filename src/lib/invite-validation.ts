/**
 * Invitation validation — single source of truth for signup gating.
 *
 * S33D is invitation-only. A prospective Wanderer has no session yet, and the
 * `invite_links` table restricts SELECT to the invite's creator, so an
 * anonymous visitor can never read the row directly. Validation therefore goes
 * through the SECURITY DEFINER RPC `check_invite_code`, which returns only a
 * status string and (optionally) the expiry — never the row itself.
 *
 * Statuses map 1:1 with the database function.
 */
import { supabase } from "@/integrations/supabase/client";

export type InviteStatus =
  | "idle"
  | "checking"
  | "valid"
  | "used"
  | "expired"
  | "revoked"
  | "not_found"
  | "malformed"
  | "inviter_exhausted"
  | "lookup_error";

export interface InviteCheck {
  status: InviteStatus;
  expiresAt: string | null;
  /** Short, developer-facing reason. Never shown as the primary user message. */
  detail: string;
}

/** Codes are hex and case-insensitive; links sometimes carry stray whitespace. */
export function normalizeInviteCode(raw: string): string {
  return (raw ?? "").trim().toLowerCase();
}

const DETAIL: Record<string, string> = {
  valid: "invite exists → active → unused → expiry OK",
  used: "invite exists → already redeemed (or use limit reached)",
  expired: "invite exists → expiry date has passed",
  revoked: "invite exists → withdrawn by its creator",
  not_found: "no invitation matches this code",
  malformed: "no invitation code entered",
  inviter_exhausted: "invite exists → but the inviter has no invitations left",
  lookup_error: "validation lookup failed (network or permission)",
};

export function inviteDetail(status: InviteStatus): string {
  return DETAIL[status] ?? status;
}

export async function checkInviteCode(rawCode: string): Promise<InviteCheck> {
  const code = normalizeInviteCode(rawCode);
  if (!code) {
    return { status: "malformed", expiresAt: null, detail: DETAIL.malformed };
  }

  const { data, error } = await supabase.rpc("check_invite_code", { p_code: code });

  if (import.meta.env.DEV) {
    // Dev-only: never logs the code itself in production builds.
    console.log("[invite] check", { code, data, error: error?.message ?? null });
  }

  if (error) {
    return { status: "lookup_error", expiresAt: null, detail: `${DETAIL.lookup_error}: ${error.message}` };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { status?: string; expires_at?: string | null }
    | undefined;

  const status = (row?.status as InviteStatus) ?? "not_found";
  return {
    status,
    expiresAt: row?.expires_at ?? null,
    detail: inviteDetail(status),
  };
}

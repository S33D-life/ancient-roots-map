/**
 * Council participation — server-synced with localStorage write-through cache.
 *
 * Server is source of truth (table: user_council_participation, RPC:
 * claim_council_participation). localStorage is a fast-path cache so the
 * UI can render instantly while the server confirms.
 *
 * Each record carries a `syncState` so the UI can show:
 *   • "synced"     — confirmed on the server (Hearts safe across devices)
 *   • "syncing"    — write in flight
 *   • "local_only" — offline / RPC failed; will retry on next claim attempt
 */
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "s33d_council_participation";

export type ParticipationSyncState = "synced" | "syncing" | "local_only";

export interface CouncilParticipation {
  sessionId: string;
  status: "participated" | "rewarded";
  heartsAmount: number;
  claimedAt: string;
  syncState: ParticipationSyncState;
  ledgerEntryId?: string | null;
}

export const COUNCIL_HEARTS_REWARD = 11;

// ── Local cache ────────────────────────────────────────────
function readAll(): Record<string, CouncilParticipation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CouncilParticipation>>;
    // Migrate legacy records (no syncState) — treat as local_only until proven.
    const out: Record<string, CouncilParticipation> = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = {
        sessionId: v.sessionId ?? k,
        status: (v.status as CouncilParticipation["status"]) ?? "rewarded",
        heartsAmount: v.heartsAmount ?? COUNCIL_HEARTS_REWARD,
        claimedAt: v.claimedAt ?? new Date().toISOString(),
        syncState: v.syncState ?? "local_only",
        ledgerEntryId: v.ledgerEntryId ?? null,
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, CouncilParticipation>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be full / blocked — server is still source of truth.
  }
}

function upsertLocal(record: CouncilParticipation) {
  const all = readAll();
  all[record.sessionId] = record;
  writeAll(all);
}

// ── Public reads (sync, cache-only — for instant UI) ──────
export function hasParticipatedInCouncil(sessionId: string): boolean {
  return sessionId in readAll();
}

export function getCouncilParticipation(sessionId: string): CouncilParticipation | null {
  return readAll()[sessionId] ?? null;
}

export function getAllCouncilParticipation(): CouncilParticipation[] {
  return Object.values(readAll());
}

export function getParticipationSummary() {
  const all = getAllCouncilParticipation();
  return {
    totalGathered: all.length,
    totalHearts: all.reduce((sum, p) => sum + p.heartsAmount, 0),
  };
}

// ── Server-backed claim ────────────────────────────────────

export interface ClaimResult {
  ok: boolean;
  syncState: ParticipationSyncState;
  /** Stable code from RPC: claimed | already_claimed | unauthenticated | server_error | network_error */
  code: string;
  message?: string;
  participation: CouncilParticipation;
}

/**
 * Claim council participation. Idempotent on the server.
 *
 * Behaviour:
 *   1. Optimistically write to localStorage with syncState=syncing.
 *   2. Call the RPC.
 *   3. On success → update cache to syncState=synced.
 *   4. On network error → keep cache as syncState=local_only (caller can retry).
 *   5. On unauthenticated → reject (UI should prompt sign-in).
 */
export async function claimCouncilParticipation(
  sessionId: string,
  amount: number = COUNCIL_HEARTS_REWARD,
): Promise<ClaimResult> {
  const optimistic: CouncilParticipation = {
    sessionId,
    status: "rewarded",
    heartsAmount: amount,
    claimedAt: new Date().toISOString(),
    syncState: "syncing",
    ledgerEntryId: null,
  };
  upsertLocal(optimistic);

  try {
    const { data, error } = await supabase.rpc("claim_council_participation", {
      p_session_key: sessionId,
      p_hearts: amount,
    });

    if (error) {
      const failed: CouncilParticipation = { ...optimistic, syncState: "local_only" };
      upsertLocal(failed);
      return {
        ok: false,
        syncState: "local_only",
        code: "network_error",
        message: error.message,
        participation: failed,
      };
    }

    const result = (data ?? {}) as {
      success?: boolean;
      code?: string;
      message?: string;
      hearts_awarded?: number;
      ledger_entry_id?: string | null;
      claimed_at?: string;
    };

    if (result.success) {
      const synced: CouncilParticipation = {
        sessionId,
        status: "rewarded",
        heartsAmount: result.hearts_awarded ?? amount,
        claimedAt: result.claimed_at ?? optimistic.claimedAt,
        syncState: "synced",
        ledgerEntryId: result.ledger_entry_id ?? null,
      };
      upsertLocal(synced);
      return {
        ok: true,
        syncState: "synced",
        code: result.code ?? "claimed",
        message: result.message,
        participation: synced,
      };
    }

    // RPC returned a structured failure (e.g. unauthenticated).
    const failed: CouncilParticipation = { ...optimistic, syncState: "local_only" };
    upsertLocal(failed);
    return {
      ok: false,
      syncState: "local_only",
      code: result.code ?? "server_error",
      message: result.message,
      participation: failed,
    };
  } catch (err) {
    const failed: CouncilParticipation = { ...optimistic, syncState: "local_only" };
    upsertLocal(failed);
    return {
      ok: false,
      syncState: "local_only",
      code: "network_error",
      message: err instanceof Error ? err.message : String(err),
      participation: failed,
    };
  }
}

/**
 * @deprecated Use `claimCouncilParticipation` (async, server-synced).
 * Kept for backward compatibility — writes a local_only record.
 */
export function markCouncilParticipation(
  sessionId: string,
  amount: number = COUNCIL_HEARTS_REWARD,
): CouncilParticipation {
  const existing = getCouncilParticipation(sessionId);
  if (existing) return existing;
  const record: CouncilParticipation = {
    sessionId,
    status: "rewarded",
    heartsAmount: amount,
    claimedAt: new Date().toISOString(),
    syncState: "local_only",
    ledgerEntryId: null,
  };
  upsertLocal(record);
  return record;
}

/**
 * Re-sync any cached local_only records to the server. Safe to call on
 * page load / when connectivity returns. RPC is idempotent.
 */
export async function resyncLocalParticipation(): Promise<number> {
  const all = readAll();
  const pending = Object.values(all).filter((r) => r.syncState !== "synced");
  let recovered = 0;
  for (const r of pending) {
    const result = await claimCouncilParticipation(r.sessionId, r.heartsAmount);
    if (result.ok) recovered += 1;
  }
  return recovered;
}

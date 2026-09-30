import { describe, expect, it, vi } from "vitest";
import {
  consumeInvitation,
  declineMessage,
  INVITEE_ACCOUNT_MAX_AGE_MS,
  type ConsumeDeps,
} from "@/lib/invitations/consumeInvitation";
import {
  clearPendingInvite,
  LEGACY_INVITE_KEY,
  PENDING_INVITE_KEY,
  readPendingInvite,
} from "@/lib/invitations/pendingInvite";

const NOW = Date.parse("2026-10-01T12:00:00Z");
const newUser = { id: "invitee-1", created_at: "2026-10-01T11:58:00Z" };

function deps(result: unknown, opts: { throws?: boolean; rpcError?: string } = {}) {
  const rpc = vi.fn(async () => {
    if (opts.throws) throw new Error("Failed to fetch");
    return opts.rpcError ? { data: null, error: { message: opts.rpcError } } : { data: result, error: null };
  });
  const clear = vi.fn();
  const track = vi.fn();
  const d: ConsumeDeps & { rpc: typeof rpc; clear: typeof clear; track: typeof track } = { rpc, clear, track, now: () => NOW };
  return d;
}

function memoryStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    removeItem: (k: string) => { map.delete(k); },
    has: (k: string) => map.has(k),
  };
}

describe("consumeInvitation — one path, after any sign-in", () => {
  it("records the invitation once and clears the stored code", async () => {
    const d = deps({ success: true, inviter_id: "ed", lineage_staff_id: "YEW" });
    const outcome = await consumeInvitation(newUser, "abc123", d);
    expect(outcome).toEqual({ kind: "consumed", alreadyConsumed: false });
    expect(d.rpc).toHaveBeenCalledTimes(1);
    expect(d.rpc).toHaveBeenCalledWith("consume_invitation", { p_invite_code: "abc123", p_new_user_id: "invitee-1" });
    expect(d.clear).toHaveBeenCalledTimes(1);
    expect(d.track).toHaveBeenCalledWith("invite_consumed", "abc123", "invitee-1", undefined);
  });

  it("treats a repeat as already recorded (idempotent server)", async () => {
    const d = deps({ success: true, already_consumed: true, inviter_id: "ed" });
    expect(await consumeInvitation(newUser, "abc123", d)).toEqual({ kind: "consumed", alreadyConsumed: true });
    expect(d.clear).toHaveBeenCalledTimes(1);
  });

  it.each(["invalid_or_used_invite", "inviter_no_invites_remaining", "already_attributed", "self_invite", "account_predates_invitation", "malformed_invite"])(
    "declines finally on %s, clears the code and writes nothing else", async (reason) => {
      const d = deps({ error: reason });
      expect(await consumeInvitation(newUser, "abc123", d)).toEqual({ kind: "declined", reason });
      expect(d.rpc).toHaveBeenCalledTimes(1); // no fallback write of any kind
      expect(d.clear).toHaveBeenCalledTimes(1);
      expect(d.track).toHaveBeenCalledWith("invite_consume_failed", "abc123", "invitee-1", { error: reason });
    },
  );

  it.each(["unauthenticated", "not_your_account"])("keeps the code to retry when the server says %s", async (reason) => {
    const d = deps({ error: reason });
    expect(await consumeInvitation(newUser, "abc123", d)).toEqual({ kind: "retry", reason });
    expect(d.clear).not.toHaveBeenCalled();
  });

  it("keeps the code to retry on a network failure or RPC error", async () => {
    const thrown = deps(null, { throws: true });
    expect((await consumeInvitation(newUser, "abc123", thrown)).kind).toBe("retry");
    expect(thrown.clear).not.toHaveBeenCalled();
    const rpcError = deps(null, { rpcError: "upstream timeout" });
    expect((await consumeInvitation(newUser, "abc123", rpcError)).kind).toBe("retry");
    expect(rpcError.clear).not.toHaveBeenCalled();
  });

  it("never re-parents an established Wanderer who opens a shared link", async () => {
    const d = deps({ success: true });
    const established = { id: "ed", created_at: new Date(NOW - INVITEE_ACCOUNT_MAX_AGE_MS - 1000).toISOString() };
    expect(await consumeInvitation(established, "abc123", d)).toEqual({ kind: "skipped", reason: "established_account" });
    expect(d.rpc).not.toHaveBeenCalled();
    expect(d.clear).not.toHaveBeenCalled();
    expect((await consumeInvitation({ id: "x", created_at: null }, "abc123", d)).kind).toBe("skipped");
  });

  it("accepts an account confirmed days after sign-up", async () => {
    const d = deps({ success: true });
    const confirmedLater = { id: "freddie", created_at: new Date(NOW - 3 * 24 * 3600 * 1000).toISOString() };
    expect((await consumeInvitation(confirmedLater, "abc123", d)).kind).toBe("consumed");
  });

  it("only speaks up where the Wanderer can act", () => {
    expect(declineMessage("invalid_or_used_invite")).toBeTruthy();
    expect(declineMessage("inviter_no_invites_remaining")).toBeTruthy();
    expect(declineMessage("already_attributed")).toBeNull();
    expect(declineMessage("account_predates_invitation")).toBeNull();
  });
});

describe("pending invitation code — every arrival key", () => {
  it("reads /auth?invite= (session, then local) before shared-link and Telegram keys", () => {
    expect(readPendingInvite(memoryStorage({ [PENDING_INVITE_KEY]: "local", [LEGACY_INVITE_KEY]: "legacy" }), memoryStorage({ [PENDING_INVITE_KEY]: "session" }))).toBe("session");
    expect(readPendingInvite(memoryStorage({ [PENDING_INVITE_KEY]: "local", [LEGACY_INVITE_KEY]: "legacy" }), memoryStorage())).toBe("local");
    expect(readPendingInvite(memoryStorage({ [LEGACY_INVITE_KEY]: " shared-tree " }), memoryStorage())).toBe("shared-tree");
    expect(readPendingInvite(memoryStorage({ [LEGACY_INVITE_KEY]: "  " }), memoryStorage())).toBeNull();
    expect(readPendingInvite(null, null)).toBeNull();
  });

  it("clears every key together", () => {
    const local = memoryStorage({ [PENDING_INVITE_KEY]: "a", [LEGACY_INVITE_KEY]: "b", other: "keep" });
    const session = memoryStorage({ [PENDING_INVITE_KEY]: "c" });
    clearPendingInvite(local, session);
    expect(local.has(PENDING_INVITE_KEY) || local.has(LEGACY_INVITE_KEY) || session.has(PENDING_INVITE_KEY)).toBe(false);
    expect(local.has("other")).toBe(true);
  });
});

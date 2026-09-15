/**
 * Security hardening contracts (Hearts, invitations, notifications).
 *
 * These mirror the rules now enforced in the database and in the
 * `send-notification` edge function. They are deliberately pure mirrors —
 * the authoritative enforcement lives server-side; these tests lock the
 * *intent* so a future change cannot silently loosen it.
 */
import { describe, it, expect } from "vitest";

// ── Hearts: the trusted rule book ────────────────────────────────
// Mirror of public.heart_award_rules (client_allowed + max_amount).
const HEART_RULES: Record<string, { max: number; clientAllowed: boolean }> = {
  checkin: { max: 10, clientAllowed: true },
  tree_mapping: { max: 10, clientAllowed: true },
  offering: { max: 5, clientAllowed: true },
  curation: { max: 3, clientAllowed: true },
  bloom_offering: { max: 2, clientAllowed: true },
  gift: { max: 100, clientAllowed: true },
  bug_report: { max: 9999, clientAllowed: false },
  task_completion: { max: 9999, clientAllowed: false },
  windfall: { max: 9999, clientAllowed: false },
  admin_grant: { max: 9999, clientAllowed: false },
};
const UNLISTED_CEILING = 10;

/** Mirror of enforce_heart_transaction_authority(). */
function heartInsertAllowed(input: {
  callerId: string | null;
  rowUserId: string;
  heartType: string;
  amount: number;
  balance?: number;
}): boolean {
  const { callerId, rowUserId, heartType, amount, balance = 0 } = input;
  if (!callerId || callerId !== rowUserId) return false;
  if (!amount) return false;
  const rule = HEART_RULES[heartType];
  if (amount > 0) {
    if (rule && !rule.clientAllowed) return false;
    return amount <= (rule?.max ?? UNLISTED_CEILING);
  }
  if (!heartType.startsWith("spend_")) return false;
  return balance >= Math.abs(amount);
}

describe("Hearts — a client cannot mint its own reward", () => {
  const me = "user-a";

  it("rejects a system-issued heart type from the browser", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "bug_report", amount: 999999 })).toBe(false);
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "admin_grant", amount: 1 })).toBe(false);
  });

  it("rejects an inflated amount for an otherwise legitimate action", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "checkin", amount: 9999 })).toBe(false);
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "offering", amount: 50 })).toBe(false);
  });

  it("caps unknown heart types at the default ceiling", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "made_up", amount: 99 })).toBe(false);
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "made_up", amount: 10 })).toBe(true);
  });

  it("rejects writing hearts onto another Wanderer's account", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: "user-b", heartType: "checkin", amount: 1 })).toBe(false);
  });

  it("rejects an unsigned-in writer", () => {
    expect(heartInsertAllowed({ callerId: null, rowUserId: me, heartType: "checkin", amount: 1 })).toBe(false);
  });

  it("still allows the genuine earning flow", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "checkin", amount: 1 })).toBe(true);
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "offering", amount: 2 })).toBe(true);
  });
});

describe("Hearts — spending", () => {
  const me = "user-a";

  it("only spend_* transactions may be negative", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "checkin", amount: -5, balance: 100 })).toBe(false);
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "spend_plant_hearts", amount: -5, balance: 100 })).toBe(true);
  });

  it("cannot overspend the balance", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "spend_plant_hearts", amount: -500, balance: 100 })).toBe(false);
  });

  it("cannot spend from another Wanderer's balance", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: "user-b", heartType: "spend_plant_hearts", amount: -1, balance: 100 })).toBe(false);
  });

  it("rejects a zero-amount transaction", () => {
    expect(heartInsertAllowed({ callerId: me, rowUserId: me, heartType: "checkin", amount: 0 })).toBe(false);
  });
});

// ── Invitation redemption authorization ──────────────────────────
/** Mirror of the authorization preamble in public.consume_invitation(). */
function redeemOutcome(callerId: string | null, targetUserId: string): string {
  if (!callerId) return "unauthenticated";
  if (callerId !== targetUserId) return "not_your_account";
  return "proceed";
}

describe("Invitation redemption authorization", () => {
  it("refuses a signed-out caller", () => {
    expect(redeemOutcome(null, "user-b")).toBe("unauthenticated");
  });
  it("refuses redeeming against another Wanderer's account", () => {
    expect(redeemOutcome("user-a", "user-b")).toBe("not_your_account");
  });
  it("allows a Wanderer to redeem for themselves", () => {
    expect(redeemOutcome("user-a", "user-a")).toBe("proceed");
  });
});

// ── Signup gating: positive validation is the source of truth ────
type InviteStatus =
  | "idle" | "checking" | "valid" | "used" | "expired"
  | "revoked" | "not_found" | "malformed" | "inviter_exhausted" | "lookup_error";

const signupEnabled = (s: InviteStatus) => s === "valid";

describe("Signup gate", () => {
  it("enables Create Account only on a positively validated invitation", () => {
    const states: InviteStatus[] = [
      "idle", "checking", "used", "expired", "revoked",
      "not_found", "malformed", "inviter_exhausted", "lookup_error",
    ];
    states.forEach((s) => expect(signupEnabled(s)).toBe(false));
    expect(signupEnabled("valid")).toBe(true);
  });
});

// ── Notifications: deep-link safety ──────────────────────────────
/** Mirror of safeDeepLink() in supabase/functions/send-notification. */
function safeDeepLink(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v || v.length > 200) return null;
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//")) return null;
  if (/[\\<>"'\s]/.test(v)) return null;
  if (/^\/+\w+:/.test(v)) return null;
  if (!/^\/[A-Za-z0-9\-._~/%?=&#:+]*$/.test(v)) return null;
  return v;
}

describe("Notification deep links", () => {
  it("accepts internal S33D paths", () => {
    expect(safeDeepLink("/tree/abc-123")).toBe("/tree/abc-123");
    expect(safeDeepLink("/library/staff-room?tab=lineage")).toBe("/library/staff-room?tab=lineage");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeDeepLink("https://phishing.example/steal")).toBeNull();
    expect(safeDeepLink("//phishing.example/steal")).toBeNull();
    expect(safeDeepLink("javascript:alert(1)")).toBeNull();
    expect(safeDeepLink("/\\phishing.example")).toBeNull();
    expect(safeDeepLink("")).toBeNull();
    expect(safeDeepLink(null)).toBeNull();
  });
});

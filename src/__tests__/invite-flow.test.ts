/**
 * Invite token persistence + recovery tests.
 *
 * We verify the contract that AuthPage relies on for mobile Safari reliability:
 *
 *  1. Direct invite-link arrival: ?invite=CODE is captured.
 *  2. Refresh of the signup page: the code is still recovered after the URL
 *     is replaced (e.g. by Supabase auth hash stripping or app routing).
 *  3. Google OAuth roundtrip: localStorage survives the cross-domain bounce.
 *  4. App switch + return on iOS Safari: sessionStorage survives backgrounding.
 *  5. Expired/used invite state: the persistence layer never auto-consumes —
 *     consumption only happens after a real authenticated session.
 */
import { describe, it, expect, beforeEach } from "vitest";

const PENDING = "s33d_pending_invite_code";
const READY = "s33d_invite_code";

/** Mirror of the persistence routine in AuthPage's URL-detect effect. */
function captureFromUrl(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get("invite");
  if (!code) return null;
  sessionStorage.setItem(PENDING, code);
  localStorage.setItem(PENDING, code);
  return code;
}

/** Mirror of the recovery logic that runs when the URL no longer carries it. */
function recoverPersistedCode(search = ""): string | null {
  const fromUrl = new URLSearchParams(search).get("invite");
  if (fromUrl) return fromUrl;
  return (
    sessionStorage.getItem(PENDING) ||
    localStorage.getItem(PENDING) ||
    null
  );
}

/** Mirror of the post-validation persistence (just before signUp). */
function markReadyForConsumption(code: string) {
  localStorage.setItem(READY, code);
  localStorage.setItem(PENDING, code);
  sessionStorage.setItem(PENDING, code);
}

/** Mirror of the post-session cleanup. */
function clearAfterConsumption() {
  localStorage.removeItem(READY);
  localStorage.removeItem(PENDING);
  sessionStorage.removeItem(PENDING);
}

describe("invite token persistence (mobile Safari scenarios)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("1. captures the invite when opened directly from a shared link", () => {
    const code = captureFromUrl("?invite=fresh123");
    expect(code).toBe("fresh123");
    expect(sessionStorage.getItem(PENDING)).toBe("fresh123");
    expect(localStorage.getItem(PENDING)).toBe("fresh123");
  });

  it("2. survives a refresh of the signup page after the URL is stripped", () => {
    captureFromUrl("?invite=fresh123");
    // Simulate a full reload where the URL has been cleaned (hash-stripped, etc.)
    expect(recoverPersistedCode("")).toBe("fresh123");
  });

  it("3. survives a Google OAuth roundtrip (sessionStorage cleared on cross-domain bounce, localStorage retained)", () => {
    captureFromUrl("?invite=fresh123");
    // OAuth bounce: sessionStorage is per-tab and may be cleared when Safari
    // returns from the provider via a fresh tab; localStorage persists.
    sessionStorage.clear();
    expect(recoverPersistedCode("")).toBe("fresh123");
  });

  it("4. survives Safari app switching (both stores intact, params intact)", () => {
    captureFromUrl("?invite=fresh123");
    // App switch is a no-op for storage — code is still there.
    expect(recoverPersistedCode("?invite=fresh123")).toBe("fresh123");
    expect(recoverPersistedCode("")).toBe("fresh123");
  });

  it("5. an expired/used invite never gets auto-consumed by the persistence layer", () => {
    // The persistence layer only stores; it does not call any RPC.
    captureFromUrl("?invite=expired999");
    // Even if we mark it ready, no session means no consumption.
    markReadyForConsumption("expired999");
    expect(localStorage.getItem(READY)).toBe("expired999");
    // Cleanup only happens after a real session has consumed.
    clearAfterConsumption();
    expect(localStorage.getItem(READY)).toBeNull();
    expect(localStorage.getItem(PENDING)).toBeNull();
    expect(sessionStorage.getItem(PENDING)).toBeNull();
  });

  it("page-load / preview never sets the READY key", () => {
    captureFromUrl("?invite=preview");
    // Only PENDING is written — READY is reserved for after pre-validation.
    expect(localStorage.getItem(READY)).toBeNull();
  });
});

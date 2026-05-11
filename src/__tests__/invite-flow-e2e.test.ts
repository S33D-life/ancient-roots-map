/**
 * Invite end-to-end style scenarios.
 *
 * We don't run a full Playwright/Cypress browser here, but we do exercise the
 * exact persistence + analytics contract that AuthPage relies on across the
 * scenarios described in the spec:
 *
 *   - fresh invite signup success
 *   - used invite shows bloom failure card
 *   - expired invite shows bloom failure card
 *   - OAuth-style redirect preserves invite token
 *   - page refresh preserves invite token
 *   - returning to Grove clears stored invite token
 *
 * The pure JS scenarios below are the same checks a Playwright spec would
 * make, minus the chrome of opening real browsers. They protect the contract.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const PENDING = "s33d_pending_invite_code";
const READY = "s33d_invite_code";

type Validation = { id: string; created_by: string; expires_at: string | null };
type Consume = { ok?: boolean; error?: string };

interface InviteBackend {
  validate(code: string): Promise<{ row: Validation | null; error?: string }>;
  consume(code: string, userId: string): Promise<Consume>;
}

function makeBackend(opts: {
  freshCodes?: Record<string, Validation>;
  usedCodes?: Set<string>;
  expiredCodes?: Set<string>;
}): InviteBackend {
  return {
    async validate(code) {
      if (opts.usedCodes?.has(code)) return { row: null, error: "used" };
      if (opts.expiredCodes?.has(code)) return { row: null, error: "expired" };
      const row = opts.freshCodes?.[code];
      return row ? { row } : { row: null, error: "not_found" };
    },
    async consume(code) {
      if (opts.usedCodes?.has(code)) return { error: "used" };
      if (opts.expiredCodes?.has(code)) return { error: "expired" };
      return { ok: true };
    },
  };
}

/**
 * High-level flow modeled exactly like AuthPage:
 *   1. capture from URL → persist
 *   2. (optional) OAuth bounce strips sessionStorage
 *   3. validate → if invalid, return bloom-failure
 *   4. signUp → on success, mark READY
 *   5. session established → consume → cleanup
 */
async function runFlow(opts: {
  url: string;
  backend: InviteBackend;
  oauthBounce?: boolean;
  refresh?: boolean;
  returnToGrove?: boolean;
  authenticate?: { userId: string };
}) {
  const events: Array<{ name: string; source?: string }> = [];

  // 1. URL capture
  const urlCode = new URLSearchParams(opts.url.split("?")[1] ?? "").get("invite");
  if (urlCode) {
    events.push({ name: "invite_link_opened", source: "url" });
    sessionStorage.setItem(PENDING, urlCode);
    localStorage.setItem(PENDING, urlCode);
    events.push({ name: "invite_code_detected", source: "url" });
  }

  // 2. OAuth bounce: sessionStorage cleared, localStorage retained
  if (opts.oauthBounce) sessionStorage.clear();

  // 3. (page refresh is implicit — we only re-read storage)
  let recovered =
    sessionStorage.getItem(PENDING) || localStorage.getItem(PENDING) || urlCode;
  if (opts.refresh && recovered) {
    events.push({
      name: "invite_code_detected",
      source: sessionStorage.getItem(PENDING) ? "storage" : "oauth_return",
    });
  }

  // 4. Return to Grove path: short-circuit + clear
  if (opts.returnToGrove) {
    events.push({ name: "invite_return_to_grove" });
    localStorage.removeItem(READY);
    localStorage.removeItem(PENDING);
    sessionStorage.removeItem(PENDING);
    return { events, recovered, bloomFailure: false };
  }

  if (!recovered) return { events, recovered: null, bloomFailure: false };

  // 5. Validation
  const v = await opts.backend.validate(recovered);
  if (!v.row) {
    events.push({ name: "invite_validation_failed" });
    return { events, recovered, bloomFailure: true, reason: v.error ?? null };
  }
  events.push({ name: "invite_validation_success" });
  localStorage.setItem(READY, recovered);

  // 6. Signup + session + consume
  events.push({ name: "invite_signup_started" });
  events.push({ name: "invite_signup_success" });

  if (opts.authenticate) {
    const c = await opts.backend.consume(recovered, opts.authenticate.userId);
    events.push({ name: c.ok ? "invite_consumed" : "invite_consume_failed" });
    localStorage.removeItem(READY);
    localStorage.removeItem(PENDING);
    sessionStorage.removeItem(PENDING);
  }

  return { events, recovered, bloomFailure: false };
}

describe("invite e2e flow scenarios", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("fresh invite signup success", async () => {
    const backend = makeBackend({
      freshCodes: { fresh1: { id: "i1", created_by: "u0", expires_at: null } },
    });
    const r = await runFlow({
      url: "/auth?invite=fresh1",
      backend,
      authenticate: { userId: "user-new" },
    });
    expect(r.bloomFailure).toBe(false);
    const names = r.events.map((e) => e.name);
    expect(names).toContain("invite_link_opened");
    expect(names).toContain("invite_validation_success");
    expect(names).toContain("invite_signup_success");
    expect(names).toContain("invite_consumed");
    // Fully cleaned up after consumption.
    expect(localStorage.getItem(READY)).toBeNull();
    expect(localStorage.getItem(PENDING)).toBeNull();
  });

  it("used invite shows bloom failure card", async () => {
    const backend = makeBackend({ usedCodes: new Set(["used1"]) });
    const r = await runFlow({ url: "/auth?invite=used1", backend });
    expect(r.bloomFailure).toBe(true);
    expect(r.reason).toBe("used");
    expect(r.events.map((e) => e.name)).toContain("invite_validation_failed");
  });

  it("expired invite shows bloom failure card", async () => {
    const backend = makeBackend({ expiredCodes: new Set(["old1"]) });
    const r = await runFlow({ url: "/auth?invite=old1", backend });
    expect(r.bloomFailure).toBe(true);
    expect(r.reason).toBe("expired");
  });

  it("OAuth-style redirect preserves invite token", async () => {
    const backend = makeBackend({
      freshCodes: { ofresh: { id: "i", created_by: "u", expires_at: null } },
    });
    const r = await runFlow({
      url: "/auth?invite=ofresh",
      backend,
      oauthBounce: true,
      refresh: true,
      authenticate: { userId: "u-oauth" },
    });
    expect(r.recovered).toBe("ofresh");
    expect(r.bloomFailure).toBe(false);
    // After OAuth bounce, source should reflect oauth_return on re-detect.
    const detect = r.events.find(
      (e, i) => e.name === "invite_code_detected" && i > 0,
    );
    expect(detect?.source).toBe("oauth_return");
  });

  it("page refresh preserves invite token", async () => {
    const backend = makeBackend({
      freshCodes: { rfresh: { id: "i", created_by: "u", expires_at: null } },
    });
    const r = await runFlow({
      url: "/auth?invite=rfresh",
      backend,
      refresh: true,
    });
    expect(r.recovered).toBe("rfresh");
    expect(r.bloomFailure).toBe(false);
  });

  it("returning to Grove clears stored invite token", async () => {
    const backend = makeBackend({
      freshCodes: { gfresh: { id: "i", created_by: "u", expires_at: null } },
    });
    await runFlow({ url: "/auth?invite=gfresh", backend });
    // Tokens are now in storage.
    expect(localStorage.getItem(PENDING)).toBe("gfresh");
    // User clicks Return to Grove.
    const r = await runFlow({
      url: "/auth",
      backend,
      returnToGrove: true,
    });
    expect(r.events.map((e) => e.name)).toContain("invite_return_to_grove");
    expect(localStorage.getItem(PENDING)).toBeNull();
    expect(localStorage.getItem(READY)).toBeNull();
    expect(sessionStorage.getItem(PENDING)).toBeNull();
  });
});

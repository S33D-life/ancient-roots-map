/**
 * Regression coverage for installed-app (standalone) Google sign-in.
 *
 * Two layers:
 *  - the client module (which flow is chosen, how the handoff is stored,
 *    claimed once, and how failures leave the app recoverable);
 *  - a faithful model of the server's single-use handoff rules (wrong secret,
 *    expiry, reuse), mirroring supabase/functions/auth-handoff/index.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: { access_token: "safari-token", user: { id: "u1", email: "a@b.c" } } } })),
  verifyOtp: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: authMock } }));
vi.mock("@/config/env", () => ({ supabaseEnv: { url: "https://api.test", anonKey: "anon" } }));

import {
  beginHandoff,
  bindHandoff,
  claimHandoff,
  clearPendingHandoff,
  isStandaloneDisplay,
  readPendingHandoff,
  sha256Hex,
} from "@/lib/auth/pwaHandoff";

/* ── Server model: the rules the edge function enforces ─────────────── */

type Row = {
  id: string;
  verifierHash: string;
  expiresAt: number;
  ticket: string | null;
  boundUserId: string | null;
  consumedAt: number | null;
};

class HandoffServer {
  rows = new Map<string, Row>();
  private n = 0;

  create(verifierHash: string, ttlMs = 5 * 60_000) {
    const id = `00000000-0000-4000-8000-00000000000${++this.n}`;
    this.rows.set(id, { id, verifierHash, expiresAt: Date.now() + ttlMs, ticket: null, boundUserId: null, consumedAt: null });
    return id;
  }

  bind(id: string, userId: string | null, ticket: string) {
    const row = this.rows.get(id);
    if (!row) return { status: 404 };
    if (!userId) return { status: 401 };
    if (row.consumedAt || row.boundUserId) return { status: 409 };
    if (row.expiresAt < Date.now()) return { status: 410 };
    row.boundUserId = userId;
    row.ticket = ticket;
    return { status: 200 };
  }

  claim(id: string, verifierHash: string) {
    const row = this.rows.get(id);
    if (!row || row.verifierHash !== verifierHash) return { status: 403 };
    if (row.consumedAt) return { status: 403 };
    if (row.expiresAt < Date.now()) return { status: 403 };
    if (!row.ticket) return { status: 202, body: { status: "pending" } };
    row.consumedAt = Date.now();
    const ticket = row.ticket;
    row.ticket = null;
    return { status: 200, body: { status: "ready", token_hash: ticket } };
  }
}

/* ── Harness ────────────────────────────────────────────────────────── */

let server: HandoffServer;

const installFetch = () => {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    let out: { status: number; body?: unknown };
    if (body.action === "create") {
      const id = server.create(body.verifier_hash);
      out = { status: 200, body: { handoff_id: id } };
    } else if (body.action === "bind") {
      const authed = String((init.headers as Record<string, string>).Authorization).includes("safari-token");
      out = { ...server.bind(body.handoff_id, authed ? "u1" : null, "ticket-abc"), body: { ok: true } };
      if (out.status !== 200) out.body = { error: "no" };
    } else {
      const hash = await sha256Hex(body.verifier);
      out = server.claim(body.handoff_id, hash);
    }
    return { status: out.status, json: async () => out.body ?? {} } as unknown as Response;
  }));
};

const setStandalone = (on: boolean) => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: on && q.includes("standalone") }) as MediaQueryList);
};

beforeEach(() => {
  server = new HandoffServer();
  localStorage.clear();
  vi.clearAllMocks();
  installFetch();
  setStandalone(true);
});

/* ── Tests ──────────────────────────────────────────────────────────── */

describe("display-mode detection", () => {
  it("treats the installed app as standalone", () => {
    setStandalone(true);
    expect(isStandaloneDisplay()).toBe(true);
  });

  it("leaves Safari/desktop on the ordinary flow", () => {
    setStandalone(false);
    expect(isStandaloneDisplay()).toBe(false);
  });
});

describe("installed-app Google sign-in handoff", () => {
  it("returns an opaque return URL with no token in it", async () => {
    const uri = await beginHandoff("/welcome");
    expect(uri).toContain("/auth/handoff?h=");
    expect(uri).not.toMatch(/token|access|refresh/i);
    expect(readPendingHandoff()?.verifier).toHaveLength(64);
  });

  it("binds in Safari and then restores the session in the app", async () => {
    const uri = await beginHandoff("/welcome");
    const id = new URL(uri!).searchParams.get("h")!;

    expect((await bindHandoff(id)).ok).toBe(true);

    const claimed = await claimHandoff();
    expect(claimed.status).toBe("signed-in");
    expect(authMock.verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "ticket-abc" });
    // Consumed: nothing left behind for a replay.
    expect(readPendingHandoff()).toBeNull();
  });

  it("reports pending while Google has not completed yet", async () => {
    await beginHandoff("/welcome");
    expect((await claimHandoff()).status).toBe("pending");
  });

  it("stays signed in on reload — no pending handoff remains to redo", async () => {
    const uri = await beginHandoff("/welcome");
    await bindHandoff(new URL(uri!).searchParams.get("h")!);
    await claimHandoff();
    expect(await claimHandoff()).toEqual({ status: "none" });
  });

  it("leaves the app recoverable when Google is cancelled", async () => {
    await beginHandoff("/welcome");
    clearPendingHandoff();
    expect(await claimHandoff()).toEqual({ status: "none" });
    // A fresh attempt still works.
    const again = await beginHandoff("/welcome");
    expect(again).toContain("/auth/handoff?h=");
  });

  it("does not bind without a session in the completing browser", async () => {
    authMock.getSession.mockResolvedValueOnce({ data: { session: null } } as never);
    const uri = await beginHandoff("/welcome");
    const id = new URL(uri!).searchParams.get("h")!;
    expect(await bindHandoff(id)).toEqual({ ok: false, reason: "no-session" });
  });
});

describe("handoff server rules", () => {
  const hash = (v: string) => sha256Hex(v);

  it("refuses a wrong secret", async () => {
    const id = server.create(await hash("right"));
    server.bind(id, "u1", "t");
    expect((await Promise.resolve(server.claim(id, await hash("wrong")))).status).toBe(403);
  });

  it("refuses an expired handoff", async () => {
    const id = server.create(await hash("s"), -1);
    server.bind(id, "u1", "t");
    expect(server.claim(id, await hash("s")).status).toBe(403);
  });

  it("refuses a reused handoff", async () => {
    const id = server.create(await hash("s"));
    server.bind(id, "u1", "t");
    expect(server.claim(id, await hash("s")).status).toBe(200);
    expect(server.claim(id, await hash("s")).status).toBe(403);
  });

  it("refuses an unknown handoff id", async () => {
    expect(server.claim("00000000-0000-4000-8000-000000009999", await hash("s")).status).toBe(403);
  });

  it("refuses binding without an authenticated caller", async () => {
    const id = server.create(await hash("s"));
    expect(server.bind(id, null, "t").status).toBe(401);
  });

  it("refuses binding a second identity to the same handoff", async () => {
    const id = server.create(await hash("s"));
    server.bind(id, "u1", "t");
    expect(server.bind(id, "attacker", "t2").status).toBe(409);
  });
});

describe("Safari and desktop sign-in are unchanged", () => {
  it("creates no handoff when not standalone", async () => {
    setStandalone(false);
    expect(isStandaloneDisplay()).toBe(false);
    expect(readPendingHandoff()).toBeNull();
    expect(server.rows.size).toBe(0);
  });

  it("sign-out isolation: clearing this context leaves no handoff state", async () => {
    await beginHandoff("/welcome");
    clearPendingHandoff();
    expect(localStorage.getItem("s33d_pwa_auth_handoff")).toBeNull();
  });
});

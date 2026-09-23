/**
 * Google wrapper resilience: setSession reports storage/refresh failures as a
 * returned error, not a throw. The wrapper must surface those, otherwise the UI
 * believes a sign-in succeeded while no session was ever persisted.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const signInWithOAuth = vi.hoisted(() => vi.fn());
const setSession = vi.hoisted(() => vi.fn());

vi.mock("@lovable.dev/cloud-auth-js", () => ({
  createLovableAuth: () => ({ signInWithOAuth }),
}));

vi.mock("../integrations/supabase/client", () => ({
  supabase: { auth: { setSession } },
}));

import { lovable } from "@/integrations/lovable/index";

describe("google-signin-wrapper", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    setSession.mockReset();
  });

  it("surfaces an error returned by setSession", async () => {
    signInWithOAuth.mockResolvedValue({ tokens: { access_token: "a", refresh_token: "b" } });
    setSession.mockResolvedValue({ data: { session: null }, error: { message: "storage unavailable" } });

    const result = await lovable.auth.signInWithOAuth("google", {});

    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain("storage unavailable");
  });

  it("surfaces a thrown setSession failure too", async () => {
    signInWithOAuth.mockResolvedValue({ tokens: { access_token: "a", refresh_token: "b" } });
    setSession.mockRejectedValue(new Error("lock timeout"));

    const result = await lovable.auth.signInWithOAuth("google", {});
    expect((result.error as Error).message).toBe("lock timeout");
  });

  it("returns success when the session is persisted", async () => {
    signInWithOAuth.mockResolvedValue({ tokens: { access_token: "a", refresh_token: "b" } });
    setSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    const result = await lovable.auth.signInWithOAuth("google", {});
    expect(result.error).toBeUndefined();
  });

  it("passes a redirect straight back without touching storage", async () => {
    signInWithOAuth.mockResolvedValue({ redirected: true });

    const result = await lovable.auth.signInWithOAuth("google", {});
    expect(result.redirected).toBe(true);
    expect(setSession).not.toHaveBeenCalled();
  });
});

/**
 * Durable OAuth adapter: the generated Lovable wrapper can silently return
 * "success" when the session was never persisted (setSession reports storage /
 * refresh problems as a returned error rather than a throw). The adapter lives
 * outside the generated file so a regeneration cannot undo this check.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const signInWithOAuth = vi.hoisted(() => vi.fn());
const getSession = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth } },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession } },
}));

import { SESSION_NOT_PERSISTED_MESSAGE, signInWithOAuthChecked } from "@/lib/auth/oauthSignIn";

describe("google-signin-adapter", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    getSession.mockReset();
  });

  it("reports failure when the wrapper claims success but no session was persisted", async () => {
    signInWithOAuth.mockResolvedValue({});
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await signInWithOAuthChecked("google", {});
    expect(result.error?.message).toBe(SESSION_NOT_PERSISTED_MESSAGE);
  });

  it("surfaces an error returned by the wrapper", async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: "storage unavailable" } });

    const result = await signInWithOAuthChecked("google", {});
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain("storage unavailable");
  });

  it("surfaces a thrown failure", async () => {
    signInWithOAuth.mockRejectedValue(new Error("lock timeout"));

    const result = await signInWithOAuthChecked("google", {});
    expect(result.error?.message).toBe("lock timeout");
  });

  it("returns success when a session really exists afterwards", async () => {
    signInWithOAuth.mockResolvedValue({});
    getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    const result = await signInWithOAuthChecked("google", {});
    expect(result.error).toBeUndefined();
  });

  it("passes a redirect straight back without checking storage", async () => {
    signInWithOAuth.mockResolvedValue({ redirected: true });

    const result = await signInWithOAuthChecked("google", {});
    expect(result.redirected).toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });
});

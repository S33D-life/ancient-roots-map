import { describe, expect, it, vi } from "vitest";
import { createPostSignInQueue } from "@/lib/auth/postSignInQueue";

const session = (id: string, token: string) => ({ user: { id }, access_token: token });

describe("post-sign-in-queue", () => {
  it("runs follow-up work once per user", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    expect(q.enqueue("SIGNED_IN", session("u1", "t1"))).toBe(true);
    expect(q.enqueue("SIGNED_IN", session("u1", "t1"))).toBe(false);
    await q.settled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not re-run when the access token rotates on TOKEN_REFRESHED", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    q.enqueue("SIGNED_IN", session("u1", "token-a"));
    q.enqueue("TOKEN_REFRESHED", session("u1", "token-b"));
    q.enqueue("TOKEN_REFRESHED", session("u1", "token-c"));
    await q.settled();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not re-run when a recovered initial session arrives after sign-in", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    q.enqueue("SIGNED_IN", session("u1", "t1"));
    expect(q.enqueue("INITIAL_SESSION", session("u1", "t1"))).toBe(false);
    await q.settled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("navigation-bearing work for a recovered session still runs when it is the first arrival", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    expect(q.enqueue("INITIAL_SESSION", session("u1", "t1"))).toBe(true);
    await q.settled();
    expect(run).toHaveBeenCalledWith("INITIAL_SESSION", expect.objectContaining({ user: { id: "u1" } }));
  });

  it("preserves arrival order and keeps running after a failure", async () => {
    const order: string[] = [];
    const onError = vi.fn();
    const run = vi.fn(async (_e: string, s: { user?: { id?: string } | null }) => {
      const id = s.user?.id ?? "";
      if (id === "u1") throw new Error("invite failed");
      order.push(id);
    });
    const q = createPostSignInQueue(run, onError);

    q.enqueue("SIGNED_IN", session("u1", "t1"));
    q.enqueue("SIGNED_IN", session("u2", "t2"));
    await q.settled();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["u2"]);
  });

  it("allows a fresh run for the same user after sign-out", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    q.enqueue("SIGNED_IN", session("u1", "t1"));
    q.reset();
    q.enqueue("SIGNED_IN", session("u1", "t9"));
    await q.settled();

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("ignores a null or anonymous session", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const q = createPostSignInQueue(run);

    expect(q.enqueue("SIGNED_IN", null)).toBe(false);
    expect(q.enqueue("SIGNED_IN", { user: null })).toBe(false);
    await q.settled();
    expect(run).not.toHaveBeenCalled();
  });
});

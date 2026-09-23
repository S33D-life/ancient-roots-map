/**
 * "You're up to date" must only ever mean: we checked, and there was nothing
 * new. A failed check has to surface as a failure.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAppUpdate } from "@/hooks/use-app-update";

const originalFetch = global.fetch;

describe("manual-update-check", () => {
  beforeEach(() => {
    vi.stubGlobal("__BUILD_ID__", "build-current");
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("throws when the version file cannot be fetched", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const { result } = renderHook(() => useAppUpdate());
    await expect(result.current.manualCheck()).rejects.toThrow();
  });

  it("throws when the version file responds with an error status", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAppUpdate());
    await expect(result.current.manualCheck()).rejects.toThrow(/503/);
  });

  it("reports no update when the check succeeds and the build matches", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ build: "build-current" }),
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAppUpdate());
    await expect(result.current.manualCheck()).resolves.toBe(false);
  });

  it("reports an update when a newer build is published", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ build: "build-newer" }),
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAppUpdate());
    await expect(result.current.manualCheck()).resolves.toBe(true);
  });
});

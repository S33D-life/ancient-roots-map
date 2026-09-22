/**
 * Editing-access lookup must distinguish "no permission" from "could not check".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import { fetchTreeEditEligibility } from "@/hooks/use-tree-edit-eligibility";

describe("fetchTreeEditEligibility", () => {
  beforeEach(() => rpc.mockReset());

  it("returns the server decision when the lookup succeeds", async () => {
    rpc.mockResolvedValue({
      data: { exists: true, signed_in: true, is_creator: true, can_direct_edit: true, reason: "creator_sole" },
      error: null,
    });
    const result = await fetchTreeEditEligibility("tree-1");
    expect(result.can_direct_edit).toBe(true);
    expect(result.reason).toBe("creator_sole");
  });

  it("throws on lookup failure instead of reporting 'no access'", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "network" } });
    await expect(fetchTreeEditEligibility("tree-1")).rejects.toBeTruthy();
  });

  it("falls back conservatively when the server returns no row", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const result = await fetchTreeEditEligibility("tree-1");
    expect(result.can_direct_edit).toBe(false);
    expect(result.signed_in).toBe(false);
  });
});

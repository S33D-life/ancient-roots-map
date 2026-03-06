import { describe, it, expect, vi, beforeEach } from "vitest";

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: vi.fn(),
  },
}));

import { rankConnectionsForViewport, upsertMycelialEdge } from "@/services/mycelialEdges";

describe("upsertMycelialEdge", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("calls RPC with normalized defaults", async () => {
    rpcMock.mockResolvedValue({ data: { id: "edge-1" }, error: null });

    await upsertMycelialEdge({
      fromType: "user",
      fromId: "user-1",
      toType: "tree",
      toId: "tree-1",
      edgeKind: "whisper",
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_mycelial_edge",
      expect.objectContaining({
        p_from_type: "user",
        p_from_id: "user-1",
        p_to_type: "tree",
        p_to_id: "tree-1",
        p_edge_kind: "whisper",
        p_weight: 1,
      }),
    );
  });

  it("clamps invalid weight and forwards metadata", async () => {
    rpcMock.mockResolvedValue({ data: { id: "edge-2" }, error: null });

    await upsertMycelialEdge({
      fromType: "user",
      fromId: "user-1",
      toType: "tree",
      toId: "tree-2",
      edgeKind: "offering",
      weight: 0,
      metadata: { offering_id: "off-1" },
      lastSeenAt: "2026-03-05T00:00:00.000Z",
    });

    expect(rpcMock).toHaveBeenCalledWith(
      "upsert_mycelial_edge",
      expect.objectContaining({
        p_weight: 1,
        p_metadata: { offering_id: "off-1" },
        p_last_seen_at: "2026-03-05T00:00:00.000Z",
      }),
    );
  });
});

describe("rankConnectionsForViewport", () => {
  it("returns top N visible connections sorted by weight/recency", () => {
    const now = new Date().toISOString();
    const older = "2024-01-01T00:00:00.000Z";
    const ranked = rankConnectionsForViewport(
      [
        {
          id: "a",
          from: { lat: 0, lng: 0 },
          to: { lat: 1, lng: 1 },
          weight: 1,
          lastSeenAt: older,
        },
        {
          id: "b",
          from: { lat: 0.2, lng: 0.2 },
          to: { lat: 0.3, lng: 0.3 },
          weight: 4,
          lastSeenAt: now,
        },
        {
          id: "c",
          from: { lat: 20, lng: 20 },
          to: { lat: 21, lng: 21 },
          weight: 10,
          lastSeenAt: now,
        },
      ],
      (point) => point.lat < 5 && point.lng < 5,
      1,
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe("b");
  });
});

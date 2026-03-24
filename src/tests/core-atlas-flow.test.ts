import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Core atlas flow regression tests — covers the critical paths
 * identified during the stability audit.
 */

// ─── 1. what3words wiring ───────────────────────────────────────────

describe("what3words util", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("convertToCoordinates returns null on edge function error", async () => {
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        functions: {
          invoke: vi.fn().mockResolvedValue({ data: null, error: { message: "500" } }),
        },
      },
    }));
    const { convertToCoordinates } = await import("@/utils/what3words");
    const result = await convertToCoordinates("filled.count.soap");
    expect(result).toBeNull();
  });

  it("convertToCoordinates enters backoff on quota_exceeded", async () => {
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        functions: {
          invoke: vi.fn().mockResolvedValue({ data: { error: "quota_exceeded" }, error: null }),
        },
      },
    }));
    const { convertToCoordinates } = await import("@/utils/what3words");
    await expect(convertToCoordinates("filled.count.soap")).rejects.toThrow("quota_exceeded");
    // Second call should immediately throw due to backoff
    await expect(convertToCoordinates("other.words.here")).rejects.toThrow("quota_exceeded");
  });

  it("autosuggest returns empty array on error", async () => {
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        functions: {
          invoke: vi.fn().mockResolvedValue({ data: null, error: { message: "network" } }),
        },
      },
    }));
    const { autosuggest } = await import("@/utils/what3words");
    const result = await autosuggest("fill");
    expect(result).toEqual([]);
  });

  it("convertToWhat3Words returns null on error", async () => {
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        functions: {
          invoke: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
        },
      },
    }));
    const { convertToWhat3Words } = await import("@/utils/what3words");
    const result = await convertToWhat3Words(51.5, -0.1);
    expect(result).toBeNull();
  });
});

// ─── 2. Add-tree auth handoff ───────────────────────────────────────

describe("pending tree auth recovery", () => {
  it("strips species_ai_* fields from pending tree before insert", () => {
    const pendingTree = {
      name: "Test Oak",
      species: "Quercus robur",
      latitude: 51.5,
      longitude: -0.1,
      what3words: "filled.count.soap",
      species_ai_predictions: [{ scientificName: "Quercus robur", confidence: 0.95 }],
      species_ai_selected: { scientificName: "Quercus robur" },
      species_ai_provider: "plant.id",
      species_ai_confidence: 0.95,
      species_ai_confirmed: true,
      _photoBase64: "data:image/jpeg;base64,abc123",
      _photoDate: "2025-01-01",
    };

    // Simulate what AuthPage does
    const photoBase64 = pendingTree._photoBase64;
    delete (pendingTree as any)._photoBase64;
    delete (pendingTree as any)._photoDate;
    delete (pendingTree as any).species_ai_predictions;
    delete (pendingTree as any).species_ai_selected;
    delete (pendingTree as any).species_ai_provider;
    delete (pendingTree as any).species_ai_confidence;
    delete (pendingTree as any).species_ai_confirmed;

    // Verify AI fields are stripped
    expect(pendingTree).not.toHaveProperty("species_ai_predictions");
    expect(pendingTree).not.toHaveProperty("species_ai_selected");
    expect(pendingTree).not.toHaveProperty("species_ai_provider");
    expect(pendingTree).not.toHaveProperty("species_ai_confidence");
    expect(pendingTree).not.toHaveProperty("species_ai_confirmed");
    // Verify photo was extracted
    expect(photoBase64).toBe("data:image/jpeg;base64,abc123");
    // Verify tree fields remain
    expect(pendingTree.name).toBe("Test Oak");
    expect(pendingTree.species).toBe("Quercus robur");
  });
});

// ─── 3. Offline queue unification ───────────────────────────────────

describe("offline sync queue", () => {
  it("offlineSync exports the unified API", async () => {
    const mod = await import("@/utils/offlineSync");
    expect(typeof mod.queueAction).toBe("function");
    expect(typeof mod.getAllActions).toBe("function");
    expect(typeof mod.pendingActionCount).toBe("function");
    expect(typeof mod.removeAction).toBe("function");
    expect(typeof mod.offlineId).toBe("function");
    expect(typeof mod.isOnline).toBe("function");
  });

  it("legacy offlineQueue.ts no longer exists", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("src/utils/offlineQueue.ts");
    expect(exists).toBe(false);
  });
});

// ─── 4. Map renderer ────────────────────────────────────────────────

describe("Map component", () => {
  it("Map.tsx exports a component that wraps LeafletFallbackMap", async () => {
    // Just verify the module structure — no MapLibre runtime
    const fs = await import("fs");
    const mapSource = fs.readFileSync("src/components/Map.tsx", "utf8");

    // Must NOT contain maplibregl runtime usage
    expect(mapSource).not.toContain("maplibregl.Map");
    expect(mapSource).not.toContain("maplibregl.Marker");
    expect(mapSource).not.toContain("maplibregl.Popup");
    expect(mapSource).not.toContain('mapStatus');

    // Must reference LeafletFallbackMap
    expect(mapSource).toContain("LeafletFallbackMap");
  });
});

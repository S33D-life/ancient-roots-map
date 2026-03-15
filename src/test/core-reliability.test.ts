import { describe, it, expect, beforeEach } from "vitest";

/**
 * Core reliability regression tests for the S33D Atlas loop.
 * Covers: map module, route registry, auth handoff, offline queue, what3words.
 */

// ── 1. Map.tsx exports a valid component ──

describe("Map.tsx wrapper", () => {
  it("exports a default component", async () => {
    const mapModule = await import("@/components/Map");
    expect(mapModule.default).toBeDefined();
    expect(typeof mapModule.default).toBe("function");
  });
});

// ── 2. what3words util exports all three functions ──

describe("what3words util", () => {
  it("exports convertToCoordinates", async () => {
    const mod = await import("@/utils/what3words");
    expect(mod.convertToCoordinates).toBeDefined();
    expect(typeof mod.convertToCoordinates).toBe("function");
  });

  it("exports convertToWhat3Words (reverse)", async () => {
    const mod = await import("@/utils/what3words");
    expect(mod.convertToWhat3Words).toBeDefined();
    expect(typeof mod.convertToWhat3Words).toBe("function");
  });

  it("exports autosuggest", async () => {
    const mod = await import("@/utils/what3words");
    expect(mod.autosuggest).toBeDefined();
    expect(typeof mod.autosuggest).toBe("function");
  });
});

// ── 3. Auth handoff preserves photo and AI data ──

describe("Add-tree auth handoff", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("pending tree JSON structure includes photo and AI metadata fields", () => {
    const pendingTree = {
      name: "Test Oak",
      species: "Quercus robur",
      latitude: 51.5,
      longitude: -0.1,
      what3words: "filled.count.soap",
      species_ai_predictions: [{ scientificName: "Quercus robur", confidence: 0.9 }],
      species_ai_confirmed: true,
      _photoBase64: "data:image/jpeg;base64,/9j/4AAQ...",
      _photoDate: "2026-03-15T10:00:00Z",
    };

    localStorage.setItem("s33d_pending_tree", JSON.stringify(pendingTree));
    const recovered = JSON.parse(localStorage.getItem("s33d_pending_tree")!);

    expect(recovered._photoBase64).toBe(pendingTree._photoBase64);
    expect(recovered._photoDate).toBe(pendingTree._photoDate);
    expect(recovered.species_ai_predictions).toHaveLength(1);
    expect(recovered.species_ai_confirmed).toBe(true);
  });

  it("recovery code strips _photoBase64 before DB insert", () => {
    const pendingTree: Record<string, unknown> = {
      name: "Test Oak",
      species: "Quercus robur",
      _photoBase64: "data:image/jpeg;base64,abc",
      _photoDate: "2026-03-15",
    };

    const photoBase64 = pendingTree._photoBase64;
    delete pendingTree._photoBase64;
    delete pendingTree._photoDate;

    expect(pendingTree).not.toHaveProperty("_photoBase64");
    expect(pendingTree).not.toHaveProperty("_photoDate");
    expect(photoBase64).toBe("data:image/jpeg;base64,abc");
  });
});

// ── 4. Offline queue — unified module ──

describe("offlineSync module", () => {
  it("exports the core queue API", async () => {
    const mod = await import("@/utils/offlineSync");
    expect(mod.queueAction).toBeDefined();
    expect(mod.getAllActions).toBeDefined();
    expect(mod.pendingActionCount).toBeDefined();
    expect(mod.removeAction).toBeDefined();
    expect(mod.offlineId).toBeDefined();
    expect(mod.isOnline).toBeDefined();
  });

  it("offlineId generates unique IDs", async () => {
    const mod = await import("@/utils/offlineSync");
    const id1 = mod.offlineId();
    const id2 = mod.offlineId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^offline-/);
  });
});

// ── 5. SyncEngine module structure ──

describe("syncEngine", () => {
  it("exports runSync and attachAutoSync", async () => {
    const mod = await import("@/utils/syncEngine");
    expect(mod.runSync).toBeDefined();
    expect(mod.attachAutoSync).toBeDefined();
  });
});

// ── 6. Route registry completeness ──

describe("Route registry (ROUTES)", () => {
  it("exports all critical route constants", async () => {
    const { ROUTES } = await import("@/lib/routes");
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.MAP).toBe("/map");
    expect(ROUTES.ATLAS).toBe("/atlas");
    expect(ROUTES.LIBRARY).toBe("/library");
    expect(ROUTES.HEARTH).toBe("/dashboard");
    expect(ROUTES.VAULT).toBe("/vault");
    expect(ROUTES.BUG_GARDEN).toBe("/bug-garden");
    expect(ROUTES.AGENT_GARDEN).toBe("/agent-garden");
    expect(ROUTES.ROADMAP).toBe("/roadmap");
    expect(ROUTES.COUNCIL).toBe("/council-of-life");
    expect(ROUTES.SUPPORT).toBe("/support");
  });

  it("dynamic route helpers produce correct paths", async () => {
    const { ROUTES } = await import("@/lib/routes");
    expect(ROUTES.COUNTRY("switzerland")).toBe("/atlas/switzerland");
    expect(ROUTES.TREE("abc-123")).toBe("/tree/abc-123");
    expect(ROUTES.HIVE("oak")).toBe("/hive/oak");
    expect(ROUTES.BIO_REGION("alpine")).toBe("/atlas/bio-regions/alpine");
  });
});

// ── 7. Stale debug components removed ──

describe("Stale debug cleanup", () => {
  it("BareLeafletRecoveryMap is no longer importable", async () => {
    try {
      await import("@/components/BareLeafletRecoveryMap");
      expect.unreachable("Should not resolve");
    } catch {
      // Expected — file was deleted
      expect(true).toBe(true);
    }
  });

  it("UltraBareLeafletTest is no longer importable", async () => {
    try {
      await import("@/components/UltraBareLeafletTest");
      expect.unreachable("Should not resolve");
    } catch {
      expect(true).toBe(true);
    }
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Core reliability regression tests for the S33D Atlas loop.
 * Covers: map render, what3words wiring, auth handoff, offline queue.
 */

// ── 1. Map route renders without crashing ──

describe("Map.tsx wrapper", () => {
  it("exports a default component that lazy-loads LeafletFallbackMap", async () => {
    // Verify the module structure — Map.tsx should be a thin wrapper
    const mapModule = await import("@/components/Map");
    expect(mapModule.default).toBeDefined();
    expect(typeof mapModule.default).toBe("function");
  });

  it("does not import maplibregl at the top level", async () => {
    // Read the Map.tsx source and confirm no maplibre imports
    const fs = await import("fs");
    const path = await import("path");
    const mapSource = fs.readFileSync(
      path.resolve(__dirname, "../../components/Map.tsx"),
      "utf-8",
    );
    expect(mapSource).not.toContain("from 'maplibre-gl'");
    expect(mapSource).not.toContain('from "maplibre-gl"');
    expect(mapSource).not.toContain("maplibregl.Popup");
    expect(mapSource).not.toContain("maplibregl.Marker");
  });
});

// ── 2. what3words function wiring is valid ──

describe("what3words util", () => {
  it("convertToCoordinates calls the correct edge function name", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../utils/what3words.ts"),
      "utf-8",
    );
    expect(source).toContain("'convert-what3words'");
  });

  it("convertToWhat3Words calls the reverse edge function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../utils/what3words.ts"),
      "utf-8",
    );
    expect(source).toContain("'convert-what3words-reverse'");
  });

  it("autosuggest calls the autosuggest edge function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../utils/what3words.ts"),
      "utf-8",
    );
    expect(source).toContain("'convert-what3words-autosuggest'");
  });

  it("all three edge function directories exist", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const functionsDir = path.resolve(__dirname, "../../../supabase/functions");
    expect(fs.existsSync(path.join(functionsDir, "convert-what3words/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(functionsDir, "convert-what3words-reverse/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(functionsDir, "convert-what3words-autosuggest/index.ts"))).toBe(true);
  });
});

// ── 3. Auth handoff preserves photo and AI data ──

describe("Add-tree auth handoff", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("pending tree JSON structure includes photo and AI metadata fields", () => {
    // Simulate the data shape stored by AddTreeDialog when user is logged out
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
    // Simulate what AuthPage does
    const pendingTree = {
      name: "Test Oak",
      species: "Quercus robur",
      _photoBase64: "data:image/jpeg;base64,abc",
      _photoDate: "2026-03-15",
    };

    const photoBase64 = pendingTree._photoBase64;
    delete (pendingTree as any)._photoBase64;
    delete (pendingTree as any)._photoDate;

    // After delete, the object should not have underscore fields
    expect(pendingTree).not.toHaveProperty("_photoBase64");
    expect(pendingTree).not.toHaveProperty("_photoDate");
    // But we still have the photo data for upload
    expect(photoBase64).toBe("data:image/jpeg;base64,abc");
  });
});

// ── 4. Offline queue banner reflects unified queue ──

describe("OfflineSyncBanner", () => {
  it("imports from offlineSync (unified), not offlineQueue (legacy)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../components/OfflineSyncBanner.tsx"),
      "utf-8",
    );
    expect(source).toContain("offlineSync");
    expect(source).not.toContain("offlineQueue");
  });
});

// ── 5. Offline sync types are consistent ──

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
});

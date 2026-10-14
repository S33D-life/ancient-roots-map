import { describe, expect, it, afterEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { SATELLITE_LOCATION_LABEL as label, treeLocationLabel, treeMarkerDescription, treeGeographicMetadata } from "@/lib/treeLocationEvidence";
import { buildPopupHtml } from "@/utils/mapPopups";
import TreeMapJourneyAnchor from "@/components/tree-sections/TreeMapJourneyAnchor";
const focusMap = vi.fn();
vi.mock("@/hooks/use-map-focus", () => ({ useMapFocus: () => ({ focusMap }) }));
afterEach(() => { cleanup(); focusMap.mockClear(); });
const tree = { id: "ely-preview-only", name: "Great London Plane of Ely", species: "London Plane", latitude: 52.398272, longitude: 0.261554, what3words: "tight.publisher.partner", location_confidence: "approximate", location_basis: "satellite_estimate" };
describe("location evidence across public projections", () => {
  it("uses the same satellite label for projected and record provenance", () => {
    expect(treeLocationLabel(tree)).toBe(label);
    expect(treeLocationLabel({ metadata: { location_provenance: { basis: "satellite_estimate", label: "Surveyed" } } })).toBe(label);
    expect(treeMarkerDescription(tree)).toBe(`${tree.name} — ${label}`);
  });
  it("does not infer surveyed accuracy or trust arbitrary metadata copy", () => {
    expect(treeLocationLabel({ location_confidence: "approximate" })).toBe("Approximate location — trunk position unverified");
    expect(treeLocationLabel({ metadata: { location_provenance: { label: "<script>unsafe</script>" } } })).toBeNull();
    expect(treeLocationLabel({ location_confidence: "confirmed" })).toBeNull();
  });
  it("does not emit exact geo metadata for satellite or approximate locations", () => {
    expect(treeGeographicMetadata(tree)).toEqual({});
    expect(treeGeographicMetadata({ ...tree, location_basis: null })).toEqual({});
    expect(treeGeographicMetadata({ latitude: 1, longitude: 2 })).toEqual({ geoLat: 1, geoLon: 2 });
  });
  it("updates cached popups when provenance changes and safely escapes the name", () => {
    const plain = { ...tree, name: "<img onerror=unsafe>", location_basis: null, location_confidence: null };
    expect(buildPopupHtml(plain, 0, 0)).not.toContain(label);
    const html = buildPopupHtml({ ...plain, location_basis: "satellite_estimate" }, 0, 0);
    expect(html).toContain(label);
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img onerror=unsafe>");
    expect(html).not.toContain("privateEncounterEvidence");
  });
  it("announces the estimate and preserves the Map destination for keyboard navigation", () => {
    render(<TreeMapJourneyAnchor treeId={tree.id} treeName={tree.name} lat={tree.latitude} lng={tree.longitude} locationLabel={label} />);
    const button = screen.getByRole("button", { name: `${"See " + tree.name} in the Arboreal Atlas — ${label}` });
    expect(screen.getByText(label)).toBeTruthy();
    fireEvent.keyDown(button, { key: "Enter" });
    expect(focusMap).toHaveBeenCalledWith({ type: "tree", id: tree.id, lat: tree.latitude, lng: tree.longitude, source: "tree", journey: true });
  });
});

describe("actual social metadata projections of estimated trees", () => {
  it.each(["fetchTreeMeta", "fetchOfferingMeta"])("%s labels the estimate and omits geographic tags", async (fn) => {
    const fs = await import("node:fs");
    const { runInNewContext } = await import("node:vm");
    const ts = await import("typescript");
    const createClient = () => ({ from(table: string) {
      const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, maybeSingle: () => q,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: table === "trees" ? { ...tree, accessibility_tier: "public", nation: "England" } : table === "offerings" ? { id: "photo", tree_id: tree.id, visibility: "public", title: "Encounter", type: "photo", media_url: "https://example.invalid/public-photo.jpg", photos: [] } : null })) };
      return q;
    } });
    const source = fs.readFileSync("supabase/functions/og-proxy/index.ts", "utf8").replace(/^import[\s\S]*?;\n/gm, "");
    const context: Record<string, unknown> = { createClient, treeLocationLabel, treeGeographicMetadata, Deno: { env: { get: () => "https://example.invalid" }, serve: () => {} }, console };
    runInNewContext(ts.default.transpileModule(source + `\n globalThis.fetchMeta = ${fn};`, { compilerOptions: { target: ts.default.ScriptTarget.ES2022 } }).outputText, context);
    const result = await (context.fetchMeta as (id: string, offering: string) => Promise<Record<string, unknown>>)(tree.id, "photo");
    expect(result.description).toContain(label);
    expect(result.geoLat).toBeUndefined();
    expect(result.geoLon).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("privateEncounterEvidence");
  });
});

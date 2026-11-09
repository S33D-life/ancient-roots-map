import { describe, expect, it, afterEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { SATELLITE_LOCATION_LABEL as label, treeLocationLabel, treeMarkerDescription, satelliteMarkerOptions, isManagedPublicRecord } from "@/lib/treeLocationEvidence";
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
    expect(treeLocationLabel({ location_confidence: "approximate" })).toBeNull();
    expect(treeLocationLabel({ metadata: { location_provenance: { label: "<script>unsafe</script>" } } })).toBeNull();
    expect(treeLocationLabel({ location_confidence: "confirmed" })).toBeNull();
  });
  it.each([{ name: "Ordinary", location_confidence: "confirmed" }, { name: "Approximate", location_confidence: "approximate" }, { name: "Private", accessibility_tier: "private", location_confidence: "approximate" }])("preserves unrelated $name markers", tree => {
    expect(treeLocationLabel(tree)).toBeNull();
    expect(satelliteMarkerOptions(tree)).toEqual({});
    expect(isManagedPublicRecord(tree)).toBe(false);
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

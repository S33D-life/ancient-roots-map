import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AccessibilityStrip from "@/components/AccessibilityStrip";
import AccessibilityFrame from "@/components/AccessibilityFrame";
import { effectiveTier, canCheckIn } from "@/lib/treeAccessibility";
import { isManagedPublicRecord } from "@/lib/treeLocationEvidence";
import { buildPopupHtml } from "@/utils/mapPopups";
import fs from "node:fs";
const proposal = JSON.parse(fs.readFileSync("docs/releases/ely-afc-20261014/public-research-evidence.json", "utf8")).approved_individual_proposal.record_fields;
afterEach(cleanup);
describe("explicit managed-grounds presentation without global access changes", () => {
  it("renders the exact approved Ely note without claiming unrestricted entry", () => {
    expect(isManagedPublicRecord(proposal)).toBe(true);
    render(<AccessibilityStrip tier="public" publicRecordOnly={isManagedPublicRecord(proposal)} notes={proposal.access_notes} />);
    expect(screen.getByText("Public record — check visiting arrangements")).toBeTruthy();
    expect(screen.getByText(proposal.access_notes)).toBeTruthy();
    expect(screen.queryByText(/freely accessible/)).toBeNull();
  });
  it("uses the scoped card label only for the explicitly managed public record", () => {
    render(<AccessibilityFrame tier="public" publicRecordOnly={isManagedPublicRecord(proposal)}><span>Ely</span></AccessibilityFrame>);
    expect(screen.getByLabelText("Accessibility: Public record")).toBeTruthy();
  });
  it.each([{}, { location_confidence: "approximate" }, { access_notes: "Managed Old Palace garden" }])("preserves ordinary public wording without an explicit marker", tree => {
    expect(isManagedPublicRecord(tree, "public")).toBe(false);
    render(<><AccessibilityStrip tier="public" /><AccessibilityFrame tier="public"><span>Tree</span></AccessibilityFrame></>);
    expect(screen.getByText("Open path — freely accessible")).toBeTruthy();
    expect(screen.getByLabelText("Accessibility: Open path")).toBeTruthy();
  });
  it.each([
    ["visible", "Visible from public way — please don't enter the land"],
    ["garden", "Garden access"],
    ["private", "Private land — permission needed to visit"],
    ["granted", "Private land — you have access ✨"],
  ] as const)("never overrides %s permissions or wording", (tier, headline) => {
    expect(isManagedPublicRecord(proposal, tier)).toBe(false);
    render(<AccessibilityStrip tier={tier} publicRecordOnly notes="Existing note" />);
    expect(screen.getByText(text => text === headline || text === `${headline} — Existing note`)).toBeTruthy();
    expect(screen.queryByText("Public record — check visiting arrangements")).toBeNull();
  });
  it("preserves private grant resolution and check-in restriction", () => {
    expect(effectiveTier("private", false)).toBe("private");
    expect(effectiveTier("private", true)).toBe("granted");
    expect(canCheckIn("private")).toBe(false);
    expect(canCheckIn("granted")).toBe(true);
  });
  it("renders managed access in the popup, escapes notes and refreshes cached notes", () => {
    const tree = { ...proposal, id: "ely-test-only" };
    expect(buildPopupHtml(tree, 0, 0)).toContain(proposal.access_notes);
    const revised = buildPopupHtml({ ...tree, access_notes: "<img onerror=unsafe>" }, 0, 0);
    expect(revised).toContain("&lt;img onerror=unsafe&gt;");
    expect(revised).not.toContain(proposal.access_notes);
    expect(buildPopupHtml({ ...tree, accessibility_tier: "private" }, 0, 0)).not.toContain("Public record — check visiting arrangements");
  });
  it("keeps public satellite and private encounter evidence separate", () => {
    expect(proposal.latitude).toBe(52.398272);
    expect(proposal.longitude).toBe(0.261554);
    expect(proposal.what3words).toBe("tight.publisher.partner");
    expect(Object.keys(proposal.metadata.encounter_summary).sort()).toEqual(["date", "evidence", "trunk_reached"]);
  });
});

import { describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import AccessibilityStrip from "@/components/AccessibilityStrip";
import AccessibilityFrame from "@/components/AccessibilityFrame";
import { effectiveTier, canCheckIn } from "@/lib/treeAccessibility";

afterEach(cleanup);

describe("public record wording does not grant visiting permission", () => {
  it("shows managed visiting conditions without promising unrestricted entry", () => {
    render(<AccessibilityStrip tier="public" notes="Managed Old Palace garden. Confirm visiting arrangements with King’s Ely; this record does not grant access." />);
    expect(screen.getByText("Public record — check visiting arrangements")).toBeTruthy();
    expect(screen.getByText(/Managed Old Palace garden/)).toBeTruthy();
    expect(screen.queryByText(/freely accessible/)).toBeNull();
  });

  it("announces record visibility instead of open physical access on cards", () => {
    render(<AccessibilityFrame tier="public"><span>Tree</span></AccessibilityFrame>);
    expect(screen.getByLabelText("Accessibility: Public record").getAttribute("data-accessibility-tier")).toBe("public");
    expect(screen.queryByLabelText("Accessibility: Open path")).toBeNull();
  });

  it.each([
    ["visible", "Visible from public way — please don't enter the land"],
    ["garden", "Garden access"],
    ["private", "Private land — permission needed to visit"],
    ["granted", "Private land — you have access ✨"],
  ] as const)("preserves %s visiting boundaries", (tier, headline) => {
    render(<AccessibilityStrip tier={tier} />);
    expect(screen.getByText(headline)).toBeTruthy();
    expect(screen.queryByText("Public record — check visiting arrangements")).toBeNull();
  });

  it("preserves grant resolution and the private check-in restriction", () => {
    expect(effectiveTier("private", false)).toBe("private");
    expect(effectiveTier("private", true)).toBe("granted");
    expect(effectiveTier("garden", true)).toBe("garden");
    expect(effectiveTier("public", false)).toBe("public");
    expect(canCheckIn("private")).toBe(false);
    expect(canCheckIn("granted")).toBe(true);
  });
});

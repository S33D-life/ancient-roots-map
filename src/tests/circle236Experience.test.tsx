import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import frames from "../../public/council/circle-236/companions.json";
import provenance from "../../docs/releases/circle236-frames-artwork-provenance.json";
import FirstWalkTrail from "@/components/FirstWalkTrail";
const dismiss = vi.hoisted(() => vi.fn());
vi.mock("@/contexts/QuietModeContext", () => ({ useQuietMode: () => ({ showOnboardingNudges: true }) }));
vi.mock("@/hooks/use-first-walk", () => ({ useFirstWalk: () => ({ steps: ["visit-map", "explore-tree", "contribute"], completed: new Set(), finished: false, dismissed: false, dismiss, currentIndex: 0 }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Council-only onboarding preview", () => {
  for (const route of ["/council-of-life", "/review/council/236"]) it(`starts collapsed, expands and preserves dismissal on ${route}`, () => {
    render(<MemoryRouter initialEntries={[route]}><FirstWalkTrail /></MemoryRouter>);
    const toggle = screen.getByRole("button", { name: /Your First Walk/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Visit the Map/ })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Visit the Map/ })).toHaveAttribute("href", "/map");
    fireEvent.click(toggle);
    expect(dismiss).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss trail" }));
    expect(dismiss).toHaveBeenCalledOnce();
  });
  it("retains the existing full trail away from Council", () => {
    render(<MemoryRouter initialEntries={["/library"]}><FirstWalkTrail /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Visit the Map/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Your First Walk/ })).not.toBeInTheDocument();
  });
});

describe("shared companion reading and provenance", () => {
  it("provides readable equivalents without quotes or foraging cues", async () => {
    const { companionPanel } = await import("../../public/tetol/circle-235/pre-fire/runtime/companion-frames.js");
    const D = { circleFrameCompanions: frames.companions };
    for (const c of frames.companions) {
      expect(c.readableText.length).toBeGreaterThan(80);
      expect(c.details).toHaveLength(6);
      const panel = companionPanel(D, c.id, (s: string) => s);
      expect(panel).toContain(c.readableText);
      expect(panel).toContain(c.artworkCaption);
      if (c.safety) expect(panel).toContain(c.safety);
      if (c.presentation === "text-only") { expect(panel).not.toContain("<img"); expect(panel).not.toContain(c.artwork); }
      expect(panel).not.toContain("Sometimes the smallest things");
    }
    expect(frames.companions[1].readableText).toContain("entry 437");
    expect(frames.companions[1].reader).toBe(false);
    expect(frames.copyReview).toBe("PENDING_ED_APPROVAL");
  });
  it("records actual asset hashes while preserving the two original supply hashes", () => {
    for (const entry of provenance) {
      const bytes = readFileSync(`public${entry.path}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(entry.sha256);
      expect(bytes.length).toBe(entry.bytes);
    }
    expect(provenance[0].originalSuppliedSha256).toMatch(/^aa566c/);
    expect(provenance[1].originalSuppliedSha256).toMatch(/^6c2253/);
  });
});

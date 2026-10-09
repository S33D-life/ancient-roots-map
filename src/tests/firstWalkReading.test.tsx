import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import FirstWalkTrail from "@/components/FirstWalkTrail";
vi.mock("@/contexts/QuietModeContext", () => ({ useQuietMode: () => ({ showOnboardingNudges: true }) }));
vi.mock("@/hooks/use-first-walk", () => ({ useFirstWalk: () => ({ steps: ["visit-map", "explore-tree", "contribute"], completed: new Set(), finished: false, dismissed: false, dismiss: vi.fn(), currentIndex: 1 }) }));
describe("first walk while reading", () => {
  it("keeps encounter controls free of the floating trail", () => {
    render(<MemoryRouter initialEntries={["/tree/record"]}><FirstWalkTrail /></MemoryRouter>);
    expect(screen.queryByText("Your First Walk")).not.toBeInTheDocument();
  });
  it("retains the existing dismissible trail on the map", () => {
    render(<MemoryRouter initialEntries={["/map"]}><FirstWalkTrail /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Dismiss trail" })).toBeInTheDocument();
  });
});

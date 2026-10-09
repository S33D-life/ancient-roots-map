import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { UIFlowProvider } from "@/contexts/UIFlowContext";
import FirstWalkTrail from "@/components/FirstWalkTrail";
import PublicTesterBlessing from "@/components/PublicTesterBlessing";

const dismiss = vi.fn();
vi.mock("@/contexts/QuietModeContext", () => ({ useQuietMode: () => ({ showOnboardingNudges: true, showFloatingPrompts: true }) }));
vi.mock("@/hooks/use-first-walk", () => ({ useFirstWalk: () => ({ steps: ["visit-map", "explore-tree", "contribute"], completed: new Set(), finished: false, dismissed: false, dismiss, currentIndex: 1 }) }));

function Introduction() {
  const [open, setOpen] = useState(true);
  return <>{open && <PublicTesterBlessing onComplete={() => setOpen(false)} />}<FirstWalkTrail /></>;
}

describe("Map introduction and First Walk", () => {
  it.each(["Begin the Wander", "Skip introduction"])("defers the trail until %s completes without dismissing it", async button => {
    render(<MemoryRouter initialEntries={["/map"]}><UIFlowProvider><Introduction /></UIFlowProvider></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Dismiss trail" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: button }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Dismiss trail" })).toBeInTheDocument());
    expect(dismiss).not.toHaveBeenCalled();
  });
  it("releases the introduction gate on unmount", () => {
    const view = render(<MemoryRouter initialEntries={["/map"]}><UIFlowProvider><PublicTesterBlessing onComplete={() => {}} /><FirstWalkTrail /></UIFlowProvider></MemoryRouter>);
    expect(screen.queryByText("Your First Walk")).not.toBeInTheDocument();
    view.rerender(<MemoryRouter initialEntries={["/map"]}><UIFlowProvider><FirstWalkTrail /></UIFlowProvider></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Dismiss trail" })).toBeInTheDocument();
  });
});

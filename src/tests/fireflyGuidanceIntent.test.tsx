import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import FireflyGuidance from "@/components/FireflyGuidance";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: () => Promise.resolve({ data: { user: null } }) } } }));
vi.mock("@/hooks/use-seed-economy", () => ({ useSeedEconomy: () => ({ seedsRemaining: 5 }) }));
vi.mock("@/hooks/use-seasonal-summary", () => {
  const seasonal = { active: false };
  return { useSeasonalSummary: () => seasonal };
});
vi.mock("@/contexts/QuietModeContext", () => ({ useQuietMode: () => ({ showTeotagWhispers: true }) }));
afterEach(() => vi.useRealTimers());
const guide = (visible: boolean) => <MemoryRouter><FireflyGuidance visible={visible} fabPosition={{ x: 200, y: 600 }} /></MemoryRouter>;
describe("guide presentation intent", () => {
  it("never interrupts reading when the orb is not engaged", async () => {
    vi.useFakeTimers();
    render(guide(false));
    await act(async () => { vi.advanceTimersByTime(120000); });
    expect(screen.queryByText("— TEOTAG's orb")).not.toBeInTheDocument();
  });
  it("waits for deliberate engagement and cancels when attention moves away", async () => {
    vi.useFakeTimers();
    const view = render(guide(true));
    await act(async () => { vi.advanceTimersByTime(699); });
    expect(screen.queryByText("— TEOTAG's orb")).not.toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.getByText("— TEOTAG's orb")).toBeInTheDocument();
    view.rerender(guide(false));
    await act(async () => { vi.advanceTimersByTime(120000); });
    expect(screen.queryByText("— TEOTAG's orb")).not.toBeInTheDocument();
  });
});

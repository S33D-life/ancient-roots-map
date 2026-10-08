import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrbConstellation from "@/components/OrbConstellation";
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
vi.mock("@/components/GlobalSearch", () => ({ default: ({ open }: { open: boolean }) => open ? <div>Tree search is open</div> : null }));
vi.mock("@/lib/capture-view", () => ({ captureAndExport: vi.fn() }));

afterEach(() => vi.useRealTimers());
function tools() {
  const onClose = vi.fn(), onSelectAction = vi.fn();
  render(<MemoryRouter initialEntries={["/golden-dream"]}><OrbConstellation open onClose={onClose} onSelectAction={onSelectAction} cx={270} cy={680} /></MemoryRouter>);
  return { onClose, onSelectAction };
}
describe("phone tools in internal rooms", () => {
  it("exposes all tools in a named dialog with an explicit close control", () => {
    const { onClose } = tools();
    expect(screen.getByRole("dialog", { name: "TEOTAG’s tools" })).toBeInTheDocument();
    for (const name of ["Signals", "Search", "Whisper", "Companion", "Capture", "Spark"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("keeps the existing Signals action when closing the sheet", () => {
    vi.useFakeTimers();
    const { onClose, onSelectAction } = tools();
    fireEvent.click(screen.getByRole("button", { name: "Signals" }));
    expect(onClose).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(120);
    expect(onSelectAction).toHaveBeenCalledWith("signals");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ParchmentHeader from "@/components/parchment/ParchmentHeader";
vi.mock("@/components/ThemeToggle", () => ({ default: () => null }));
vi.mock("@/components/rhythm/MoonGlyph", () => ({ default: () => null }));

function header(path: string, state?: object) {
  const onSearch = vi.fn();
  render(<MemoryRouter initialEntries={[{ pathname: path, state }]}><ParchmentHeader onSearch={onSearch} signedIn={false} onGuide={vi.fn()} /></MemoryRouter>);
  return onSearch;
}

describe("internal room navigation", () => {
  it("keeps search reachable through the mobile Tree index and returns focus on Escape", () => {
    const onSearch = header("/golden-dream");
    const tree = screen.getByRole("button", { name: "Tree" });
    fireEvent.click(tree);
    expect(tree).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tree).toHaveFocus();
    expect(tree).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(tree);
    fireEvent.click(screen.getAllByRole("button", { name: "Search the Tree" })[1]);
    expect(onSearch).toHaveBeenCalledOnce();
    expect(tree).toHaveAttribute("aria-expanded", "false");
  });
  it("returns a Heartwood room to its Hall", () => {
    header("/library/staff-room");
    expect(screen.getByRole("link", { name: "Hall" })).toHaveAttribute("href", "/library");
  });
  it("uses the reviewed safe return for a folio instead of an external history destination", () => {
    header("/golden-dream/growth/one-circle-many-surfaces", { from: "https://untrusted.invalid" });
    expect(screen.getAllByRole("link", { name: "Crown" }).find(link => link.classList.contains("parchment-back"))!).toHaveAttribute("href", "/golden-dream");
  });
});

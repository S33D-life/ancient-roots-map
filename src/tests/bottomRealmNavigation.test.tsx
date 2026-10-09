import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BottomNav from "@/components/BottomNav";

function navigation(path: string) {
  render(<MemoryRouter initialEntries={[path]}><BottomNav /></MemoryRouter>);
  return within(screen.getByRole("navigation", { name: "Continue through the Tree" }));
}

describe("ground-to-crown realm navigation", () => {
  it("offers all five existing doorways in the living Tree order", () => {
    const links = navigation("/s33d").getAllByRole("link");
    expect(links.map(link => link.getAttribute("aria-label"))).toEqual(["Roots", "Seed", "Heartwood", "Canopy", "Crown"]);
    expect(links.map(link => link.getAttribute("href"))).toEqual(["/map", "/s33d", "/library", "/council-of-life", "/golden-dream"]);
    expect(links[0]).toHaveAttribute("title", "Ancient Friends · Roots");
  });
  it.each([
    ["/map", "Roots"], ["/atlas", "Roots"], ["/tree/record", "Roots"], ["/hives", "Roots"],
    ["/s33d", "Seed"], ["/library/life/betula-pendula", "Heartwood"],
    ["/council-of-life", "Canopy"], ["/golden-dream/growth/record", "Crown"],
  ])("marks only the current realm on %s", (path, label) => {
    const nav = navigation(path);
    expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(nav.getAllByRole("link").filter(link => link.hasAttribute("aria-current"))).toHaveLength(1);
  });
  it("does not assign the wider Tree to an unrelated realm", () => {
    expect(navigation("/").getAllByRole("link").some(link => link.hasAttribute("aria-current"))).toBe(false);
  });
});

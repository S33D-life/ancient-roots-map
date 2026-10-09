import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BottomNav from "@/components/BottomNav";
function Place() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }
function navigation(path: string) { render(<MemoryRouter initialEntries={[path]}><BottomNav /><Place /></MemoryRouter>); }
describe("restored add tree doorway", () => {
  it("keeps the contribution action after Crown", () => {
    navigation("/s33d");
    const nav=screen.getByRole("navigation", {name:"Continue through the Tree"});
    expect(nav.lastElementChild).toBe(screen.getByRole("button", {name:"Add a tree or encounter"}));
    expect(nav.lastElementChild?.previousElementSibling).toHaveAttribute("aria-label", "Crown");
  });
  it("opens the existing map chooser without navigating away from the map", () => {
    navigation("/map");
    const listener=vi.fn(); window.addEventListener("s33d-add-tree-chooser",listener);
    fireEvent.click(screen.getByRole("button", {name:"Add a tree or encounter"}));
    expect(listener).toHaveBeenCalledOnce(); expect(screen.getByRole("status")).toHaveTextContent("/map");
    window.removeEventListener("s33d-add-tree-chooser",listener);
  });
  it("carries the original add-tree intent to the map from Crown", () => {
    navigation("/golden-dream");
    fireEvent.click(screen.getByRole("button", {name:"Add a tree or encounter"}));
    expect(screen.getByRole("status")).toHaveTextContent("/map?addTree=true");
  });
});

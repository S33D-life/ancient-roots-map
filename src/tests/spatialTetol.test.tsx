import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SpatialTetolPage from "@/pages/SpatialTetolPage";

afterEach(cleanup);
it("opens the existing renderer directly and retains a reachable exterior exit", () => {
  render(<MemoryRouter initialEntries={["/tetol#roots"]}><SpatialTetolPage /></MemoryRouter>);
  const frame = screen.getByTitle("Spatial TETOL — the living Tree") as HTMLIFrameElement;
  expect(frame.getAttribute("src")).toBe("/tetol/circle-235/pre-fire/tetol.html?welcome=0#roots");
  expect(screen.getByRole("link", { name: "Return to the Tree" }).getAttribute("href")).toBe("/s33d");
  expect(screen.getByRole("status").textContent).toContain("Opening");
  frame.contentDocument!.open();
  frame.contentDocument!.write('<html><body><h2 id="pname">Roots</h2><button id="mlist">List</button></body></html>');
  frame.contentDocument!.close();
  (frame.contentDocument!.getElementById("mlist") as HTMLButtonElement).onclick = () => {};
  fireEvent.load(frame);
  expect(screen.queryByRole("status")).toBeNull();
});
it("does not pass arbitrary URL-like hashes into the spatial package", () => {
  render(<MemoryRouter initialEntries={["/tetol#https://untrusted.example"]}><SpatialTetolPage /></MemoryRouter>);
  expect(screen.getByTitle("Spatial TETOL — the living Tree").getAttribute("src")).toContain("#overview");
});

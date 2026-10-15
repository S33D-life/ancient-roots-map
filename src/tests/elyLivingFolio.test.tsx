import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { readFileSync } from "node:fs";
import ElyLivingFolioPage from "@/pages/review/ElyLivingFolioPage";
import { ELY_FOLIO, ELY_FOLIO_PATH, elyFolioReturn } from "@/data/afc/elyFolio";

beforeAll(() => { window.scrollTo = vi.fn(); });

describe("Ely public-safe folio — isolated recovery of PR #102", () => {
  it("preserves Paul Wood research #437 without inventing a permanent Atlas ID", () => {
    expect(ELY_FOLIO.identity).toEqual({source:"research-trees", id:"fc085265-5a4f-46f0-a616-f3b869bea8b0"});
    expect(ELY_FOLIO.circles).toEqual([236]);
    expect(ELY_FOLIO.hold).toContain("Atlas");
    expect(ELY_FOLIO.sections.find(s => s.title === "An encounter at the garden")?.text).toContain("could not reach the trunk");
    const text = JSON.stringify(ELY_FOLIO);
    expect(text).not.toMatch(/52\.398|0\.261|what3words|app\.notion|Photo.?9|Photo.?10|localhost/i);
  });
  it("returns only to registered 2D or spatial Circle 236 positions", () => {
    expect(elyFolioReturn(null)).toBe("/review/council/236?mode=2d&returned=1&companion=ely-plane-companion");
    expect(elyFolioReturn("spatial")).toBe("/tetol/circle-235/pre-fire/tetol.html?circle=236#ely-plane-companion");
    expect(elyFolioReturn("https://evil.example")).toBe(elyFolioReturn(null));
  });
  it("renders a credited, readable folio without copying livestream media or reading the database", () => {
    render(<MemoryRouter initialEntries={[`${ELY_FOLIO_PATH}?from=spatial`]}><Routes>
      <Route path={ELY_FOLIO_PATH} element={<ElyLivingFolioPage />}/>
    </Routes></MemoryRouter>);
    expect(screen.getByRole("heading",{name:ELY_FOLIO.name})).toBeTruthy();
    expect(screen.getByText(/Paul Wood research record #437/)).toBeTruthy();
    const live=screen.getByRole("link",{name:"Watch this tree live ↗"});
    expect(live.getAttribute("href")).toBe("https://treecouncil.org.uk/science-and-research/the-london-plane-of-ely/");
    expect(live.getAttribute("rel")).toContain("noopener");
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getAllByRole("link",{name:/Return to Bishop of Ely’s Plane in Circle 236/})[0].getAttribute("href")).toBe(elyFolioReturn("spatial"));
    const source=readFileSync("src/pages/review/ElyLivingFolioPage.tsx","utf8");
    expect(source).not.toMatch(/supabase|research_trees|\.from\(|fetch\(/);
  });
  it("keeps the spatial link inside the existing Circle 236 panel", () => {
    const runtime=readFileSync("public/tetol/circle-235/pre-fire/runtime/companion-frames.js","utf8");
    expect(runtime).toContain("/ancient-friends/bishop-of-elys-plane.html?from=spatial");
    expect(runtime).toContain("data-circle-reader");
    expect(runtime).not.toContain("afcPreview");
  });
});

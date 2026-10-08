import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const calls: string[] = [];
let tasks: { id: string; title: string; status: string }[] = [];
let failTasks = false;

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order"]) chain[m] = (...args: unknown[]) => { calls.push(`${m}:${JSON.stringify(args)}`); return chain; };
  chain.limit = () => Promise.resolve(failTasks ? { data: null, error: { message: "down" } } : { data: tasks, error: null });
  for (const m of ["insert", "update", "upsert", "delete", "rpc"]) chain[m] = () => { calls.push(m); throw new Error(`write ${m}`); };
  return { supabase: { from: (table: string) => { calls.push(`from:${table}`); return chain; }, rpc: () => { calls.push("rpc"); throw new Error("rpc"); } } };
});
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/TetolBreadcrumb", () => ({ default: () => null }));

import GrowthFolio from "@/components/crown/GrowthFolio";
import { restsOn } from "@/lib/crown/growthReading";
import GrowthFolioPage from "@/pages/GrowthFolioPage";
import { IMPLEMENTATION_LABEL, MATURITY_LABEL, ONE_CIRCLE_MANY_SURFACES as G } from "@/data/crown/growths";
import { returnTarget } from "@/lib/crown/returnPath";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderFolio = (build: string | null = null) =>
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter><GrowthFolio growth={G} build={build} /></MemoryRouter>
    </QueryClientProvider>,
  );
const renderPage = (path: string, state?: unknown) =>
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes><Route path="/golden-dream/growth/:growthId" element={<GrowthFolioPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
const article = () => screen.getByRole("article");
const openHeld = () => fireEvent.click(screen.getByRole("button", { name: /How it is held/ }));

describe("Growth Folio · Living Parchment (CROWN_HANDOFF_v3)", () => {
  beforeEach(() => { calls.length = 0; tasks = []; failTasks = false; });

  it("keeps the handed-off section order", () => {
    renderFolio();
    const text = article().textContent ?? "";
    const marks = ["A growth in the Crown · read-only", "how ripe", "what it rests on", "what it waits on", "What happened",
      "Where it grows in the Tree", "What has been built", "Still open", "How it is held", "What needs deciding", "Return to the Crown"];
    const at = marks.map(m => text.indexOf(m));
    at.forEach((i, n) => expect(i, marks[n]).toBeGreaterThanOrEqual(0));
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("shows maturity as a glyph and words, set by TEOTAG, apart from engineering state", () => {
    renderFolio();
    const inShort = screen.getByRole("region", { name: "In short" });
    expect(within(inShort).getByRole("img", { name: "Maturity: Growing" })).toBeInTheDocument();
    expect(inShort).toHaveTextContent("Growing, fourth of six");
    expect(inShort).toHaveTextContent("set by TEOTAG, 7 October 2026");
    expect(inShort).toHaveTextContent(`${G.seams.length} recorded surfaces · 8 merged, 1 held`);
    expect(inShort).toHaveTextContent("recorded evidence, not proof of deployment");
    expect(inShort).toHaveTextContent("3 decisions with TEOTAG");
  });

  it("never puts a maturity word beside an engineering word, or approval words beside maturity", () => {
    const { container } = renderFolio();
    for (const b of screen.getAllByRole("button", { expanded: false })) fireEvent.click(b);
    const maturityWords = Object.values(MATURITY_LABEL);
    const engineering = [...Object.values(IMPLEMENTATION_LABEL), "approved", "Gold", "deployed", "verified"];
    const inShortValue = "recorded surfaces";
    for (const el of container.querySelectorAll("span, p, li, h1, h2")) {
      if (el.children.length > 0) continue;
      const line = el.textContent ?? "";
      if (line.includes(inShortValue)) continue;
      if (!maturityWords.some(m => new RegExp(`\\b${m}\\b`).test(line))) continue;
      for (const e of engineering) expect(line, `"${line}" mixes maturity with ${e}`).not.toMatch(new RegExp(`\\b${e}\\b`, "i"));
    }
  });

  it("shows engineering state as plain words in disclosures, with evidence behind each", () => {
    renderFolio();
    const built = screen.getByRole("region", { name: "What has been built" });
    const toggles = within(built).getAllByRole("button");
    expect(toggles).toHaveLength(G.seams.length);
    expect(within(built).getByText("Held")).toBeInTheDocument();
    const staticSeam = within(built).getByRole("button", { name: /3D Council inheritance/ });
    expect(staticSeam).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(staticSeam);
    expect(staticSeam).toHaveAttribute("aria-expanded", "true");
    expect(built).toHaveTextContent("Pull request #87 · merged 9055912a");
    expect(built).toHaveTextContent("docs/council/Current-Circle-static-seam.md");
  });

  it("lists every still-open item with its seam", () => {
    renderFolio();
    const open = screen.getByRole("region", { name: "Still open" });
    const items = G.seams.flatMap(s => (s.open ?? []).map(item => ({ item, seam: s.surface })));
    expect(within(open).getAllByRole("listitem")).toHaveLength(items.length);
    for (const { item, seam } of items) {
      const row = within(open).getByText(item).closest("li")!;
      expect(row).toHaveTextContent(seam);
    }
  });

  it("keeps Taproot, tending, memory and the release line in one fold, derived from live sources", async () => {
    tasks = [{ id: "t1", title: "Tend the Council doorway", status: "open" }];
    renderFolio();
    expect(screen.queryByText("Taproot understands · depends on")).not.toBeInTheDocument();
    openHeld();
    const held = screen.getByRole("region", { name: "How it is held" });
    expect(held).toHaveTextContent("supabase/functions/_shared/currentCircle.ts");
    expect(held).toHaveTextContent(`read by ${G.sourceOfTruth.readers.length} surfaces`);
    expect(held).toHaveTextContent(CURRENT_CIRCLE.title);
    expect(held).toHaveTextContent(CURRENT_CIRCLE.revision);
    expect(held).toHaveTextContent("The Agent Garden supports tending; it does not decide.");
    expect(await within(held).findByText("Tend the Council doorway")).toBeInTheDocument();
    expect(calls).toContain(`eq:${JSON.stringify(["roadmap_feature_slug", "council"])}`);
    expect(calls.filter(c => ["insert", "update", "upsert", "delete", "rpc"].includes(c))).toEqual([]);
  });

  it("says plainly when the Agent Garden is empty or cannot be read", async () => {
    renderFolio();
    openHeld();
    expect(await screen.findByText(/No tasks are linked yet/)).toBeInTheDocument();
  });

  it("does not assume tasks when the Agent Garden read fails", async () => {
    failTasks = true;
    renderFolio();
    openHeld();
    // The hook retries once before reporting an error.
    expect(await screen.findByText(/could not be reached just now\. Nothing is assumed\./, undefined, { timeout: 5000 })).toBeInTheDocument();
  });

  it("does not claim deployment when served from the last verified production build", () => {
    renderFolio("ce9bab5");
    openHeld();
    expect(screen.getByRole("region", { name: "How it is held" })).toHaveTextContent("This page is served from “Historical verified production source”.");
    fireEvent.click(screen.getByRole("button", { name: /Council Deck doorway/ }));
    expect(screen.getByText("In this build: not included")).toBeInTheDocument();
    expect(screen.queryByText("In this build: included")).not.toBeInTheDocument();
  });

  it("ends with numbered decisions and no controls that approve anything", () => {
    renderFolio();
    const deciding = screen.getByRole("region", { name: "What needs deciding" });
    expect(within(deciding).getAllByRole("listitem")).toHaveLength(G.nextDecisions.length);
    expect(deciding).toHaveTextContent("Reading this page, holding a Staff or connecting an agent does not approve anything.");
    expect(within(deciding).queryByRole("button")).not.toBeInTheDocument();
    for (const b of screen.getAllByRole("button")) expect(b).toHaveAttribute("aria-expanded");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /or visit the Council it came from/ })).toHaveAttribute("href", "/council-of-life");
  });

  it("renders as a scoped Living Parchment sheet without changing the site theme", () => {
    const { container } = renderFolio();
    expect(container.firstElementChild).toHaveClass("light");
    expect(container.firstElementChild).toHaveClass("lp");
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});

describe("Growth Folio page · contextual return and unknown id", () => {
  beforeEach(() => { calls.length = 0; tasks = []; failTasks = false; });

  it("returns to the Crown by default", () => {
    renderPage(`/golden-dream/growth/${G.id}`);
    expect(screen.getByRole("link", { name: "↩ Return to the Crown" })).toHaveAttribute("href", "/golden-dream");
  });

  it("returns the way you came when that is a same-origin path", () => {
    renderPage(`/golden-dream/growth/${G.id}`, { from: "/council-of-life" });
    expect(screen.getByRole("link", { name: "↩ Return to the Council" })).toHaveAttribute("href", "/council-of-life");
  });

  it("ignores an off-site or protocol-relative return", () => {
    for (const from of ["https://evil.example/x", "//evil.example", "/javascript:alert(1)", 42]) {
      expect(returnTarget({ from }).to).toBe("/golden-dream");
    }
  });

  it("renders the not-found state for an unknown growth without crashing", () => {
    renderPage("/golden-dream/growth/no-such-growth");
    expect(screen.getByText("This growth is not in the Crown.")).toBeInTheDocument();
    expect(screen.getByText("It may have been renamed, or never recorded. Nothing is inferred.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "↩ Return to the Crown" })).toHaveAttribute("href", "/golden-dream");
  });
});

describe("restsOn", () => {
  it("counts recorded seams by engineering state", () => {
    expect(restsOn(G.seams)).toBe("9 recorded surfaces · 8 merged, 1 held");
    expect(restsOn([])).toBe("0 recorded surfaces");
  });
});

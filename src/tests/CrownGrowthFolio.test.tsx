import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const calls: string[] = [];
let tasks: { id: string; title: string; status: string }[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order"]) chain[m] = (...args: unknown[]) => { calls.push(`${m}:${JSON.stringify(args)}`); return chain; };
  chain.limit = () => Promise.resolve({ data: tasks, error: null });
  for (const m of ["insert", "update", "upsert", "delete", "rpc"]) chain[m] = () => { calls.push(m); throw new Error(`write ${m}`); };
  return { supabase: { from: (table: string) => { calls.push(`from:${table}`); return chain; }, rpc: () => { calls.push("rpc"); throw new Error("rpc"); } } };
});

import GrowthFolio from "@/components/crown/GrowthFolio";
import { ONE_CIRCLE_MANY_SURFACES as G } from "@/data/crown/growths";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";

const renderFolio = (build: string | null = null) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><GrowthFolio growth={G} build={build} /></MemoryRouter>
    </QueryClientProvider>,
  );

const section = (name: RegExp) => screen.getByRole("region", { name });

describe("Growth Folio", () => {
  beforeEach(() => { calls.length = 0; tasks = []; });

  it("answers each Folio question in its own section", () => {
    renderFolio();
    expect(screen.getByRole("heading", { level: 1, name: G.title })).toBeInTheDocument();
    for (const name of [/came from/, /Public maturity/, /touches/, /depends on/, /tended/, /built, tested and merged/, /candidate, held or undeployed/, /remembered/, /Decisions needed/]) {
      expect(section(name)).toBeInTheDocument();
    }
  });

  it("shows Growing as public maturity, apart from build state", () => {
    renderFolio();
    const maturity = section(/Public maturity/);
    expect(within(maturity).getByRole("list", { name: "Public maturity: Growing" })).toBeInTheDocument();
    expect(within(maturity).queryByText(/Merged|Held|Candidate/)).not.toBeInTheDocument();
    const dev = section(/built, tested and merged/);
    expect(within(dev).queryByText("Growing")).not.toBeInTheDocument();
    expect(within(dev).getAllByText("Merged").length).toBeGreaterThan(0);
    expect(within(dev).getByText("Held")).toBeInTheDocument();
    expect(within(dev).getByText("Candidate · testing")).toBeInTheDocument();
  });

  it("derives Taproot facts from the live Current Circle source", () => {
    renderFolio();
    const taproot = section(/depends on/);
    expect(within(taproot).getByText(CURRENT_CIRCLE.title)).toBeInTheDocument();
    expect(within(taproot).getByText(CURRENT_CIRCLE.revision)).toBeInTheDocument();
    expect(within(taproot).getByText("supabase/functions/_shared/currentCircle.ts")).toBeInTheDocument();
  });

  it("lists what the growth explicitly does not touch", () => {
    renderFolio();
    const realms = section(/touches/);
    for (const t of G.realms.notTouched) expect(within(realms).getByText(t)).toBeInTheDocument();
  });

  it("reads Agent Garden tasks by the existing roadmap key and never writes", async () => {
    tasks = [{ id: "t1", title: "Tend the Council doorway", status: "open" }];
    renderFolio();
    expect(await screen.findByText("Tend the Council doorway")).toBeInTheDocument();
    expect(calls).toContain("from:agent_garden_tasks");
    expect(calls).toContain(`eq:${JSON.stringify(["roadmap_feature_slug", "council"])}`);
    expect(calls.some(c => c.startsWith("select:") && c.includes("id, title, status"))).toBe(true);
    expect(calls.filter(c => ["insert", "update", "upsert", "delete", "rpc"].includes(c))).toEqual([]);
  });

  it("says plainly when no tasks are linked", async () => {
    renderFolio();
    expect(await screen.findByText(/No tasks are linked yet/)).toBeInTheDocument();
  });

  it("does not claim deployment when served from the last verified production build", () => {
    renderFolio("ce9bab5");
    const dev = section(/built, tested and merged/);
    expect(within(dev).getAllByText("Not included").length).toBeGreaterThan(0);
    expect(within(dev).queryByText("Included")).not.toBeInTheDocument();
    expect(within(section(/candidate, held or undeployed/)).getAllByText(/Merged, not in this build/).length).toBeGreaterThan(0);
  });

  it("offers no controls, only links", () => {
    renderFolio();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to the Crown/ })).toHaveAttribute("href", "/golden-dream");
  });

  it("renders as a scoped Living Parchment sheet without changing the site theme", () => {
    const { container } = renderFolio();
    expect(container.firstElementChild).toHaveClass("light");
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});

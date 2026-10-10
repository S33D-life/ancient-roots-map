import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const db = vi.hoisted(() => ({ species: [] as Record<string, unknown>[], trees: [] as Record<string, unknown>[], fail: false, filters: [] as string[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => {
  const filters: [string, unknown][] = [];
  const result = () => ({ data: (table === "trees" ? db.trees : db.species).filter(row => filters.every(([k, v]) => row[k] === v)), error: db.fail ? new Error("Unavailable") : null });
  const chain = { select: () => chain, eq: (key: string, value: unknown) => { filters.push([key, value]); db.filters.push(`${key}:${value}`); return chain; }, limit: () => chain, maybeSingle: async () => ({ ...result(), data: result().data[0] ?? null }), then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve) };
  return chain;
} } }));
vi.mock("@/components/parchment/ParchmentGround", () => ({ ParchmentGround: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/hooks/use-parchment-dark", () => ({ useParchmentDark: () => false, applySiteTheme: vi.fn() }));
vi.mock("@/components/council/BirchFrameStudy", () => ({ default: ({ onOpen }: { onOpen: () => void }) => <button onClick={onOpen}>Test spatial frame</button> }));
import { BIRCH_REF, SILVER_BIRCH_REF, birchAppearance, birchThreadSources, publicBirchRecords, publicThreadTree, THREAD_PATTERNS, THREAD_ROUTES, threadReturn } from "@/data/library/birchThread";
import { BirchPreparationPage, BirchReadingPage } from "@/pages/library/BirchThreadPage";
import { resolveRecordIdentity } from "@/lib/library/recordIdentity";
const individual = "abb025be-1ea7-48be-8a21-d7daf90e4c21";
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function mount(path: string) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}><Location /><Routes><Route path={THREAD_PATTERNS.CIRCLE} element={<BirchPreparationPage />} /><Route path={THREAD_PATTERNS.IDENTITY} element={<BirchReadingPage />} /></Routes></MemoryRouter></QueryClientProvider>); }
beforeEach(() => {
  db.fail = false; db.filters = [];
  db.species = [{ ...SILVER_BIRCH_REF, species_key: "betula-pendula", rank: "species", genus: "Betula", common_name: "Silver Birch", scientific_name: "Betula pendula" }];
  db.trees = [{ id: individual, name: "Birch", species_key: "betula-pendula", accessibility_tier: "public", what3words: null, latitude: 51.5, longitude: -.1 }, { id: "a6470bac-a114-4bd6-bc04-d51de580445f", name: "QA Test Birch #6", species_key: "betula-pendula", accessibility_tier: "public", what3words: "test.qa.birch" }, { id: "b6470bac-a114-4bd6-bc04-d51de580445f", name: "Private tree", species_key: "betula-pendula", accessibility_tier: "private", what3words: null }];
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
describe("one living Birch thread", () => {
  it("resolves the existing broad reference without replacing it with its species strand", async () => {
    const genus = await resolveRecordIdentity(BIRCH_REF, birchThreadSources);
    const species = await resolveRecordIdentity(SILVER_BIRCH_REF, birchThreadSources);
    expect(genus.status === "ready" && genus.identity.scope).toBe("genus");
    expect(species.status === "ready" && species.identity.scope).toBe("species");
    expect(BIRCH_REF.id).not.toBe(SILVER_BIRCH_REF.id);
    expect((await resolveRecordIdentity({ source: "notion", id: individual }, birchThreadSources)).status).toBe("stop");
  });
  it("only projects public, exact-key records and excludes the existing QA seed marker", async () => {
    expect((await publicBirchRecords()).map(row => row.id)).toEqual([individual]);
    expect(await publicThreadTree("b6470bac-a114-4bd6-bc04-d51de580445f")).toBeNull();
    expect(await publicThreadTree("a6470bac-a114-4bd6-bc04-d51de580445f")).toBeNull();
    expect(db.filters).toContain("accessibility_tier:public");
  });
  it("fails closed on a changed genus or failed data request", async () => {
    db.species[0].genus = "Other";
    expect((await resolveRecordIdentity(SILVER_BIRCH_REF, birchThreadSources)).status).toBe("stop");
    db.fail = true;
    await expect(publicBirchRecords()).rejects.toThrow("Unavailable");
  });
  it.each(["2d", "spatial"] as const)("preserves the %s appearance through species, individual, refreshable query, and return focus", async mode => {
    mount(`${THREAD_ROUTES.circle(236)}?mode=${mode}`);
    fireEvent.click(await screen.findByRole("button", { name: "Look closer at Birch →" }));
    await screen.findByRole("heading", { name: "What is Birch?" });
    expect(screen.getByTestId("location").textContent).toContain(BIRCH_REF.id);
    await screen.findByRole("heading", { name: "Silver Birch" });
    fireEvent.click(await screen.findByRole("button", { name: "Birch Public mapped tree →" }));
    await screen.findByRole("heading", { name: "Birch · mapped tree" });
    expect(screen.getByRole("link", { name: "Find this tree on the Map →" }).getAttribute("href")).toBe(`/map?tree=${individual}`);
    expect(screen.getByTestId("location").textContent).toContain(`livingRecord=${individual}`);
    fireEvent.click(screen.getByRole("button", { name: "← Return to Birch in Circle 236" }));
    await waitFor(() => expect(document.activeElement?.id).toBe("birch-companion"));
    expect(screen.getByTestId("location").textContent).toBe(`/review/council/236?mode=${mode}&returned=1`);
  });
  it("direct entry does not invent a Circle return, and malformed selection is recoverable", async () => {
    mount(`${THREAD_ROUTES.identity(BIRCH_REF)}?livingRecord=invalid`);
    await screen.findByRole("heading", { name: "What is Birch?" });
    expect(screen.getByRole("button", { name: "← Return to the Library" })).toBeTruthy();
    expect(screen.getByText("This record is unavailable in the public Birch thread.")).toBeTruthy();
    expect(threadReturn(null).state).toBeUndefined();
    expect(threadReturn({ ...birchAppearance("2d").returnContext, contextId: "council-of-life/circle-999" } as never).state).toBeUndefined();
  });
});

/**
 * PLANeTary Library · Birch first vertical slice — acceptance tests.
 * Ancient Friend → exact stored species_key → canonical species_index row →
 * Heartwood Library → Species & Distribution → Reader → exact Ancient Friend return.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Row = Record<string, unknown>;
const db = {
  species: [] as Row[],
  trees: [] as Row[],
  errorOn: new Set<string>(),
  /** Simulates a slug index that points somewhere else. */
  slugIndex: {} as Record<string, Row>,
  /** Simulates a collation that matches keys case-insensitively. */
  caseInsensitiveKey: false,
};
const calls: string[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    calls.push(`from:${table}`);
    const filters: [string, unknown][] = [];
    const chain: Record<string, unknown> = {};
    chain.select = (cols: string) => { calls.push(`select:${table}:${cols}`); return chain; };
    for (const op of ["eq", "ilike", "contains", "in", "or", "order", "limit", "textSearch", "neq", "not", "is"]) {
      chain[op] = (...a: unknown[]) => {
        calls.push(`${op}:${table}:${JSON.stringify(a)}`);
        if (op === "eq") filters.push([a[0] as string, a[1]]);
        return chain;
      };
    }
    for (const w of ["insert", "update", "upsert", "delete"]) chain[w] = () => { calls.push(`WRITE:${w}:${table}`); throw new Error("write"); };
    chain.maybeSingle = async () => {
      if (db.errorOn.has(table)) return { data: null, error: { message: "boom" } };
      const source = table === "species_index" ? db.species : table === "trees" ? db.trees : [];
      const slugFilter = filters.find(([k]) => k === "slug");
      if (table === "species_index" && slugFilter && db.slugIndex[slugFilter[1] as string]) {
        return { data: db.slugIndex[slugFilter[1] as string], error: null };
      }
      const rows = source.filter(r => filters.every(([k, v]) =>
        db.caseInsensitiveKey && k === "species_key" ? String(r[k]).toLowerCase() === String(v).toLowerCase() : r[k] === v));
      if (rows.length > 1) return { data: null, error: { message: "JSON object requested, multiple rows returned" } };
      return { data: rows[0] ?? null, error: null };
    };
    chain.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
    return chain;
  };
  return { supabase: { from, rpc: (...a: unknown[]) => { calls.push(`rpc:${JSON.stringify(a)}`); return Promise.resolve({ data: [], error: null }); } } };
});
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/TetolBreadcrumb", () => ({ default: () => null }));

import LibraryLifePage from "@/pages/library/LibraryLifePage";
import LibraryDoorway from "@/components/library/life/LibraryDoorway";
import TreeStructuredDataCard from "@/components/tree-sections/TreeStructuredDataCard";
import { LibraryContentContext } from "@/components/library/life/LibraryContentContext";
import { createContentSource, isPublishable, PILOT_CHAPTERS, type LibraryChapter } from "@/data/library/content";
import { parseOrigin, returnPathFor, withOrigin } from "@/lib/library/origin";
import { LIBRARY_LIFE_ROUTES } from "@/lib/library/routes";

const KEY = "betula-pendula";
const SPECIES: Row = { id: "sp-1", slug: "silver-birch", species_key: KEY, scientific_name: "Betula pendula", canonical_common_name: "Silver Birch", family: "Betulaceae", common_name: "Silver Birch" };
const T1 = "abb025be-1ea7-48be-8a21-d7daf90e4c21";
const T2 = "a6470bac-a114-4bd6-bc04-d51de580445f";
const TREE1: Row = { id: T1, name: "Birch", species: "Birch", species_key: KEY, accessibility_tier: "public" };
const TREE2: Row = { id: T2, name: "QA Test Birch #6", species: "Birch", species_key: KEY, accessibility_tier: "public" };

const APPROVED: LibraryChapter = {
  speciesKey: KEY, chapterId: "species-and-distribution", portal: "species-distribution", title: "Species & distribution",
  paragraphs: ["APPROVED TEST PARAGRAPH."], claims: [{ kind: "question", statement: "TEST QUESTION", sourceIds: [] }],
  sources: [{ id: "s1", kind: "paper", title: "TEST SOURCE", status: "suggested" }],
  revision: 3, review: { state: "approved", reviewedBy: "TEOTAG", reviewedAt: "2026-10-08", reviewBy: "2027-04-08" },
  publication: { state: "published", approvedBy: "TEOTAG", approvedAt: "2026-10-08" },
};

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage(url: string, chapters: readonly LibraryChapter[] = PILOT_CHAPTERS) {
  return render(
    <QueryClientProvider client={client()}>
      <LibraryContentContext.Provider value={createContentSource(chapters)}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/library/life/:speciesKey" element={<LibraryLifePage view="home" />} />
            <Route path="/library/life/:speciesKey/species-distribution" element={<LibraryLifePage view="species" />} />
            <Route path="/library/life/:speciesKey/read/:chapterId" element={<LibraryLifePage view="reader" />} />
          </Routes>
        </MemoryRouter>
      </LibraryContentContext.Provider>
    </QueryClientProvider>,
  );
}
const renderDoorway = (treeId: string, speciesKey: string | null) =>
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter><LibraryDoorway treeId={treeId} speciesKey={speciesKey} /></MemoryRouter>
    </QueryClientProvider>,
  );
const originQ = (id: string) => `?originType=ancient-friend&originId=${id}`;
const settle = () => new Promise(r => setTimeout(r, 30));
const returnLinks = () => screen.queryAllByRole("link", { name: /^↩ Return to/ });

const LIB_FILES = [
  "src/pages/library/LibraryLifePage.tsx", "src/hooks/use-library-identity.ts", "src/hooks/use-library-origin.ts",
  "src/lib/library/origin.ts", "src/lib/library/routes.ts", "src/data/library/content.ts",
  ...readdirSync(resolve("src/components/library/life")).map(f => join("src/components/library/life", f)),
].filter(f => statSync(resolve(f)).isFile());
/** Code only: block and line comments are stripped so documentation of what the code avoids does not match. */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
const libSource = () => LIB_FILES.map(f => [f, stripComments(readFileSync(resolve(f), "utf8"))] as const);

beforeEach(() => {
  calls.length = 0;
  db.species = [SPECIES]; db.trees = [TREE1, TREE2]; db.errorOn.clear(); db.slugIndex = {}; db.caseInsensitiveKey = false;
});
afterEach(cleanup);

describe("1 · identity resolves only through the exact stored key", () => {
  it("queries species_index by exact species_key (and verifies the slug back), nothing fuzzy", async () => {
    renderDoorway(T1, KEY);
    expect(await screen.findByRole("link", { name: "Open in Library of Life →" })).toBeInTheDocument();
    const speciesCalls = calls.filter(c => c.includes(":species_index:"));
    expect(speciesCalls).toContain(`eq:species_index:${JSON.stringify(["species_key", KEY])}`);
    expect(speciesCalls).toContain(`eq:species_index:${JSON.stringify(["slug", "silver-birch"])}`);
    expect(speciesCalls.filter(c => /^(ilike|contains|or|textSearch|in):/.test(c))).toEqual([]);
    expect(calls.filter(c => c.startsWith("rpc:"))).toEqual([]);
    expect(calls.some(c => c.includes("normalized_name") || c.includes("synonym"))).toBe(false);
  });

  it("never imports free-text resolution, fuzzy matching, GBIF enrichment or key generation", () => {
    for (const [f, src] of libSource()) {
      expect(src, f).not.toMatch(/speciesResolver|use-species-resolution|treeSpecies|matchSpecies|enrichSpecies|gbif|slugify/i);
    }
  });

  it("preserves the opaque key exactly in the route", () => {
    expect(LIBRARY_LIFE_ROUTES.HOME(KEY)).toBe("/library/life/betula-pendula");
    expect(LIBRARY_LIFE_ROUTES.HOME("Odd Key/1")).toBe("/library/life/Odd%20Key%2F1");
  });
});

describe("2–4 · eligibility needs a successful exact lookup", () => {
  it("2 · free-text “Birch” with no key creates no doorway and no species lookup", async () => {
    renderDoorway("1163190f-4484-4879-9822-9be59bc8ba55", null);
    await settle();
    expect(screen.queryByRole("link")).toBeNull();
    expect(calls.filter(c => c.includes("species_index"))).toEqual([]);
  });

  it("2 · the Ancient Friend page has exactly one doorway, fed only by the stored species_key", () => {
    const page = stripComments(readFileSync(resolve("src/pages/TreeDetailPage.tsx"), "utf8"));
    const uses = page.match(/<LibraryDoorway\b[^>]*\/>/g) ?? [];
    expect(uses).toHaveLength(1);
    expect(uses[0]).toContain("speciesKey={tree.species_key}");
    expect(uses[0]).toContain("treeId={tree.id}");
    expect(uses[0]).not.toMatch(/speciesResolution|tree\.species\b/);
    // Not inside the lore/description-gated Story section, so unstoried keyed trees (like the live Birch) still get it.
    const story = stripComments(readFileSync(resolve("src/components/tree-sections/TreeStorySection.tsx"), "utf8"))
      + stripComments(readFileSync(resolve("src/components/tree-sections/TreeStructuredDataCard.tsx"), "utf8"));
    expect(story).not.toContain("LibraryDoorway");
  });

  it("2 · the Story card shows no Library link for an unkeyed Birch even though its text reads “Birch”", async () => {
    render(
      <QueryClientProvider client={client()}>
        <MemoryRouter>
          <TreeStructuredDataCard tree={{ id: "1163190f-4484-4879-9822-9be59bc8ba55", species: "Birch", species_key: null, name: "Weeping birch" } as never} ecoBelonging={[]} speciesResolution={null} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await settle();
    expect(screen.queryByRole("link", { name: /Library of Life/ })).toBeNull();
  });

  it("2 · the doorway for the keyed Birch carries its own id", async () => {
    renderDoorway(T1, KEY);
    const link = await screen.findByRole("link", { name: "Open in Library of Life →" });
    expect(link).toHaveAttribute("href", `/library/life/${KEY}${originQ(T1)}`);
  });

  it("pilot scope · a keyed species with no Library record gets no doorway and no lookup", async () => {
    db.species = [SPECIES, { ...SPECIES, id: "sp-oak", slug: "english-oak", species_key: "quercus-robur", scientific_name: "Quercus robur", canonical_common_name: "English Oak", common_name: "English Oak", family: "Fagaceae" }];
    renderDoorway(T1, "quercus-robur");
    await settle();
    expect(screen.queryByRole("link")).toBeNull();
    expect(calls.filter(c => c.includes("species_index"))).toEqual([]);
  });

  it("3 · missing key (null or empty) = no doorway", async () => {
    for (const k of [null, ""]) {
      renderDoorway(T1, k);
      await settle();
      expect(screen.queryByRole("link")).toBeNull();
      cleanup();
    }
  });

  it("4 · lookup error, no row, ambiguous rows or a non-exact match = no doorway", async () => {
    const scenarios: [string, () => void][] = [
      ["error", () => db.errorOn.add("species_index")],
      ["no row", () => { db.species = []; }],
      ["ambiguous", () => { db.species = [SPECIES, { ...SPECIES, id: "sp-dup" }]; }],
      ["case-insensitive collation", () => { db.caseInsensitiveKey = true; db.species = [{ ...SPECIES, species_key: "Betula-Pendula" }]; }],
    ];
    for (const [name, arrange] of scenarios) {
      db.species = [SPECIES]; db.errorOn.clear(); db.caseInsensitiveKey = false;
      arrange();
      renderDoorway(T1, KEY);
      await settle();
      expect(screen.queryByRole("link"), name).toBeNull();
      cleanup();
    }
  });
});

describe("5 · slug mismatch = STOP", () => {
  it("stops the doorway and the Library page when the slug resolves to another row", async () => {
    db.slugIndex = { "silver-birch": { ...SPECIES, id: "sp-other", species_key: "betula-pubescens" } };
    renderDoorway(T1, KEY);
    await settle();
    expect(screen.queryByRole("link")).toBeNull();
    cleanup();
    renderPage(`/library/life/${KEY}${originQ(T1)}`);
    expect(await screen.findByText("This species is not in the Library.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Silver Birch" })).toBeNull();
  });
});

describe("6–7 · one species identity, each tree keeps its own return and its offerings", () => {
  it("6 · two Ancient Friends open the same species identity but return to their own tree", async () => {
    for (const [id, name] of [[T1, "Birch"], [T2, "QA Test Birch #6"]] as const) {
      renderPage(`/library/life/${KEY}${originQ(id)}`);
      expect(await screen.findByRole("heading", { level: 1, name: "Silver Birch" })).toBeInTheDocument();
      const links = await screen.findAllByRole("link", { name: `↩ Return to ${name}` });
      for (const l of links) expect(l).toHaveAttribute("href", `/tree/${id}`);
      expect(screen.getByRole("link", { name: /Species & distribution/ })).toHaveAttribute("href", `/library/life/${KEY}/species-distribution${originQ(id)}`);
      expect(screen.getByTestId("library-arrival")).toHaveTextContent(`You came from ${name}`);
      cleanup();
    }
  });

  it("7 · the Library never reads or writes offerings and never writes the tree", async () => {
    renderPage(`/library/life/${KEY}/species-distribution${originQ(T1)}`);
    await screen.findByRole("heading", { name: "Species & distribution" });
    renderDoorway(T1, KEY);
    await settle();
    expect(calls.filter(c => c.includes("offerings"))).toEqual([]);
    expect(calls.filter(c => c.startsWith("WRITE"))).toEqual([]);
    expect(calls.filter(c => c.startsWith("select:trees:"))).toEqual(["select:trees:id, name, species_key, accessibility_tier"]);
  });
});

describe("8–10 · origin is navigation context only", () => {
  it("8 · a refresh (fresh mount of the same URL) keeps the exact origin at every hop", async () => {
    for (const url of [`/library/life/${KEY}${originQ(T1)}`, `/library/life/${KEY}/species-distribution${originQ(T1)}`, `/library/life/${KEY}/read/species-and-distribution${originQ(T1)}`]) {
      for (let i = 0; i < 2; i++) {
        renderPage(url);
        const links = await screen.findAllByRole("link", { name: "↩ Return to Birch" });
        for (const l of links) expect(l).toHaveAttribute("href", `/tree/${T1}`);
        cleanup();
      }
    }
  });

  it("9 · direct entry without origin falls back to the Library", async () => {
    renderPage(`/library/life/${KEY}`);
    await screen.findByRole("heading", { level: 1, name: "Silver Birch" });
    const links = await screen.findAllByRole("link", { name: "↩ Return to the Library" });
    for (const l of links) expect(l).toHaveAttribute("href", "/library");
    expect(screen.queryByTestId("library-arrival")).toBeNull();
    expect(calls.filter(c => c.startsWith("from:trees"))).toEqual([]);
  });

  it("9 · unavailable, private or failing origin trees fall back to the Library", async () => {
    const PRIV = "00000000-0000-4000-8000-000000000001";
    const MISSING = "00000000-0000-4000-8000-000000000002";
    db.trees.push({ id: PRIV, name: "Private Friend", species_key: KEY, accessibility_tier: "private" });
    for (const id of [PRIV, MISSING]) {
      renderPage(`/library/life/${KEY}${originQ(id)}`);
      await screen.findByRole("heading", { level: 1, name: "Silver Birch" });
      const links = await screen.findAllByRole("link", { name: "↩ Return to the Library" });
      for (const l of links) expect(l).toHaveAttribute("href", "/library");
      expect(screen.queryByText(/Private Friend/)).toBeNull();
      // A checked-and-unavailable origin is not carried onward either.
      expect(screen.getByRole("link", { name: /Species & distribution/ })).toHaveAttribute("href", `/library/life/${KEY}/species-distribution`);
      cleanup();
    }
    db.errorOn.add("trees");
    renderPage(`/library/life/${KEY}${originQ(T1)}`);
    const links = await screen.findAllByRole("link", { name: "↩ Return to the Library" });
    for (const l of links) expect(l).toHaveAttribute("href", "/library");
  });

  it("10 · hostile or malformed origin input can never create another return path", async () => {
    const hostile = [
      "?originType=url&originId=https://evil.example",
      "?originType=ancient-friend&originId=https://evil.example",
      "?originType=ancient-friend&originId=//evil.example",
      "?originType=ancient-friend&originId=../../admin",
      `?originType=ancient-friend&originId=${T1}%0A`,
      `?originType=ancient-friend&originId=${T1}&originId=${T2}`,
      `?originType=ancient-friend&originType=council&originId=${T1}`,
      `?originType=Ancient-Friend&originId=${T1}`,
      "?originType=ancient-friend&originId=%2F%2Fevil.example",
      "?returnTo=https://evil.example&next=//evil.example",
      `?originType=ancient-friend&originId=${T1.slice(0, -1)}`,
    ];
    for (const q of hostile) {
      renderPage(`/library/life/${KEY}${q}`);
      await screen.findByRole("heading", { level: 1, name: "Silver Birch" });
      for (const a of screen.getAllByRole("link")) {
        const href = a.getAttribute("href")!;
        expect(href, q).toMatch(/^\/(library(\/life\/betula-pendula(\/species-distribution)?)?)$/);
      }
      expect(returnLinks().map(a => a.getAttribute("href"))).toEqual(["/library", "/library"]);
      cleanup();
    }
    expect(parseOrigin(new URLSearchParams(`originType=ancient-friend&originId=${T1.toUpperCase()}`))).toEqual({ type: "ancient-friend", id: T1 });
    expect(returnPathFor({ type: "ancient-friend", id: T1 }, false)).toBe("/library");
    expect(withOrigin("/library/life/x", null)).toBe("/library/life/x");
  });
});

describe("11 · only approved, published chapters render", () => {
  it("the shipped pilot chapter carries no prose and is not publishable", () => {
    for (const c of PILOT_CHAPTERS) {
      expect(isPublishable(c)).toBe(false);
      expect(c.paragraphs).toEqual([]);
    }
  });

  it("an unapproved chapter is inert in the portal and not rendered in the Reader", async () => {
    renderPage(`/library/life/${KEY}/species-distribution${originQ(T1)}`);
    const portal = await screen.findByText("being prepared · not yet approved");
    expect(portal.closest("[aria-disabled='true']")).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Species & distribution →/ })).toBeNull();
    cleanup();
    for (const variant of [
      { ...APPROVED, review: { state: "in-review" as const } },
      { ...APPROVED, publication: { state: "unpublished" as const } },
      { ...APPROVED, publication: { state: "withdrawn" as const } },
    ]) {
      renderPage(`/library/life/${KEY}/read/species-and-distribution${originQ(T1)}`, [variant]);
      expect(await screen.findByRole("heading", { name: "This chapter is not published yet." })).toBeInTheDocument();
      expect(screen.queryByText("APPROVED TEST PARAGRAPH.")).toBeNull();
      cleanup();
    }
    renderPage(`/library/life/${KEY}/read/unknown-chapter${originQ(T1)}`, [APPROVED]);
    expect(await screen.findByRole("heading", { name: "This chapter is not published yet." })).toBeInTheDocument();
  });

  it("an approved, published chapter renders with evidence, sources and review metadata", async () => {
    renderPage(`/library/life/${KEY}/read/species-and-distribution${originQ(T1)}`, [APPROVED]);
    const article = await screen.findByRole("article");
    expect(within(article).getByRole("heading", { level: 1, name: "Species & distribution" })).toBeInTheDocument();
    expect(article).toHaveTextContent("APPROVED TEST PARAGRAPH.");
    expect(article).toHaveTextContent("TEST QUESTION · source to be attached");
    expect(article).toHaveTextContent("TEST SOURCE · suggested");
    expect(article).toHaveTextContent("Revision 3 · reviewed by TEOTAG on 2026-10-08 · next review by 2027-04-08");
    expect((await screen.findAllByRole("link", { name: "↩ Return to Birch" }))[0]).toHaveAttribute("href", `/tree/${T1}`);
  });

  it("the content contract holds no taxonomy, tree, offering, Council or permission fields", () => {
    const keys = new Set(PILOT_CHAPTERS.flatMap(c => Object.keys(c)));
    for (const k of ["scientificName", "genus", "family", "rank", "commonName", "treeId", "offeringId", "offerings", "circle", "companion", "council", "role", "permissions"]) {
      expect(keys.has(k), k).toBe(false);
    }
  });
});

describe("12 · no Birch Council relationship", () => {
  it("renders no Circle, Council or companion wording at any hop", async () => {
    for (const url of [`/library/life/${KEY}${originQ(T1)}`, `/library/life/${KEY}/species-distribution${originQ(T1)}`]) {
      renderPage(url);
      const page = await screen.findByTestId("library-life");
      await screen.findByRole("heading", { level: 1 });
      expect(page.textContent).not.toMatch(/circle|council|companion|appearing/i);
      cleanup();
    }
    for (const [f, src] of libSource()) expect(src, f).not.toMatch(/currentCircle|CURRENT_CIRCLE|council/i);
  });
});

describe("14 · Crown is untouched", () => {
  it("no Library file depends on Crown code", () => {
    for (const [f, src] of libSource()) expect(src, f).not.toMatch(/crown|golden-dream|GrowthFolio/i);
  });
});

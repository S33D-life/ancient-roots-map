import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { isQaSeedTree } from "@/lib/library/relatedTrees";

const db = vi.hoisted(() => ({ error: false, selected: "", key: "", rows: [
  { id: "real-1", name: "Birch", what3words: "marbles.flipper.micro", nation: null },
  { id: "real-2", name: "Silver Birch", what3words: "fuels.elsewhere.corals", nation: null },
  { id: "qa", name: "QA Test Birch #6", what3words: "test.qa.birch", nation: "United Kingdom" },
] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({
  select: (columns: string) => {
    db.selected = columns;
    return { eq: (_column: string, key: string) => { db.key = key; return {
      limit: async () => ({ data: db.rows, error: db.error ? new Error("lookup failed") : null }),
    }; } };
  },
}) } }));
import { useSpeciesTrees } from "@/hooks/use-treeasurus";

afterEach(() => { cleanup(); db.error = false; });
function Projection() {
  const result = useSpeciesTrees("betula-pendula");
  if (result.isError) return <p role="alert">Mapped trees unavailable</p>;
  return <>{(result.data ?? []).map(t => <a key={t.id} href={`/tree/${t.id}`}>{t.name}</a>)}</>;
}
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Projection /></MemoryRouter></QueryClientProvider>);
}
describe("exact-key mapped tree projection", () => {
  it("uses the existing nation column, preserves the exact key and removes corroborated QA seeds", async () => {
    mount();
    await screen.findByRole("link", { name: "Birch" });
    expect(screen.getByRole("link", { name: "Silver Birch" })).toHaveAttribute("href", "/tree/real-2");
    expect(screen.queryByText("QA Test Birch #6")).toBeNull();
    expect(db.key).toBe("betula-pendula");
    expect(db.selected).toContain("nation");
    expect(db.selected).not.toContain("country");
  });
  it("keeps a query error distinct from an empty relationship", async () => {
    db.error = true;
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("unavailable");
  });
  it("does not hide real records on name alone or infer Friend authority", () => {
    expect(isQaSeedTree({ name: "QA Test Birch #6", what3words: "marbles.flipper.micro" })).toBe(false);
    expect(isQaSeedTree({ name: "Birch", what3words: "test.qa.birch" })).toBe(false);
    expect(isQaSeedTree({ name: "QA Test Oak #1", what3words: "test.qa.oak" })).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

/**
 * The api-gateway reads offerings with the service role, which bypasses RLS.
 * Every route that lists offerings without an authorisation check must
 * therefore filter to public offerings itself.
 */
const gateway = fs.readFileSync(path.resolve("supabase/functions/api-gateway/index.ts"), "utf8");

function routeBody(method: string, routePath: string): string {
  const start = gateway.indexOf(`route("${method}", "${routePath}"`);
  expect(start, `${method} ${routePath} not found`).toBeGreaterThanOrEqual(0);
  const next = gateway.indexOf("\nroute(", start + 1);
  return gateway.slice(start, next === -1 ? undefined : next);
}

describe("api-gateway offering visibility", () => {
  it("serves only public offerings on the unauthenticated per-tree list", () => {
    const body = routeBody("GET", "/api/v1/trees/:id/offerings");
    expect(body).toContain('.eq("visibility", "public")');
    expect(body).not.toContain('"tribe"');
    expect(body).not.toContain('"private"');
  });

  it("keeps the general list public unless the caller asks for their own", () => {
    const body = routeBody("GET", "/api/v1/offerings");
    expect(body).toContain('vis === "mine" && auth.userId');
    expect(body).toContain('query.eq("visibility", "public")');
  });

  it("keeps search restricted to public offerings", () => {
    const body = routeBody("GET", "/api/v1/search");
    expect(body).toContain('.eq("visibility", "public")');
  });
});

// Execute the repository's actual route callback against an RLS-bypassing
// query double: filtering must protect both rows and pagination counts.
async function listOfferings(source: string, queryString = "", userId: string | null = null) {
  const rows = [
    { id: "a", tree_id: "tree", visibility: "public", type: "story" },
    { id: "b", tree_id: "tree", visibility: "tribe", type: "story" },
    { id: "c", tree_id: "tree", visibility: "private", type: "story" },
    { id: "d", tree_id: "tree", visibility: "public", type: "photo" },
    { id: "e", tree_id: "other", visibility: "public", type: "story" },
    { id: "f", tree_id: "tree", visibility: null, type: "story" },
  ];
  let selected = rows;
  let range = [0, 19];
  const query = {
    select: () => query,
    eq: (key: keyof typeof rows[number], value: string) => { selected = selected.filter(row => row[key] === value); return query; },
    in: (key: keyof typeof rows[number], values: string[]) => { selected = selected.filter(row => values.includes(row[key] as string)); return query; },
    order: () => query,
    range: (start: number, end: number) => { range = [start, end]; return query; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: selected.slice(range[0], range[1] + 1), count: selected.length, error: null })),
  };
  let handler: (req: unknown, auth: unknown, params: unknown, url: URL) => Promise<unknown>;
  const start = source.indexOf('route("GET", "/api/v1/trees/:id/offerings"');
  const end = source.indexOf("\nroute(", start + 1);
  const code = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, {
    route: (_method: string, _path: string, callback: typeof handler) => { handler = callback; },
    adminClient: () => ({ from: () => query }),
    parseQuery: (url: URL) => ({ limit: Number(url.searchParams.get("limit") ?? 20), offset: Number(url.searchParams.get("cursor") ?? 0) }),
    json: (value: unknown) => value,
  });
  return handler!(null, { userId }, { id: "tree" }, new URL(`https://test.invalid/${queryString}`));
}

describe("actual public tree offerings callback", () => {
  it.each([null, "signed-in-user"])("excludes non-public rows and counts for %s", async userId => {
    expect(await listOfferings(gateway, "?limit=1", userId)).toEqual({
      data: [{ id: "a", tree_id: "tree", visibility: "public", type: "story" }],
      pagination: { limit: 1, offset: 0, total: 2, next_cursor: 1 },
    });
  });
  it("preserves type filters and later pages", async () => {
    expect(await listOfferings(gateway, "?type=photo")).toMatchObject({ data: [{ id: "d" }], pagination: { total: 1, next_cursor: null } });
    expect(await listOfferings(gateway, "?limit=1&cursor=1")).toMatchObject({ data: [{ id: "d" }], pagination: { total: 2, next_cursor: null } });
  });
  it("reproduces tribe disclosure when the original filter is restored", async () => {
    const previous = gateway.replace('.eq("visibility", "public");', '.in("visibility", ["public", "tribe"]);');
    expect(await listOfferings(previous)).toMatchObject({ data: expect.arrayContaining([expect.objectContaining({ id: "b", visibility: "tribe" })]), pagination: { total: 3 } });
  });
});

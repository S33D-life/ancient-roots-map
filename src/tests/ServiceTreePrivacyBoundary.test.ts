import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const owner = "11111111-1111-4111-8111-111111111111";
const outsider = "22222222-2222-4222-8222-222222222222";
const grantee = "33333333-3333-4333-8333-333333333333";
const curator = "44444444-4444-4444-8444-444444444444";
const publicId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const privateId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const fixtures = [
  { id: publicId, name: "Public", accessibility_tier: "public", created_by: owner },
  { id: privateId, name: "Private", accessibility_tier: "private", created_by: owner },
  { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "Unclassified", accessibility_tier: null, created_by: owner },
];

function runtime(failAccess = false, grantPageCap = 1000) {
  let executions = 0;
  function from(table: string) {
    let rows: Record<string, unknown>[] = table === "trees" ? [...fixtures]
      : table === "user_roles" ? [{ user_id: curator, role: "curator" }]
      : table === "tree_access_grants" ? [{ user_id: grantee, tree_id: publicId }, { user_id: grantee, tree_id: privateId }] : [];
    let start = 0, end = 99, single = false;
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { rows = rows.filter(row => row[key] === value); return query; },
      or: (filter: string) => {
        // Only the trusted boundary expression is evaluated; search terms do
        // not broaden the independently applied access filter.
        if (filter.startsWith("accessibility_tier.eq.public,")) {
          const uid = filter.match(/created_by\.eq\.([0-9a-f-]+)/)![1];
          const ids = filter.match(/id\.in\.\(([^)]+)\)/)?.[1].split(",") ?? [];
          rows = rows.filter(row => row.accessibility_tier === "public" || row.created_by === uid || ids.includes(String(row.id)));
        }
        return query;
      },
      order: () => query,
      range: (a: number, b: number) => { start = a; end = b; return query; },
      limit: (n: number) => { end = n - 1; return query; },
      maybeSingle: () => { single = true; return query; },
      single: () => { single = true; return query; },
      then: (resolve: (value: unknown) => unknown) => {
        executions++;
        const pageEnd = table === "tree_access_grants" ? Math.min(end + 1, start + grantPageCap) : end + 1;
        return Promise.resolve(resolve({ data: single ? rows[0] ?? null : rows.slice(start, pageEnd), count: rows.length,
          error: failAccess && table !== "trees" ? { message: "unavailable" } : null }));
      },
    };
    return query;
  }
  const source = fs.readFileSync("supabase/functions/api-gateway/index.ts", "utf8").replace(/^import[\s\S]*?;\n/gm, "");
  const code = ts.transpileModule(source + "\n globalThis.testRoute = matchRoute;", { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const context: Record<string, unknown> = { createClient: () => ({ from }), serve: () => {}, Deno: { env: { get: () => "test" } }, Response, URL, console };
  // Unrelated agent-garden handlers are registered but never invoked here.
  for (const name of ["registerAgent", "getAgent", "updateCapabilities", "submitSource", "submitDataset", "submitResearchTreesBulk", "submitSpeciesClassification", "submitGeocode", "submitEnrichment", "submitDuplicateCheck", "submitCandidate", "submitSpark", "getTasks", "getContributions", "getRewards"]) context[name] = () => {};
  runInNewContext(code, context);
  return {
    async call(routePath: string, userId: string | null, query = "") {
      const match = (context.testRoute as (m: string, p: string) => { handler: (r: null, a: unknown, p: unknown, u: URL) => Promise<Response>; params: unknown })("GET", routePath);
      const response = await match.handler(null, { userId, roles: ["agent"], scopes: ["read:public"] }, match.params, new URL("https://test.invalid" + routePath + query));
      return { status: response.status, cache: response.headers.get("cache-control"), body: await response.json(), executions };
    },
  };
}

describe("actual service-role tree route boundary", () => {
  it.each([null, outsider])("denies private detail to %s", async userId => {
    expect(await runtime().call(`/api/v1/trees/${privateId}`, userId)).toMatchObject({ status: 404 });
  });
  it.each([owner, grantee, curator])("preserves private detail for authorised %s", async userId => {
    expect(await runtime().call(`/api/v1/trees/${privateId}`, userId)).toMatchObject({ status: 200, cache: "private, no-store", body: { data: { id: privateId } } });
  });
  it("filters before pagination/count and does not execute the builder early", async () => {
    expect(await runtime().call("/api/v1/trees", null, "?limit=1")).toMatchObject({ executions: 1, body: { data: [{ id: publicId }], pagination: { total: 1, next_cursor: null } } });
    expect(await runtime().call("/api/v1/trees", grantee, "?limit=1")).toMatchObject({ executions: 4, body: { pagination: { total: 2, next_cursor: 1 } } });
  });
  it("keeps null/non-public tiers out of anonymous search", async () => {
    expect(await runtime().call("/api/v1/search", null, "?q=Tree&types=trees")).toMatchObject({ cache: "private, no-store", body: { data: [{ id: publicId }] } });
  });
  it("fails closed if authority lookup fails", async () => {
    await expect(runtime(true).call(`/api/v1/trees/${privateId}`, owner)).rejects.toThrow("Tree access check failed");
  });
  it("preserves grants beyond the server's response cap", async () => {
    expect(await runtime(false, 1).call(`/api/v1/trees/${privateId}`, grantee)).toMatchObject({ status: 200, body: { data: { id: privateId } } });
  });
});

describe("actual OG metadata fetchers", () => {
  it.each(["fetchTreeMeta", "fetchOfferingMeta"])("%s omits metadata for private parents", async fn => {
    const queries: { eq: [string, unknown][] }[] = [];
    const createClient = () => ({ from(table: string) {
      const trace = { eq: [] as [string, unknown][] }; queries.push(trace);
      const q = { select: () => q, eq: (key: string, val: unknown) => { trace.eq.push([key, val]); return q; }, order: () => q, limit: () => q,
        maybeSingle: () => q,
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ data: table === "trees" && !trace.eq.some(([k,v]) => k === "accessibility_tier" && v === "public") ? fixtures[1] : null })) };
      return q;
    } });
    const source = fs.readFileSync("supabase/functions/og-proxy/index.ts", "utf8").replace(/^import[\s\S]*?;\n/gm, "");
    const context: Record<string, unknown> = { createClient, Deno: { env: { get: () => "https://test.invalid" }, serve: () => {} }, console };
    runInNewContext(ts.transpileModule(source + `\n globalThis.fetchMeta = ${fn};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
    const result = await (context.fetchMeta as (tree: string, offering: string) => Promise<Record<string, unknown> | null>)(privateId, publicId);
    expect(queries.some(q => q.eq.some(([k,v]) => k === "accessibility_tier" && v === "public"))).toBe(true);
    expect(result?.geoLat).toBeUndefined();
    if (fn === "fetchOfferingMeta") expect(result).toBeNull();
    else expect(result?.title).not.toContain("Private");
  });
  it.each(["fetchTreeMeta", "fetchOfferingMeta", "fetchTreeData"])("%s preserves public data and suppresses private images", async fn => {
    let currentTree = publicId;
    const createClient = () => ({ from(table: string) {
      const filters: [string, unknown][] = [];
      const q = { select: () => q, eq: (key: string, value: unknown) => { filters.push([key, value]); return q; },
        not: () => q, order: () => q, limit: () => q, maybeSingle: () => q,
        then: (resolve: (v: unknown) => unknown) => {
          const row = table === "trees" ? fixtures.find(t => t.id === currentTree && filters.every(([k,v]) => (t as Record<string, unknown>)[k] === v))
            : table === "offerings" ? { id: publicId, tree_id: currentTree, visibility: "public", type: "photo", title: "Public photo", media_url: "https://test.invalid/photo.jpg", photos: [] } : null;
          return Promise.resolve(resolve({ data: row ?? null }));
        } };
      return q;
    } });
    const file = fn === "fetchTreeData" ? "og-card" : "og-proxy";
    const source = fs.readFileSync(`supabase/functions/${file}/index.ts`, "utf8").replace(/^import[\s\S]*?;\n/gm, "");
    const context: Record<string, unknown> = { createClient, Deno: { env: { get: () => "https://test.invalid" }, serve: () => {} }, console };
    runInNewContext(ts.transpileModule(source + `\n globalThis.fetchMeta = ${fn};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
    const fetch = context.fetchMeta as (tree: string, offering: string) => Promise<Record<string, unknown> | null>;
    const visible = await fetch(publicId, publicId);
    expect(fn === "fetchTreeData" ? visible?.name : visible?.title).toContain("Public");
    currentTree = privateId;
    const hidden = await fetch(privateId, publicId);
    if (fn === "fetchTreeData") expect(hidden).toMatchObject({ name: "Ancient Friend", photoUrl: null, isMinted: false });
    else if (fn === "fetchOfferingMeta") expect(hidden).toBeNull();
    else expect(hidden?.title).not.toContain("Private");
  });
});

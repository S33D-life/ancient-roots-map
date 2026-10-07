import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { generateKeyPairSync, sign } from "node:crypto";
import { ToolContext } from "@lovable.dev/mcp-js";
import { createMcpProtocolHandler } from "@lovable.dev/mcp-js/protocols/mcp";
import mcp from "../lib/mcp";
import { createLivingDreamTools, projectCircle, summarizeGrowth } from "../lib/mcp/tools/living-dream";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";
import { CROWN_GROWTHS } from "../data/crown/growths";
import toolSchemas from "../../docs/mcp/living-dream-tool-schemas.json";
import { execFileSync } from "node:child_process";

const db = vi.hoisted(() => ({ userClient: vi.fn() }));
vi.mock("../lib/mcp/supabase", () => ({ supabaseForUser: db.userClient }));

const ctx = new ToolContext({ type: "oauth", principal: {
  claims: { sub: "test-user" }, issuer: "https://test.invalid", resource: "https://s33d.life/mcp",
  acceptedAudiences: ["authenticated"], scopes: [], sub: "test-user",
}, bearer: { token: "test-only-verified-context" } });
const [circleTool, listTool, detailTool] = createLivingDreamTools();
afterEach(() => vi.restoreAllMocks());

describe("Living Dream read-only MCP", () => {
  it("pins the manifest, npm lock and installed generator to the reviewed SDK", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const installed = JSON.parse(readFileSync("node_modules/@lovable.dev/mcp-js/package.json", "utf8"));
    expect(manifest.dependencies["@lovable.dev/mcp-js"]).toBe("0.26.3");
    expect(lock.packages[""].dependencies["@lovable.dev/mcp-js"]).toBe("0.26.3");
    expect(lock.packages["node_modules/@lovable.dev/mcp-js"].version).toBe("0.26.3");
    expect(installed.version).toBe("0.26.3");
  });
  it("registers exactly the four original and three supported tools; priorities remain held", () => {
    expect(mcp.tools.map(t => t.name)).toEqual(["search_trees", "get_tree", "list_my_trees", "whoami", "get_current_circle", "list_growth_items", "get_growth_item"]);
    expect(mcp.auth).toBeDefined();
    for (const tool of mcp.tools) expect(tool.annotations?.readOnlyHint).toBe(true);
  });
  it("discovers JSON schemas through the actual MCP protocol adapter", async () => {
    // Only discovery uses a test-only auth-free definition. Production auth is checked below.
    const handler = createMcpProtocolHandler({ ...mcp, auth: undefined });
    const response = await handler(new Request("https://s33d.life/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    expect(response.status).toBe(200);
    const wire = await response.text();
    const body = JSON.parse(wire.startsWith("event:") ? wire.split("\n").find(line => line.startsWith("data: "))!.slice(6) : wire);
    const added = body.result.tools.slice(4);
    expect(added).toEqual(toolSchemas);
    expect(added.map((t: { name: string }) => t.name)).toEqual(["get_current_circle", "list_growth_items", "get_growth_item"]);
    expect(added[0].inputSchema.properties).toEqual({});
    expect(added[1].inputSchema.properties).toEqual({});
    expect(added[2].inputSchema.required).toEqual(["growth_id"]);
    expect(added[2].inputSchema.properties.growth_id).toMatchObject({ type: "string", minLength: 1, maxLength: 128 });
  });
  it("regenerates the committed Edge runtime exactly and deterministically with the retained SDK", () => {
    // Separate ignored output keeps this check from silently repairing the committed artifact.
    // esbuild must run in Node, outside the repository's jsdom test environment.
    const first = execFileSync(process.execPath, ["--input-type=module", "-e", `
      import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
      import { resolve } from "node:path";
      import { readFileSync } from "node:fs";
      const plugin = mcpPlugin({ functionsDir: ".vite/mcp-runtime-contract" });
      const config = {
        root: process.cwd(), envDir: process.cwd(), envPrefix: "VITE_", base: "/",
        resolve: { alias: [{ find: "@", replacement: resolve("src") }] },
      };
      await plugin.configResolved(config);
      const first = readFileSync(".vite/mcp-runtime-contract/mcp/index.ts", "utf8");
      await plugin.configResolved(config);
      if (readFileSync(".vite/mcp-runtime-contract/mcp/index.ts", "utf8") !== first) {
        throw new Error("MCP regeneration is not deterministic");
      }
      process.stdout.write(first);
    `], { encoding: "utf8" });
    expect(first).toBe(readFileSync("supabase/functions/mcp/index.ts", "utf8"));
    expect(first).not.toContain("npm:@/lib/routes");
    const sdkImports = first.match(/npm:@lovable\.dev\/mcp-js@[^"\s]+/g) ?? [];
    expect(sdkImports.length).toBe(7);
    expect(sdkImports.every(ref => ref.startsWith("npm:@lovable.dev/mcp-js@0.26.3"))).toBe(true);
  });
  it.each([undefined, "Bearer invalid-token"])("rejects unverified protocol auth %s", async authorization => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ keys: [] }));
    const handler = createMcpProtocolHandler({ ...mcp, auth: { ...mcp.auth!, jwksUri: "https://test.invalid/jwks" } });
    const response = await handler(new Request("https://s33d.life/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(authorization ? { Authorization: authorization } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_current_circle", arguments: {} } }),
    }));
    expect(response.status).toBe(401);
  });
  it.each(["GET", "PUT", "DELETE"])("authenticates unsupported %s requests before method rejection", async method => {
    const response = await createMcpProtocolHandler(mcp)(new Request("https://s33d.life/mcp", { method }));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("serves discovery and all three tools after actual JWT verification", async () => {
    const issuer = "https://test.invalid/auth";
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const key = { ...publicKey.export({ format: "jwk" }), kid: "test-key", alg: "ES256", use: "sig" };
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ keys: [key] }));
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "ES256", kid: "test-key", typ: "JWT" })}.${encode({ iss: issuer, aud: "authenticated", sub: "test-user", client_id: "test-client", exp: Math.floor(Date.now() / 1000) + 300 })}`;
    const token = `${unsigned}.${sign("sha256", Buffer.from(unsigned), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
    const handler = createMcpProtocolHandler({ ...mcp, auth: { ...mcp.auth!, issuer, jwksUri: "https://test.invalid/jwks" } });
    const unsupported = await handler(new Request("https://s33d.life/mcp", {
      method: "GET", headers: { Authorization: `Bearer ${token}` },
    }));
    expect(unsupported.status).toBe(405);
    expect(unsupported.headers.get("cache-control")).toBe("no-store");
    const discovery = await handler(new Request("https://s33d.life/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 4, method: "tools/list", params: {} }),
    }));
    expect(discovery.status).toBe(200);
    expect(await discovery.text()).toContain('"name":"get_current_circle"');
    for (const name of ["get_current_circle", "list_growth_items", "get_growth_item"]) {
      const response = await handler(new Request("https://s33d.life/mcp", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name, arguments: name === "get_growth_item" ? { growth_id: CROWN_GROWTHS[0].id } : {} } }),
      }));
      expect(response.status).toBe(200);
      const wire = await response.text();
      const body = JSON.parse(wire.startsWith("event:") ? wire.split("\n").find(line => line.startsWith("data: "))!.slice(6) : wire);
      expect(body.error).toBeUndefined(); expect(body.result.isError).not.toBe(true);
      expect(body.result.structuredContent).toHaveProperty(name === "get_current_circle" ? "circle" : name === "list_growth_items" ? "growths" : "growth");
    }
    for (const claims of [
      { iss: issuer, aud: "anon", exp: Math.floor(Date.now() / 1000) + 300 },
      { iss: "https://other.invalid", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 300 },
      { iss: issuer, aud: "authenticated", exp: 1 },
    ]) {
      const input = `${encode({ alg: "ES256", kid: "test-key", typ: "JWT" })}.${encode({ ...claims, sub: "test-user", client_id: "test-client" })}`;
      const rejected = `${input}.${sign("sha256", Buffer.from(input), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
      const response = await handler(new Request("https://s33d.life/mcp", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${rejected}` },
        body: JSON.stringify({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_current_circle", arguments: {} } }),
      }));
      expect(response.status).toBe(401);
    }
    expect(fetch.mock.calls.every(([url]) => String(url) === "https://test.invalid/jwks")).toBe(true);
  });
  it("requires verified auth for every new tool before accessing any source", async () => {
    const circle = vi.fn(() => CURRENT_CIRCLE);
    const growths = vi.fn(() => CROWN_GROWTHS);
    const [a, b, c] = createLivingDreamTools({ circle, growths });
    const anonymous = new ToolContext(undefined);
    expect((await a.handler({}, anonymous)).isError).toBe(true);
    expect((await b.handler({}, anonymous)).isError).toBe(true);
    expect((await c.handler({ growth_id: CROWN_GROWTHS[0].id }, anonymous)).isError).toBe(true);
    expect(circle).not.toHaveBeenCalled(); expect(growths).not.toHaveBeenCalled();
  });
  it("preserves every approved Circle 235 field", async () => {
    const response = await circleTool.handler({}, ctx);
    expect(response.structuredContent?.circle).toEqual(CURRENT_CIRCLE);
    expect(response.structuredContent?.provenance).toMatchObject({ source: "supabase/functions/_shared/currentCircle.ts" });
  });
  it("fails closed for missing and draft Circles", async () => {
    for (const circle of [undefined, { ...CURRENT_CIRCLE, approval: "draft" as const }]) {
      const [tool] = createLivingDreamTools({ circle: () => circle, growths: () => [] });
      const response = await tool.handler({}, ctx);
      expect(response.isError).toBe(true); expect(response.structuredContent).toBeUndefined();
    }
  });
  it("omits unapproved or unsafe links and unknown private fields", () => {
    const circle = { ...CURRENT_CIRCLE, privateNotes: "do not expose", links: {
      ...CURRENT_CIRCLE.links, group: { url: "https://t.me/private", approved: false },
      fire: { url: "https://evil.invalid", approved: true },
    } };
    const projected = projectCircle(circle);
    expect(projected?.links.group).toBeUndefined(); expect(projected?.links.fire).toBeUndefined();
    expect(JSON.stringify(projected)).not.toContain("do not expose");
  });
  it("lists compact growth summaries from the existing model", async () => {
    const response = await listTool.handler({}, ctx);
    expect(response.structuredContent?.growths).toEqual(CROWN_GROWTHS.map(summarizeGrowth));
    expect(JSON.stringify(response)).not.toContain("test-only-verified-context");
  });
  it("returns all required detail references and decisions", async () => {
    const growth = CROWN_GROWTHS[0];
    const response = await detailTool.handler({ growth_id: growth.id }, ctx);
    expect(response.structuredContent?.growth).toMatchObject({
      id: growth.id, origin: growth.origin, maturity: growth.maturity, realms: growth.realms,
      sourceOfTruth: growth.sourceOfTruth, seams: growth.seams, heartwood: growth.heartwood,
      handoffs: growth.handoffs, nextDecisions: growth.nextDecisions,
    });
  });
  it("keeps public maturity independent of merged, blocked and verified engineering states", () => {
    for (const state of ["merged", "blocked", "verified"] as const) {
      const growth = { ...CROWN_GROWTHS[0], seams: [{ ...CROWN_GROWTHS[0].seams[0], state }] };
      expect(summarizeGrowth(growth).maturity).toBe("growing");
      expect(summarizeGrowth(growth).implementationSummary[0].state).toBe(state);
    }
  });
  it("returns an error without payload for unknown growth ids", async () => {
    const response = await detailTool.handler({ growth_id: "unknown" }, ctx);
    expect(response.isError).toBe(true); expect(response.structuredContent).toBeUndefined();
  });
  it("accepts an empty growth list and reports missing detail", async () => {
    const [, list, detail] = createLivingDreamTools({ circle: () => CURRENT_CIRCLE, growths: () => [] });
    expect((await list.handler({}, ctx)).structuredContent?.growths).toEqual([]);
    expect((await detail.handler({ growth_id: "unknown" }, ctx)).isError).toBe(true);
  });
  it("hides source failure details for all tools", async () => {
    const fail = () => { throw new Error("private secret failure"); };
    const [circle, list, detail] = createLivingDreamTools({ circle: fail, growths: fail });
    for (const response of [await circle.handler({}, ctx), await list.handler({}, ctx), await detail.handler({ growth_id: "id" }, ctx)]) {
      expect(response.isError).toBe(true); expect(JSON.stringify(response)).not.toContain("private secret");
    }
  });
  it("validates id schema", () => {
    const schema = z.object(detailTool.inputSchema);
    expect(schema.parse({ growth_id: "  one-circle-many-surfaces  " }).growth_id).toBe("one-circle-many-surfaces");
    for (const input of [{}, { growth_id: " " }, { growth_id: "x".repeat(129) }, { growth_id: 1 }]) expect(schema.safeParse(input).success).toBe(false);
  });
  it("has no database, network or mutation dependency and leaves sources unchanged", async () => {
    const before = JSON.stringify([CURRENT_CIRCLE, CROWN_GROWTHS]);
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network prohibited"));
    await circleTool.handler({}, ctx); await listTool.handler({}, ctx); await detailTool.handler({ growth_id: CROWN_GROWTHS[0].id }, ctx);
    expect(fetch).not.toHaveBeenCalled(); expect(JSON.stringify([CURRENT_CIRCLE, CROWN_GROWTHS])).toBe(before);
    const source = readFileSync("src/lib/mcp/tools/living-dream.ts", "utf8");
    expect(source).not.toMatch(/supabaseForUser|createClient|fetch\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
  });
});

describe("existing MCP tool regression", () => {
  it.each(mcp.tools.slice(0, 4).map(tool => [tool.name, tool] as const))("%s still rejects unauthenticated calls", async (_name, tool) => {
    db.userClient.mockClear();
    const response = await tool.handler({}, new ToolContext(undefined));
    expect(response.isError).toBe(true); expect(db.userClient).not.toHaveBeenCalled();
  });
  it.each(["search_trees", "get_tree", "list_my_trees", "whoami"])("%s still returns its original read payload", async name => {
    const tree = { id: "tree-id", name: "Ancient friend" };
    const profile = { id: "test-user", full_name: "Keeper" };
    const offerings = [{ id: "offering-id", title: "Story" }];
    const query = () => {
      const chain = { select: vi.fn(), or: vi.fn(), limit: vi.fn(), eq: vi.fn(), order: vi.fn(), maybeSingle: vi.fn() };
      chain.select.mockReturnValue(chain); chain.or.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.order.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: name === "get_tree" ? offerings : [tree], error: null });
      chain.maybeSingle.mockResolvedValue({ data: name === "whoami" ? profile : tree, error: null });
      return chain;
    };
    const chain = query();
    const from = vi.fn(() => chain);
    db.userClient.mockReturnValue({ from });
    const tool = mcp.tools.find(tool => tool.name === name)!;
    const response = await tool.handler({ query: "Oak", tree_id: "tree-id", limit: 3, offering_limit: 2 }, ctx);
    expect(response.isError).not.toBe(true);
    expect(response.structuredContent).toEqual(name === "get_tree" ? { tree, offerings } : name === "whoami" ? { profile } : { trees: [tree] });
    expect(db.userClient).toHaveBeenCalledWith(ctx);
    if (name === "whoami") expect(chain.eq).toHaveBeenCalledWith("id", "test-user");
    if (name === "list_my_trees") expect(chain.eq).toHaveBeenCalledWith("created_by", "test-user");
    if (name === "get_tree") { expect(chain.eq).toHaveBeenCalledWith("id", "tree-id"); expect(from).toHaveBeenCalledWith("offerings"); }
  });
});

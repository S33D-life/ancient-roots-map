import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

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

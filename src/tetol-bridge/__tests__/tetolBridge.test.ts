/**
 * TETOL bridge — locks in the read-only contract and the route ↔ spatial table.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { HEARTWOOD_ROOMS } from "@/config/heartwoodRooms";
import {
  SPATIAL_REGISTRY,
  routeToSpatial,
  spatialToRoute,
  validateRegistry,
} from "../spatialRegistry";
import { parseStaffCode, resolveStaff } from "../staffIdentity";
import { createS33DDataAdapter } from "../s33dDataAdapter";
import { TETOL_READONLY_AUTH_OPTIONS, type S33DReadClient } from "../readOnlyClient";

/* ── A recording stand-in for the Supabase query builder ──────── */

type Call = { table: string; method: string; args: unknown[] };
const WRITE_METHODS = ["insert", "update", "upsert", "delete", "rpc"];

function fakeClient(responses: Record<string, unknown[]>) {
  const calls: Call[] = [];
  const cursor: Record<string, number> = {};
  const client = {
    from(table: string) {
      const next = () => {
        const i = cursor[table] ?? 0;
        cursor[table] = i + 1;
        return { data: responses[table]?.[i] ?? null, error: null };
      };
      const builder: Record<string, unknown> = {};
      const chain = (method: string) => (...args: unknown[]) => {
        calls.push({ table, method, args });
        return method === "maybeSingle" || method === "single" ? Promise.resolve(next()) : builder;
      };
      for (const m of ["select", "eq", "in", "is", "ilike", "order", "limit", "maybeSingle", "single", ...WRITE_METHODS]) {
        builder[m] = chain(m);
      }
      builder.then = (resolveFn: (v: unknown) => unknown) => Promise.resolve(next()).then(resolveFn);
      return builder;
    },
    rpc(...args: unknown[]) {
      calls.push({ table: "(rpc)", method: "rpc", args });
      return Promise.resolve({ data: null, error: null });
    },
  };
  return { client: client as unknown as S33DReadClient, calls };
}

const TREE_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test Yew",
  species: "Taxus baccata",
  species_key: "taxus-baccata",
  latitude: 51.44,
  longitude: -0.56,
  nation: "England",
  state: null,
  bioregion: null,
  estimated_age: 1400,
  age_min: null,
  age_max: null,
  age_confidence: null,
  girth_cm: 960,
  description: null,
  lore_text: null,
  what3words: "a.b.c",
  photo_thumb_url: null,
  photo_processed_url: null,
  source_name: null,
  source_url: null,
  location_confidence: null,
  merged_into_tree_id: null,
  updated_at: "2026-09-01T00:00:00Z",
};

/* ── Spatial registry ─────────────────────────────────────────── */

describe("spatial registry", () => {
  it("is internally consistent", () => {
    expect(validateRegistry()).toEqual([]);
  });

  it.each([
    ["/tree/abc-123", "heartwood/root-descent/cavern/friend/abc-123"],
    ["/staff/YEW-C1S1", "staff-room/staff/YEW-C1S1"],
    ["/library/greenhouse", "heartwood/greenhouse"],
    ["/council/records/2026-04-new", "heartwood/growth-rings/2026-04-new"],
    ["/library/staff-room", "staff-room"],
  ])("maps %s ↔ %s in both directions", (route, address) => {
    expect(routeToSpatial(route)?.address).toBe(address);
    expect(spatialToRoute(address)?.route).toBe(route);
  });

  it("derives every Heartwood room from the room registry", () => {
    for (const room of HEARTWOOD_ROOMS) {
      const hit = routeToSpatial(room.route);
      expect(hit, room.key).not.toBeNull();
      expect(hit!.mapping.access).toBe(room.access);
    }
  });

  it("ignores query strings and round-trips encoded ids", () => {
    expect(routeToSpatial("/tree/a%20b?whisper=1")?.params.id).toBe("a b");
    expect(spatialToRoute("staff-room/staff/a%2Fb")?.route).toBe("/staff/a%2Fb");
  });

  it("returns null for places TETOL has no home for yet", () => {
    expect(routeToSpatial("/vault")).toBeNull();
    expect(spatialToRoute("nowhere/at/all")).toBeNull();
  });

  it("only maps routes that exist in App.tsx", () => {
    const app = readFileSync(resolve("src/App.tsx"), "utf8");
    const appPaths = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
    const toRegex = (p: string) => new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}$`);
    for (const mapping of SPATIAL_REGISTRY) {
      const sample = mapping.route.replace(/:[^/]+/g, "sample");
      expect(appPaths.some((p) => toRegex(p).test(sample)), mapping.route).toBe(true);
    }
  });
});

/* ── Staff identity ───────────────────────────────────────────── */

describe("staff identity", () => {
  it.each([
    ["YEW", "YEW"],
    ["yew-c1s1", "YEW-C1S1"],
    ["YEW-C1S01", "YEW-C1S1"],
    ["YEW-C0S13", "YEW"],
    ["Oak-C1S3", "OAK-C1S3"],
    ["Holy-C1S3", "HOL-C1S3"],
    ["CHERRY", "CHER"],
    ["CHER", "CHER"],
  ])("resolves %s → %s", (input, routeCode) => {
    expect(resolveStaff(input)?.routeCode).toBe(routeCode);
  });

  it("does not invent staffs the app registry lacks (Notion-evidenced Yew circle 4)", () => {
    expect(parseStaffCode("YEW-C4S1")).not.toBeNull();
    expect(resolveStaff("YEW-C4S1")).toBeNull();
  });

  it("reports the contract's global circle id without accepting it as input", () => {
    expect(resolveStaff("YEW-C1S1")?.contractCircleId).toBe(4);
    expect(resolveStaff("OAK-C1S1")?.contractCircleId).toBe(1);
  });

  it("rejects malformed codes", () => {
    for (const bad of ["", "YEW-C1S13", "YEW-C0S1", "NOPE", "YEW C1 S1"]) {
      expect(resolveStaff(bad)).toBeNull();
    }
  });
});

/* ── Data adapter ─────────────────────────────────────────────── */

describe("S33D data adapter", () => {
  it("reads an Ancient Friend with an explicit, public-safe projection", async () => {
    const { client, calls } = fakeClient({ trees: [TREE_ROW] });
    const friend = await createS33DDataAdapter(client).getAncientFriend(TREE_ROW.id);

    expect(friend?.canonicalRoute).toBe(`/tree/${TREE_ROW.id}`);
    expect(friend?.spatialAddress).toBe(`heartwood/root-descent/cavern/friend/${TREE_ROW.id}`);
    expect(friend?.provenance[0]).toMatchObject({ source: "supabase", location: "public.trees" });

    const columns = String(calls.find((c) => c.method === "select")?.args[0]);
    expect(columns).not.toContain("*");
    for (const privateish of ["created_by", "access_notes", "metadata", "photo_original_url"]) {
      expect(columns).not.toContain(privateish);
    }
  });

  it("follows merged trees to the surviving record", async () => {
    const survivor = { ...TREE_ROW, id: "22222222-2222-2222-2222-222222222222" };
    const { client } = fakeClient({ trees: [{ ...TREE_ROW, merged_into_tree_id: survivor.id }, survivor] });
    const friend = await createS33DDataAdapter(client).getAncientFriend(TREE_ROW.id);
    expect(friend?.id).toBe(survivor.id);
    expect(friend?.mergedFrom).toBe(TREE_ROW.id);
  });

  it("resolves a real Staff from the canonical app config without reading owner fields", async () => {
    const { client, calls } = fakeClient({ staffs: [[]] });
    const staff = await createS33DDataAdapter(client).getStaff("YEW");

    expect(staff).toMatchObject({
      routeCode: "YEW",
      speciesName: "Ancient Yew",
      isOriginSpiral: true,
      canonicalRoute: "/staff/YEW",
      spatialAddress: "staff-room/staff/YEW",
      registryRow: null,
    });
    const columns = String(calls.find((c) => c.method === "select")?.args[0]);
    expect(columns).not.toMatch(/owner/);
  });

  it("never calls a write method", async () => {
    const { client, calls } = fakeClient({ trees: [TREE_ROW, [TREE_ROW]], staffs: [[]] });
    const adapter = createS33DDataAdapter(client);
    await adapter.getAncientFriend(TREE_ROW.id);
    await adapter.listAncientFriends({ limit: 10_000, nation: "England" });
    await adapter.getStaff("OAK-C1S3");
    expect(calls.filter((c) => WRITE_METHODS.includes(c.method))).toEqual([]);
    expect(calls.find((c) => c.method === "limit" && c.table === "trees" && c.args[0] === 200)).toBeTruthy();
  });

  it("flags hard-coded Council records as stale once the newest one has passed", () => {
    const { client } = fakeClient({});
    const adapter = createS33DDataAdapter(client, { now: () => new Date("2026-09-25T12:00:00Z") });
    const current = adapter.getCurrentCouncil();
    expect(current.stale).toBe(true);
    expect(current.spatialAddress).toBe(`heartwood/growth-rings/${current.id}`);
    expect(adapter.getCouncilRecord("does-not-exist")).toBeNull();
  });

  it("exposes Heartwood rooms with their access level", () => {
    const { client } = fakeClient({});
    const adapter = createS33DDataAdapter(client);
    expect(adapter.getHeartwoodRoom("greenhouse")).toMatchObject({ spatialAddress: "heartwood/greenhouse" });
    expect(adapter.getHeartwoodRoom("staff-room")).toMatchObject({ spatialAddress: "staff-room", access: "member" });
  });

  it("has no Wanderer in the read-only phase", async () => {
    const { client } = fakeClient({});
    expect(await createS33DDataAdapter(client).getWanderer()).toBeNull();
  });
});

describe("read-only client", () => {
  it("never persists, refreshes or harvests a session from the URL", () => {
    expect(TETOL_READONLY_AUTH_OPTIONS).toEqual({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "s33d-tetol-readonly",
    });
  });
});

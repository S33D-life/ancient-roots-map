/**
 * Spatial registry — the bridge between S33D web routes and TETOL spatial addresses.
 *
 * One table, read in both directions:
 *   routeToSpatial("/tree/abc")                        → "heartwood/root-descent/cavern/friend/abc"
 *   spatialToRoute("heartwood/root-descent/cavern/friend/abc") → "/tree/abc"
 *
 * Heartwood rooms are DERIVED from src/config/heartwoodRooms.ts rather than
 * copied, so a new room appears here with its access level automatically.
 *
 * Status: PROPOSED. The spatial addresses below come from the 25 Sep 2026
 * audit brief; they must be reconciled with the prototype's tetol-routes.js,
 * which was not available to the audit.
 */
import { HEARTWOOD_ROOMS, type AccessLevel } from "@/config/heartwoodRooms";

export type SpatialEntity =
  | "ancient_friend"
  | "staff"
  | "council_record"
  | "heartwood_room"
  | "place";

export interface SpatialMapping {
  id: string;
  entity: SpatialEntity;
  /** React Router style pattern, e.g. "/tree/:id". */
  route: string;
  /** Slash-separated spatial address pattern, e.g. "staff-room/staff/:code". */
  spatial: string;
  /** Minimum access, using the Heartwood access vocabulary. */
  access: AccessLevel;
  origin: "explicit" | "heartwood-registry";
}

const EXPLICIT: SpatialMapping[] = [
  { id: "ancient-friend", entity: "ancient_friend", route: "/tree/:id", spatial: "heartwood/root-descent/cavern/friend/:id", access: "visitor", origin: "explicit" },
  { id: "staff", entity: "staff", route: "/staff/:code", spatial: "staff-room/staff/:code", access: "visitor", origin: "explicit" },
  { id: "council-record", entity: "council_record", route: "/council/records/:id", spatial: "heartwood/growth-rings/:id", access: "visitor", origin: "explicit" },
  { id: "council", entity: "place", route: "/council-of-life", spatial: "council-treehouse", access: "visitor", origin: "explicit" },
  { id: "golden-dream", entity: "place", route: "/golden-dream", spatial: "crown", access: "visitor", origin: "explicit" },
  { id: "heartwood", entity: "place", route: "/library", spatial: "heartwood", access: "visitor", origin: "explicit" },
  // The Staff Room is a Heartwood room on the web but its own place in TETOL.
  { id: "staff-room", entity: "heartwood_room", route: "/library/staff-room", spatial: "staff-room", access: "member", origin: "explicit" },
];

const explicitRoutes = new Set(EXPLICIT.map((m) => m.route));

const DERIVED: SpatialMapping[] = HEARTWOOD_ROOMS
  .filter((room) => !explicitRoutes.has(room.route))
  .map((room) => ({
    id: `heartwood-room:${room.key}`,
    entity: "heartwood_room" as const,
    route: room.route,
    spatial: `heartwood/${room.key}`,
    access: room.access,
    origin: "heartwood-registry" as const,
  }));

export const SPATIAL_REGISTRY: readonly SpatialMapping[] = Object.freeze([...EXPLICIT, ...DERIVED]);

/* ── Pattern matching ─────────────────────────────────────────── */

function splitPath(value: string): string[] {
  return value.split("/").filter(Boolean);
}

function paramNames(pattern: string): string[] {
  return splitPath(pattern).filter((s) => s.startsWith(":")).map((s) => s.slice(1));
}

function match(pattern: string, value: string): Record<string, string> | null {
  const p = splitPath(pattern);
  const v = splitPath(value);
  if (p.length !== v.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) {
      let decoded: string;
      try {
        decoded = decodeURIComponent(v[i]);
      } catch {
        return null;
      }
      params[p[i].slice(1)] = decoded;
    } else if (p[i] !== v[i]) {
      return null;
    }
  }
  return params;
}

function fill(pattern: string, params: Record<string, string>): string {
  return splitPath(pattern)
    .map((s) => (s.startsWith(":") ? encodeURIComponent(params[s.slice(1)]) : s))
    .join("/");
}

/** Static segments win over params, so "/library/staff-room" beats "/library/:room". */
function specificity(pattern: string): number {
  return splitPath(pattern).filter((s) => !s.startsWith(":")).length;
}

function resolve(
  value: string,
  from: "route" | "spatial",
): { mapping: SpatialMapping; params: Record<string, string> } | null {
  const clean = value.split(/[?#]/)[0];
  const hits = SPATIAL_REGISTRY
    .map((mapping) => ({ mapping, params: match(mapping[from], clean) }))
    .filter((h): h is { mapping: SpatialMapping; params: Record<string, string> } => h.params !== null)
    .sort((a, b) => specificity(b.mapping[from]) - specificity(a.mapping[from]));
  return hits[0] ?? null;
}

export interface SpatialResolution {
  mapping: SpatialMapping;
  params: Record<string, string>;
  address: string;
}

export interface RouteResolution {
  mapping: SpatialMapping;
  params: Record<string, string>;
  route: string;
}

export function routeToSpatial(pathname: string): SpatialResolution | null {
  const hit = resolve(pathname, "route");
  return hit ? { ...hit, address: fill(hit.mapping.spatial, hit.params) } : null;
}

export function spatialToRoute(address: string): RouteResolution | null {
  const hit = resolve(address, "spatial");
  return hit ? { ...hit, route: `/${fill(hit.mapping.route, hit.params)}` } : null;
}

/** Registry self-check; returns human-readable problems (empty = healthy). */
export function validateRegistry(registry: readonly SpatialMapping[] = SPATIAL_REGISTRY): string[] {
  const problems: string[] = [];
  const seen = { route: new Set<string>(), spatial: new Set<string>(), id: new Set<string>() };
  for (const m of registry) {
    for (const key of ["route", "spatial", "id"] as const) {
      if (seen[key].has(m[key])) problems.push(`duplicate ${key}: ${m[key]}`);
      seen[key].add(m[key]);
    }
    const a = paramNames(m.route).sort().join(",");
    const b = paramNames(m.spatial).sort().join(",");
    if (a !== b) problems.push(`${m.id}: route params [${a}] ≠ spatial params [${b}]`);
  }
  return problems;
}

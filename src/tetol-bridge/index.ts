/**
 * S33D ↔ TETOL bridge — public entry.
 *
 * Not imported by the main app. Built separately (scripts/build-tetol-bridge.mjs)
 * into one ES module a standalone TETOL prototype can import:
 *
 *   import { createBridge } from "./s33d-bridge.js";
 *   const s33d = createBridge();
 *   const friend = await s33d.data.getAncientFriend(id);
 *   s33d.routeToSpatial("/staff/YEW");   // → { address: "staff-room/staff/YEW", … }
 */
import { createReadOnlyClient } from "./readOnlyClient";
import { createS33DDataAdapter } from "./s33dDataAdapter";
import { SPATIAL_REGISTRY, routeToSpatial, spatialToRoute } from "./spatialRegistry";

export * from "./spatialRegistry";
export * from "./staffIdentity";
export * from "./s33dDataAdapter";
export { createReadOnlyClient, TETOL_READONLY_AUTH_OPTIONS } from "./readOnlyClient";

export function createBridge(options: { url?: string; anonKey?: string } = {}) {
  const client = createReadOnlyClient(options.url, options.anonKey);
  return {
    data: createS33DDataAdapter(client),
    registry: SPATIAL_REGISTRY,
    routeToSpatial,
    spatialToRoute,
  };
}

/** Presentation only: never grants visibility, access or encounter authority. */
export interface TreeLocationEvidence {
  location_confidence?: string | null;
  location_basis?: string | null;
  metadata?: unknown;
}
export const SATELLITE_LOCATION_LABEL = "Satellite-derived estimate — trunk position unverified";
export function treeLocationLabel(tree: TreeLocationEvidence): string | null {
  const metadata = tree.metadata as { location_provenance?: { basis?: unknown } } | null;
  const basis = tree.location_basis ?? metadata?.location_provenance?.basis;
  if (basis === "satellite_estimate") return SATELLITE_LOCATION_LABEL;
  return tree.location_confidence === "approximate" ? "Approximate location — trunk position unverified" : null;
}
export function treeMarkerDescription(tree: TreeLocationEvidence & { name: string }): string {
  return [tree.name, treeLocationLabel(tree)].filter(Boolean).join(" — ");
}
export function treeGeographicMetadata(tree: TreeLocationEvidence & { latitude?: number | null; longitude?: number | null }) {
  return treeLocationLabel(tree) ? {} : { geoLat: tree.latitude, geoLon: tree.longitude };
}

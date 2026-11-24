/** Read-only presentation. Metadata never grants access or encounter authority. */
export interface TreeLocationEvidence {
  location_confidence?: string | null;
  location_basis?: string | null;
  visiting_access_basis?: string | null;
  accessibility_tier?: string | null;
  metadata?: unknown;
}
export const SATELLITE_LOCATION_LABEL = "Satellite-derived estimate — trunk position unverified";
export function treeLocationLabel(tree: TreeLocationEvidence): string | null {
  const metadata = tree.metadata as { location_provenance?: { basis?: unknown } } | null;
  const basis = tree.location_basis ?? metadata?.location_provenance?.basis;
  return basis === "satellite_estimate" ? SATELLITE_LOCATION_LABEL : null;
}
export function treeMarkerDescription(tree: TreeLocationEvidence & { name: string }): string {
  return [tree.name, treeLocationLabel(tree)].filter(Boolean).join(" — ");
}
export function satelliteMarkerOptions(tree: TreeLocationEvidence & { name: string }) {
  return treeLocationLabel(tree) ? { title: treeMarkerDescription(tree), alt: treeMarkerDescription(tree) } : {};
}
export function isManagedPublicRecord(tree: TreeLocationEvidence, tier = tree.accessibility_tier): boolean {
  const metadata = tree.metadata as { visiting_access?: { kind?: unknown } } | null;
  const basis = tree.visiting_access_basis ?? metadata?.visiting_access?.kind;
  return tier === "public" && basis === "managed_grounds";
}

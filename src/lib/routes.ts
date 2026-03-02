/**
 * Canonical route constants — single source of truth for all navigation.
 *
 * Usage:
 *   import { ROUTES } from "@/lib/routes";
 *   <Link to={ROUTES.MAP}>Map</Link>
 *   <Link to={ROUTES.COUNTRY("switzerland")}>Switzerland</Link>
 */

export const ROUTES = {
  /** Main interactive map view */
  MAP: "/map",
  /** Atlas landing — countries index */
  ATLAS: "/atlas",
  /** Country portal page */
  COUNTRY: (slug: string) => `/atlas/${slug}` as const,
  /** Sub-region portal */
  SUB_REGION: (countrySlug: string, subSlug: string) => `/atlas/${countrySlug}/${subSlug}` as const,
  /** Library / Heartwood */
  LIBRARY: "/library",
  /** Council of Life */
  COUNCIL: "/council-of-life",
  /** Dashboard / Hearth */
  HEARTH: "/dashboard",
  /** Vault */
  VAULT: "/vault",
  /** Value Tree */
  VALUE_TREE: "/value-tree",
  /** Value Tree — Earn branch */
  VALUE_TREE_EARN: "/value-tree?tab=earn",
} as const;

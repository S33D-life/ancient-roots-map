/**
 * Canonical route constants — single source of truth for all navigation.
 *
 * Usage:
 *   import { ROUTES } from "@/lib/routes";
 *   <Link to={ROUTES.MAP}>Map</Link>
 *   <Link to={ROUTES.COUNTRY("switzerland")}>Switzerland</Link>
 */

export const ROUTES = {
  /** TETOL homepage / navigation compass */
  HOME: "/",
  /** S33D gateway page (former homepage) */
  S33D: "/s33d",
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
  /** Support hub */
  SUPPORT: "/support",
  /** Guardian Harvest Exchange */
  HARVEST: "/harvest",
  /** Harvest detail */
  HARVEST_DETAIL: (id: string) => `/harvest/${id}` as const,
  /** Living Forest Roadmap */
  ROADMAP: "/roadmap",
  /** Species Hives index */
  HIVES: "/hives",
  /** Species Hive dashboard */
  HIVE: (family: string) => `/hive/${family}` as const,
  /** Cosmic Calendar */
  COSMIC: "/cosmic",
  /** Tree detail */
  TREE: (id: string) => `/tree/${id}` as const,
  /** Wanderer profile */
  WANDERER: (id: string) => `/wanderer/${id}` as const,
  /** Authentication */
  AUTH: "/auth",
  /** Add tree */
  ADD_TREE: "/add-tree",
  /** Bug garden */
  BUG_GARDEN: "/bug-garden",
  /** Bio-regions index */
  BIO_REGIONS: "/atlas/bio-regions",
  /** Bio-region detail */
  BIO_REGION: (slug: string) => `/atlas/bio-regions/${slug}` as const,
  /** Patron Offering */
  PATRON_OFFERING: "/patron-offering",
  /** Staff Room */
  STAFF_ROOM: "/library/staff-room",
  /** Staff Detail */
  STAFF: (code: string) => `/staff/${code}` as const,
  /** Value Tree — Living Economy */
  VALUE_TREE_ECONOMY: "/value-tree?tab=economy",
  /** Tree Data Commons */
  TREE_DATA_COMMONS: "/tree-data-commons",
  /** Agent Garden */
  AGENT_GARDEN: "/agent-garden",
  /** Telegram Handoff */
  TELEGRAM_HANDOFF: "/telegram-handoff",
} as const;

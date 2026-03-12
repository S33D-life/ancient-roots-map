/**
 * Open Graph / Social Share Metadata Utility
 * -------------------------------------------
 * Centralised config for social preview metadata across S33D.
 *
 * ARCHITECTURE:
 * - Static pages (homepage, staff-room) → index.html meta tags (crawler-safe)
 * - Dynamic pages (trees, staffs) → og-proxy edge function (crawler-safe)
 * - Client-side → these helpers for in-app <head> updates (nice-to-have, not crawler-visible)
 *
 * IMAGE FALLBACK HIERARCHY:
 *   1. Curated / custom OG image for the page
 *   2. Best available hero image (tree photo, staff image)
 *   3. Global S33D branded share image
 */

export const APP_URL = "https://ancient-roots-map.lovable.app";
export const DEFAULT_OG_IMAGE = `${APP_URL}/og/s33d-share-default.jpg`;

export interface OGMeta {
  title: string;
  description: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  url: string;
  type?: string;
  siteName?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterSite?: string;
}

/** Default metadata — global fallback for the whole site */
export const DEFAULT_OG: OGMeta = {
  title: "S33D.life — The Living Atlas of Ancient Friends",
  description:
    "A globally distributed, locally curated living library mapping ancient trees, gathering wisdom, and weaving a planetary tapestry of seeds, stories, and mystery.",
  image: DEFAULT_OG_IMAGE,
  imageWidth: 1200,
  imageHeight: 630,
  url: APP_URL,
  type: "website",
  siteName: "S33D.life",
  twitterCard: "summary_large_image",
  twitterSite: "@s33dlife",
};

/* ── Image fallback helper ──────────────────────────────── */

/**
 * Resolve the best available image from a priority list.
 * Returns the first truthy non-empty string, or the global default.
 */
export function resolveImage(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (c && c.trim()) return c;
  }
  return DEFAULT_OG_IMAGE;
}

/* ── Page-level OG builders ─────────────────────────────── */

/** Build OG metadata for an Ancient Friend / tree page */
export function treeOG(tree: {
  id: string;
  name?: string | null;
  species?: string | null;
  nation?: string | null;
  description?: string | null;
  /** Curated OG image (highest priority) */
  ogImage?: string | null;
  /** Hero / featured photo */
  heroImage?: string | null;
  /** Any available photo from offerings */
  photoUrl?: string | null;
}): OGMeta {
  const treeName = tree.name || "Ancient Friend";
  const species = tree.species || "Unknown species";
  const location = tree.nation || "Unknown location";

  const desc = tree.description
    ? tree.description.slice(0, 155).trim() + (tree.description.length > 155 ? "…" : "")
    : `An Ancient Friend in ${location}. Visit this tree on the S33D Living Atlas.`;

  return {
    ...DEFAULT_OG,
    title: `${treeName} — ${species} | S33D.life`,
    description: desc,
    image: resolveImage(tree.ogImage, tree.heroImage, tree.photoUrl),
    url: `${APP_URL}/tree/${tree.id}`,
  };
}

/** Build OG metadata for a Staff page */
export function staffOG(staff: {
  code: string;
  name?: string | null;
  species?: string | null;
  /** Curated OG image (highest priority) */
  ogImage?: string | null;
  /** Primary staff photo */
  primaryImage?: string | null;
  isCircle?: boolean;
}): OGMeta {
  const species = staff.species || staff.name || staff.code;
  const isCircle = staff.isCircle ?? staff.code.includes("-C");
  const displayCode = staff.code.toUpperCase();

  const title = isCircle
    ? `${displayCode} — ${species} Staff | S33D.life`
    : `${species} — Origin Staff | S33D.life`;

  const description = isCircle
    ? `A ${species} circle staff from the S33D Staff Room. Explore its lineage and lore.`
    : `The ${species} Origin Staff — one of 36 founding staffs in the S33D collection.`;

  return {
    ...DEFAULT_OG,
    title,
    description,
    image: resolveImage(staff.ogImage, staff.primaryImage),
    url: `${APP_URL}/staff/${staff.code}`,
  };
}

/** Build OG metadata for a research tree page */
export function researchTreeOG(tree: {
  id: string;
  name?: string | null;
  species?: string | null;
  country?: string | null;
  significance?: string | null;
  imageUrl?: string | null;
}): OGMeta {
  const treeName = tree.name || "Research Tree";
  const species = tree.species || "Unknown species";
  const location = tree.country || "Unknown location";

  return {
    ...DEFAULT_OG,
    title: `${treeName} — ${species} | S33D.life`,
    description: tree.significance
      ? tree.significance.slice(0, 155).trim() + (tree.significance.length > 155 ? "…" : "")
      : `A research-layer tree in ${location}. Discover it on the S33D Living Atlas.`,
    image: resolveImage(tree.imageUrl),
    url: `${APP_URL}/tree/research/${tree.id}`,
  };
}

/* ── Proxy URL builder ──────────────────────────────────── */

/**
 * Build the og-proxy edge function URL for a given route.
 * Use this when constructing share links that need to be crawler-safe.
 */
export function ogProxyUrl(route: string): string {
  return `${APP_URL}/functions/v1/og-proxy?path=${encodeURIComponent(route)}`;
}

/**
 * Build a crawler-safe share URL for a tree.
 * When shared in Telegram/WhatsApp/Discord, crawlers will hit the og-proxy
 * which returns proper OG tags, then redirects to the SPA.
 */
export function treeShareUrl(treeId: string): string {
  return ogProxyUrl(`/tree/${treeId}`);
}

/** Build a crawler-safe share URL for a staff page. */
export function staffShareUrl(staffCode: string): string {
  return ogProxyUrl(`/staff/${staffCode}`);
}

/** Build a crawler-safe share URL for a research tree. */
export function researchTreeShareUrl(treeId: string): string {
  return ogProxyUrl(`/tree/research/${treeId}`);
}

/**
 * Open Graph / Social Share Metadata Utility
 * -------------------------------------------
 * Centralised config for social preview metadata across S33D.
 * 
 * NOTE: Because S33D is a client-rendered SPA, these helpers are useful
 * for in-app <Helmet>-style updates, but **crawlers (Telegram, WhatsApp,
 * Discord, X) read the raw HTML before JS executes**.
 * 
 * Crawler-safe previews for dynamic pages (trees, staffs) must be served
 * via the edge-function OG proxy (see supabase/functions/og-proxy).
 * Static pages (homepage, staff-room) are covered by index.html meta tags.
 */

const APP_URL = "https://ancient-roots-map.lovable.app";
const DEFAULT_OG_IMAGE = `${APP_URL}/og/s33d-share-default.jpg`;

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

/** Default metadata for the whole site */
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

/** Build OG metadata for an Ancient Friend / tree page */
export function treeOG(tree: {
  id: string;
  name?: string | null;
  species?: string | null;
  nation?: string | null;
  imageUrl?: string | null;
}): OGMeta {
  const treeName = tree.name || "Ancient Friend";
  const species = tree.species || "Unknown species";
  const location = tree.nation || "Unknown location";

  return {
    ...DEFAULT_OG,
    title: `${treeName} — ${species}`,
    description: `An Ancient Friend in ${location}. Visit this tree on the S33D Living Atlas.`,
    image: tree.imageUrl || DEFAULT_OG_IMAGE,
    url: `${APP_URL}/tree/${tree.id}`,
  };
}

/** Build OG metadata for a Staff page */
export function staffOG(staff: {
  code: string;
  name?: string | null;
  species?: string | null;
  imageUrl?: string | null;
}): OGMeta {
  const staffName = staff.name || staff.code;
  return {
    ...DEFAULT_OG,
    title: `${staffName} — S33D Staff`,
    description: `A living staff from the S33D grove. Species: ${staff.species || "unknown"}.`,
    image: staff.imageUrl || DEFAULT_OG_IMAGE,
    url: `${APP_URL}/library/staff-room/${staff.code}`,
  };
}

/** Build the edge-function OG proxy URL for a given route */
export function ogProxyUrl(route: string): string {
  return `${APP_URL}/functions/v1/og-proxy?path=${encodeURIComponent(route)}`;
}

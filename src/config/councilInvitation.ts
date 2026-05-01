/**
 * Council Invitation — single source of truth for the current cycle's scroll.
 *
 * 🌙 UPDATE EACH NEW MOON / FULL MOON:
 *   1. Replace COUNCIL_INVITATION_PUBLIC_URL with the new Notion page URL.
 *   2. Replace COUNCIL_INVITATION_EMBED_URL with the same page ID using the
 *      `/ebd/` path (Notion's embeddable view).
 *
 * That's it — the Council page picks up the change automatically.
 */

/** Public Notion page — used for the "Open Full Scroll in Notion" button. */
export const COUNCIL_INVITATION_PUBLIC_URL =
  "https://clammy-viscount-ddb.notion.site/2ee15b58480d80c28ccce97480f7a69d";

/** Embeddable Notion page — used for the iframe inside the Council Scroll. */
export const COUNCIL_INVITATION_EMBED_URL =
  "https://clammy-viscount-ddb.notion.site/ebd/2ee15b58480d80c28ccce97480f7a69d";

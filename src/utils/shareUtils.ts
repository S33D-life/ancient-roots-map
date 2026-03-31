/**
 * S33D Share Utility
 * ──────────────────
 * Centralised sharing helpers for all entity types.
 *
 * ARCHITECTURE:
 * - Share URLs route through the og-proxy edge function so crawlers
 *   (Telegram, WhatsApp, Discord, X, iMessage) receive proper OG tags.
 * - The og-proxy serves lightweight HTML with OG meta + instant redirect
 *   to the real SPA page, so human visitors land on the app seamlessly.
 *
 * IMAGE FALLBACK HIERARCHY (per entity):
 *   1. Curated OG card image
 *   2. Generated OG card (future)
 *   3. Best available hero image / photo
 *   4. Global S33D branded share image
 */

import { APP_URL, DEFAULT_OG_IMAGE } from "@/utils/ogMeta";

/** Resolve the public site base URL — prefers env var, then APP_URL constant */
function getSiteBase(): string {
  try {
    const env = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL;
    if (env) return env.replace(/\/+$/, "");
  } catch {}
  return APP_URL;
}

/* ── Entity types ───────────────────────────────────────── */

export type ShareEntityType =
  | "tree"
  | "research_tree"
  | "nftree"
  | "staff"
  | "species"
  | "region"
  | "council"
  | "page";

export interface ShareEntity {
  type: ShareEntityType;
  id: string;
  name?: string;
  species?: string;
  location?: string;
  imageUrl?: string | null;
  /** For NFTree records — shows minted badge */
  isMinted?: boolean;
  /** Staff code that minted the NFTree */
  mintedByStaff?: string | null;
}

/* ── URL builders ───────────────────────────────────────── */

/**
 * Get the canonical app route for an entity (the real SPA page).
 */
export function getCanonicalPath(entity: ShareEntity): string {
  switch (entity.type) {
    case "tree":
    case "nftree":
      return `/tree/${entity.id}`;
    case "research_tree":
      return `/tree/research/${entity.id}`;
    case "staff":
      return `/staff/${entity.id}`;
    case "species":
      return `/hive/${entity.id}`;
    case "region":
      return `/region/${entity.id}`;
    case "council":
      return `/council-of-life`;
    case "page":
      return `/${entity.id}`;
    default:
      return `/`;
  }
}

/**
 * Get the canonical public URL for sharing.
 * Always returns a real page URL — never an internal edge-function route.
 */
export function getShareUrl(entity: ShareEntity): string {
  const path = getCanonicalPath(entity);
  return `${getSiteBase()}${path}`;
}

/**
 * Convenience: build share URL from entity type + id.
 */
export function buildShareUrl(type: ShareEntityType, id: string): string {
  return getShareUrl({ type, id });
}

/**
 * Get the direct app URL. Same as getShareUrl (canonical page URL).
 */
export function getDirectUrl(entity: ShareEntity): string {
  return getShareUrl(entity);
}

/* ── Share text builders ────────────────────────────────── */

export function buildShareTitle(entity: ShareEntity): string {
  const name = entity.name || "Ancient Friend";
  switch (entity.type) {
    case "tree":
      return `${name} — ${entity.species || "Ancient Friend"} | S33D.life`;
    case "nftree":
      return entity.mintedByStaff
        ? `${name} — Minted with ${entity.mintedByStaff} | S33D.life`
        : `${name} — NFTree | S33D.life`;
    case "research_tree":
      return `${name} — ${entity.species || "Research Tree"} | S33D.life`;
    case "staff":
      return `${entity.species || name} — Staff | S33D.life`;
    default:
      return `${name} | S33D.life`;
  }
}

export function buildShareDescription(entity: ShareEntity): string {
  const location = entity.location || "the Living Atlas";
  switch (entity.type) {
    case "tree":
      return `An Ancient Friend in ${location}. Visit this tree on the S33D Living Atlas.`;
    case "nftree": {
      const minted = entity.mintedByStaff
        ? ` Minted with ${entity.mintedByStaff}.`
        : "";
      return `A minted NFTree in ${location}.${minted} Part of the S33D Living Atlas.`;
    }
    case "research_tree":
      return `A research-layer tree in ${location}. Discover it on the S33D Living Atlas.`;
    case "staff":
      return `A living staff from the S33D grove. Species: ${entity.species || "unknown"}.`;
    default:
      return "Discover the Living Atlas of Ancient Friends at S33D.life.";
  }
}

/* ── Share actions ──────────────────────────────────────── */

export interface ShareOptions {
  entity: ShareEntity;
  caption?: string;
  /** Referral invite code to append */
  inviteCode?: string | null;
}

function buildFullShareUrl(opts: ShareOptions): string {
  let url = getShareUrl(opts.entity);
  if (opts.inviteCode) {
    url += `&invite=${encodeURIComponent(opts.inviteCode)}`;
  }
  return url;
}

function buildFullShareText(opts: ShareOptions): string {
  const name = opts.entity.name || "Ancient Friend";
  const species = opts.entity.species || "";
  const locationPart = opts.entity.location ? ` in ${opts.entity.location}` : "";
  const caption = opts.caption || "An ancient friend still standing.";
  return `🌳 Meet ${name}${locationPart}${species ? ` · ${species}` : ""}\n\n${caption}`;
}

export async function shareToWhatsApp(opts: ShareOptions): Promise<void> {
  const url = buildFullShareUrl(opts);
  const text = buildFullShareText(opts);
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
    "_blank"
  );
}

export async function shareToTelegram(opts: ShareOptions): Promise<void> {
  const url = buildFullShareUrl(opts);
  const text = buildFullShareText(opts);
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    "_blank"
  );
}

export async function shareToX(opts: ShareOptions): Promise<void> {
  const url = buildFullShareUrl(opts);
  const text = buildFullShareText(opts);
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    "_blank"
  );
}

export async function copyShareLink(opts: ShareOptions): Promise<boolean> {
  const url = buildFullShareUrl(opts);
  const text = buildFullShareText(opts);
  const fullText = `${text}\n\n${url}`;
  try {
    await navigator.clipboard.writeText(fullText);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = fullText;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    return true;
  }
}

export async function nativeShare(opts: ShareOptions): Promise<boolean> {
  if (!navigator.share) return false;
  const url = buildFullShareUrl(opts);
  try {
    await navigator.share({
      title: buildShareTitle(opts.entity),
      text: buildFullShareText(opts),
      url,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatch share action by platform key.
 */
export async function shareByPlatform(
  platform: string,
  opts: ShareOptions
): Promise<boolean> {
  switch (platform) {
    case "whatsapp":
      await shareToWhatsApp(opts);
      return true;
    case "telegram":
      await shareToTelegram(opts);
      return true;
    case "x":
      await shareToX(opts);
      return true;
    case "copy":
      return copyShareLink(opts);
    case "native":
      return nativeShare(opts);
    default:
      return false;
  }
}

/* ── Image helpers ──────────────────────────────────────── */

/**
 * Resolve the best share image from a priority list of candidates.
 * Re-exports resolveImage from ogMeta for backward compatibility.
 */
export { resolveImage as resolveShareImage } from "@/utils/ogMeta";

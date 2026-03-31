/**
 * og-proxy — Universal Open Graph meta-tag proxy for S33D.
 *
 * Social-media crawlers (Telegram, WhatsApp, Discord, X/Twitter, iMessage)
 * fetch the raw HTML and cannot execute JavaScript. This edge function
 * returns a lightweight HTML page with correct OG tags for crawlers,
 * and transparently serves the SPA for regular browsers.
 *
 * Supported routes:
 *   /                        → homepage defaults
 *   /library/staff-room      → Staff Room landing
 *   /library                 → Library landing
 *   /map                     → Atlas landing
 *   /council-of-life         → Council landing
 *   /hives                   → Hives landing
 *   /s33d                    → About / threshold page
 *   /tree/<uuid>             → Ancient Friend page (DB lookup)
 *   /tree/research/<uuid>    → Research tree page (DB lookup)
 *   /staff/<code>            → Staff detail page (static data)
 *   *                        → fallback with S33D branding
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_URL = "https://ancient-roots-map.lovable.app";
const DEFAULT_IMAGE = `${APP_URL}/og/s33d-share-default.jpg`;
const OG_CARD_BASE = `${SUPABASE_URL}/functions/v1/og-card`;

/* ── Bot detection ─────────────────────────────────────── */

const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|discord|embedly|quora|pinterest|redditbot|flipboard|tumblr|bitly|skype|nuzzel|outbrain|w3c_validator|vkshare|slack|preview|fetch|curl|wget|headless|phantom|googlebot|bingbot|yandex|baidu|duckduck|applebot|iamessagebot/i;

function isBot(req: Request): boolean {
  const ua = req.headers.get("user-agent") || "";
  return BOT_UA_RE.test(ua);
}

/* ── SPA proxy for browsers ────────────────────────────── */

let cachedSpaHtml: string | null = null;
let spaHtmlCachedAt = 0;
const SPA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSpaHtml(): Promise<string> {
  const now = Date.now();
  if (cachedSpaHtml && (now - spaHtmlCachedAt) < SPA_CACHE_TTL) {
    return cachedSpaHtml;
  }
  try {
    const res = await fetch(`${APP_URL}/index.html`, {
      headers: { "Accept": "text/html" },
    });
    if (res.ok) {
      cachedSpaHtml = await res.text();
      spaHtmlCachedAt = now;
      return cachedSpaHtml;
    }
  } catch (err) {
    console.error("[og-proxy] Failed to fetch SPA HTML:", err);
  }
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${APP_URL}"></head><body></body></html>`;
}

/* ── Input validation ──────────────────────────────────── */

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const STAFF_CODE_RE = /^[A-Za-z0-9_-]{1,30}$/;

function isValidUUID(s: string): boolean { return UUID_RE.test(s); }
function isValidStaffCode(s: string): boolean { return STAFF_CODE_RE.test(s); }

function sanitizePath(raw: string): string {
  const cleaned = raw.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200);
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

/* ── Route matchers ─────────────────────────────────────── */

const TREE_RE = /^\/tree\/([a-f0-9-]{36})$/i;
const RESEARCH_TREE_RE = /^\/tree\/research\/([a-f0-9-]{36})$/i;
const STAFF_RE = /^\/staff\/([A-Za-z0-9_-]+)$/;

/* ── HTML helpers ───────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  imageWidth?: number;
  imageHeight?: number;
  geoLat?: number | null;
  geoLon?: number | null;
}

function renderHTML(m: Meta): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(m.title)}</title>
  <meta name="description" content="${esc(m.description)}">

  <meta property="og:title" content="${esc(m.title)}">
  <meta property="og:description" content="${esc(m.description)}">
  <meta property="og:image" content="${m.image}">
  <meta property="og:image:width" content="${m.imageWidth ?? 1200}">
  <meta property="og:image:height" content="${m.imageHeight ?? 630}">
  <meta property="og:url" content="${esc(m.url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="S33D.life">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@s33dlife">
  <meta name="twitter:title" content="${esc(m.title)}">
  <meta name="twitter:description" content="${esc(m.description)}">
  <meta name="twitter:image" content="${m.image}">

  <link rel="canonical" href="${esc(m.url)}">

  ${m.geoLat != null ? `<meta property="place:location:latitude" content="${m.geoLat}">` : ""}
  ${m.geoLon != null ? `<meta property="place:location:longitude" content="${m.geoLon}">` : ""}

  <meta http-equiv="refresh" content="0;url=${esc(m.url)}">
</head>
<body>
  <p>Redirecting to <a href="${esc(m.url)}">${esc(m.title)}</a>…</p>
</body>
</html>`;
}

const DEFAULT_META: Meta = {
  title: "S33D.life — The Living Atlas of Ancient Friends",
  description:
    "A living library mapping ancient trees worldwide. Discover, visit, and steward the oldest living beings on Earth.",
  image: DEFAULT_IMAGE,
  url: APP_URL,
  imageWidth: 1200,
  imageHeight: 630,
};

/* ── Static route overrides ─────────────────────────────── */

const STATIC_ROUTES: Record<string, Partial<Meta>> = {
  "/": {},
  "/library/staff-room": {
    title: "The Staff Room — S33D.life",
    description:
      "Craft a living staff from ancient wood. Link it to a tree and carry its story forward.",
    url: `${APP_URL}/library/staff-room`,
  },
  "/map": {
    title: "The Living Atlas — S33D.life",
    description:
      "Explore the global map of ancient trees. Find Ancient Friends near you and begin your journey.",
    url: `${APP_URL}/map`,
  },
  "/library": {
    title: "The Library — S33D.life",
    description:
      "Browse the living library — staffs, songs, seeds, stories, and the heartwood of S33D.",
    url: `${APP_URL}/library`,
  },
  "/council-of-life": {
    title: "Council of Life — S33D.life",
    description:
      "Shape the future of S33D. Participate in governance, cast influence, and grow the atlas together.",
    url: `${APP_URL}/council-of-life`,
  },
  "/hives": {
    title: "Species Hives — S33D.life",
    description:
      "Explore species-heart economies across the Ancient Friends network.",
    url: `${APP_URL}/hives`,
  },
  "/s33d": {
    title: "S33D — Under the Canopy",
    description:
      "Stand beneath the canopy. Discover S33D — a living atlas of ancient trees, seeds, stories, and stewardship.",
    url: `${APP_URL}/s33d`,
  },
};

/* ── Staff species data ─────────────────────────────────── */

const SPECIES_NAMES: Record<string, string> = {
  GOA: "Goat Willow", PLUM: "Plum", BEE: "Beech", RHOD: "Rhododendron",
  CHERRY: "Wild Cherry", CHER: "Wild Cherry", ROW: "Rowan", PINE: "Scots Pine",
  BOX: "Box", OAK: "Oak", PRIVET: "Privet", PRIV: "Privet",
  WILLOW: "Willow", WIL: "Willow", SYC: "Sycamore", HAZ: "Hazel",
  HORN: "Hornbeam", YEW: "Yew", ASH: "Ash", HOL: "Holly",
  SWE: "Sweet Chestnut", APP: "Apple", IVY: "Ivy", ELD: "Elder",
  HAW: "Hawthorn", PLA: "Plane", BUCK: "Buckthorn", BIR: "Silver Birch",
  ROSE: "Dog Rose", BUD: "Buddleja", CRAB: "Crab Apple", DAWN: "Dawn Redwood",
  HORS: "Horse Chestnut", JAPA: "Japanese Maple", MED: "Medlar",
  PEAR: "Pear", SLOE: "Blackthorn", WITC: "Witch Hazel", ALD: "Alder",
};

function resolveStaffSpecies(code: string): string {
  const base = code.split("-")[0].toUpperCase();
  return SPECIES_NAMES[base] || code;
}

function isCircleStaff(code: string): boolean {
  return code.includes("-C") || code.includes("-c");
}

/* ── Cache-busting helper ──────────────────────────────── */

/** Append a date-based version param so platform caches refresh when data changes */
function versionedOgCardUrl(type: string, id: string, updatedAt?: string | null): string {
  const v = updatedAt ? new Date(updatedAt).getTime().toString(36) : "";
  const vParam = v ? `&v=${v}` : "";
  return `${OG_CARD_BASE}?type=${type}&id=${encodeURIComponent(id)}${vParam}`;
}

/* ── Main handler ───────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const rawPath = url.searchParams.get("path") || "/";
  const path = sanitizePath(rawPath);

  // Non-bot: serve SPA
  if (!isBot(req)) {
    try {
      const spaHtml = await getSpaHtml();
      return new Response(spaHtml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, must-revalidate",
        },
      });
    } catch {
      return Response.redirect(`${APP_URL}${path}`, 302);
    }
  }

  // Bot: return OG HTML
  try {
    const staticOverride = STATIC_ROUTES[path];
    if (staticOverride !== undefined) {
      return respond({ ...DEFAULT_META, ...staticOverride });
    }

    const researchMatch = path.match(RESEARCH_TREE_RE);
    if (researchMatch) {
      const id = researchMatch[1];
      if (!isValidUUID(id)) return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
      return respond(await fetchResearchTreeMeta(id));
    }

    const treeMatch = path.match(TREE_RE);
    if (treeMatch) {
      const id = treeMatch[1];
      if (!isValidUUID(id)) return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
      return respond(await fetchTreeMeta(id));
    }

    const staffMatch = path.match(STAFF_RE);
    if (staffMatch) {
      const code = staffMatch[1];
      if (!isValidStaffCode(code)) return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
      return respond(buildStaffMeta(code));
    }

    return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
  } catch (err) {
    console.error("[og-proxy] Unhandled error:", err);
    return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
  }
});

function respond(meta: Meta): Response {
  return new Response(renderHTML(meta), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

/* ── Dynamic data fetchers ──────────────────────────────── */

async function fetchTreeMeta(id: string): Promise<Meta> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const [treeRes, mintedRes, staffRes] = await Promise.all([
      supabase
        .from("trees")
        .select("id, name, species, nation, latitude, longitude, description, updated_at")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("chain_anchors")
        .select("id, status")
        .eq("asset_id", id)
        .eq("status", "confirmed")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ceremony_logs")
        .select("staff_name, staff_species, staff_code")
        .eq("ceremony_type", "binding")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const tree = treeRes.data;
    if (!tree) {
      console.warn(`[og-proxy] Tree not found: ${id}`);
      return { ...DEFAULT_META, url: `${APP_URL}/tree/${id}` };
    }

    const treeName = tree.name || "Ancient Friend";
    const species = tree.species || "Unknown species";
    const location = tree.nation || "Unknown location";
    const isMinted = !!mintedRes.data;
    const staffName = staffRes.data?.staff_name || staffRes.data?.staff_code || null;
    const hasStaff = !!staffName;

    // Cache-busted og-card URL
    const image = versionedOgCardUrl("tree", id, tree.updated_at);

    // Refined titles — shorter, cleaner for unfurl
    let title: string;
    if (isMinted && hasStaff) {
      title = `${treeName} ⚷ ${staffName} — S33D`;
    } else if (isMinted) {
      title = `${treeName} — NFTree | S33D`;
    } else {
      title = `${treeName} — ${species} | S33D`;
    }

    // Refined descriptions — warm, inviting, short
    let desc: string;
    if (tree.description) {
      desc = tree.description.slice(0, 140).trim() + (tree.description.length > 140 ? "…" : "");
    } else if (isMinted && hasStaff) {
      desc = `An NFTree in ${location}, bound to ${staffName}. Visit on the S33D Living Atlas.`;
    } else if (isMinted) {
      desc = `A minted NFTree in ${location}. Visit on the S33D Living Atlas.`;
    } else {
      desc = `An Ancient Friend in ${location}. Visit this ${species.toLowerCase()} on the S33D Living Atlas.`;
    }

    return {
      title,
      description: desc,
      image,
      url: `${APP_URL}/tree/${tree.id}`,
      imageWidth: 1200,
      imageHeight: 630,
      geoLat: tree.latitude,
      geoLon: tree.longitude,
    };
  } catch (err) {
    console.error(`[og-proxy] fetchTreeMeta error for ${id}:`, err);
    return { ...DEFAULT_META, url: `${APP_URL}/tree/${id}` };
  }
}

async function fetchResearchTreeMeta(id: string): Promise<Meta> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tree } = await supabase
      .from("research_trees")
      .select("id, name, species, country, latitude, longitude, significance, image_url, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!tree) {
      console.warn(`[og-proxy] Research tree not found: ${id}`);
      return { ...DEFAULT_META, url: `${APP_URL}/tree/research/${id}` };
    }

    const treeName = tree.name || "Research Tree";
    const species = tree.species || "Unknown species";
    const location = tree.country || "Unknown location";
    const image = tree.image_url || DEFAULT_IMAGE;

    return {
      title: `${treeName} — ${species} | S33D`,
      description: tree.significance
        ? tree.significance.slice(0, 140).trim() + (tree.significance.length > 140 ? "…" : "")
        : `A research tree in ${location}. Discover it on the S33D Living Atlas.`,
      image,
      url: `${APP_URL}/tree/research/${tree.id}`,
      imageWidth: 1200,
      imageHeight: 630,
      geoLat: tree.latitude,
      geoLon: tree.longitude,
    };
  } catch (err) {
    console.error(`[og-proxy] fetchResearchTreeMeta error for ${id}:`, err);
    return { ...DEFAULT_META, url: `${APP_URL}/tree/research/${id}` };
  }
}

function buildStaffMeta(code: string): Meta {
  const species = resolveStaffSpecies(code);
  const isCircle = isCircleStaff(code);
  const displayCode = code.toUpperCase();

  const title = isCircle
    ? `${displayCode} — ${species} Circle Staff | S33D`
    : `${species} — Origin Staff | S33D`;

  const description = isCircle
    ? `A ${species} circle staff. Explore its lineage and lore in the S33D Staff Room.`
    : `The ${species} Origin Staff — one of 36 founding staffs. Enter the Staff Room.`;

  const image = `${OG_CARD_BASE}?type=staff&id=${encodeURIComponent(code)}`;

  return {
    title,
    description,
    image,
    url: `${APP_URL}/staff/${code}`,
    imageWidth: 1200,
    imageHeight: 630,
  };
}

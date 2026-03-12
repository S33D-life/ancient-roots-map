/**
 * og-proxy — Universal Open Graph meta-tag proxy for S33D.
 *
 * Social-media crawlers (Telegram, WhatsApp, Discord, X/Twitter, iMessage)
 * fetch the raw HTML and cannot execute JavaScript. This edge function
 * returns a lightweight HTML page with correct OG tags then redirects
 * browsers to the SPA.
 *
 * Supported routes:
 *   /                        → homepage defaults
 *   /library/staff-room      → Staff Room landing
 *   /map                     → Atlas landing
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

/* ── Route matchers ─────────────────────────────────────── */

const TREE_RE = /^\/tree\/([a-f0-9-]{36})$/i;
const RESEARCH_TREE_RE = /^\/tree\/research\/([a-f0-9-]{36})$/i;
const STAFF_RE = /^\/staff\/([A-Za-z0-9_-]+)$/;

/* ── HTML helpers ───────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
  <meta property="og:image" content="${esc(m.image)}">
  <meta property="og:image:width" content="${m.imageWidth ?? 1200}">
  <meta property="og:image:height" content="${m.imageHeight ?? 630}">
  <meta property="og:url" content="${esc(m.url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="S33D.life — The Living Atlas of Ancient Friends">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@s33dlife">
  <meta name="twitter:title" content="${esc(m.title)}">
  <meta name="twitter:description" content="${esc(m.description)}">
  <meta name="twitter:image" content="${esc(m.image)}">

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
    "A globally distributed, locally curated living library mapping ancient trees, gathering wisdom, and weaving a planetary tapestry of seeds, stories, and mystery.",
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
      "Enter the Staff Room. Craft your living staff, link it to ancient trees, and carry your story forward.",
    url: `${APP_URL}/library/staff-room`,
  },
  "/map": {
    title: "The Living Atlas — S33D.life",
    description:
      "Explore the global map of ancient trees. Discover Ancient Friends near you.",
    url: `${APP_URL}/map`,
  },
  "/library": {
    title: "The Library — S33D.life",
    description:
      "Browse the living library of Ancient Friends — staffs, songs, seeds, and stories.",
    url: `${APP_URL}/library`,
  },
  "/council-of-life": {
    title: "Council of Life — S33D.life",
    description:
      "Join the Council of Life. Participate in governance, cast influence, and shape the future of S33D.",
    url: `${APP_URL}/council-of-life`,
  },
  "/hives": {
    title: "Species Hives — S33D.life",
    description:
      "Explore species-heart economies and hive stewardship across the Ancient Friends network.",
    url: `${APP_URL}/hives`,
  },
};

/* ── Staff species data (mirrors staffContract config) ──── */

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

function resolveStaffImage(code: string): string {
  // Staff images live in /images/staffs/<lower>.jpeg
  // Circle staffs: code like YEW-C1S11 → /images/staffs/yew-c1-s11.jpeg
  const lower = code.toLowerCase();
  if (lower.includes("-c")) {
    // Circle staff: "YEW-C1S3" → "yew-c1-s3"
    const normalized = lower.replace(/c(\d+)s(\d+)/, "c$1-s$2");
    return `${APP_URL}/images/staffs/${normalized}.jpeg`;
  }
  // Origin staff: species code → species image
  return `${APP_URL}/images/staffs/${lower}.jpeg`;
}

function resolveStaffSpecies(code: string): string {
  // Extract base species from codes like "YEW-C1S3" or "YEW"
  const base = code.split("-")[0].toUpperCase();
  return SPECIES_NAMES[base] || code;
}

function isCircleStaff(code: string): boolean {
  return code.includes("-C") || code.includes("-c");
}

/* ── Main handler ───────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";

  // 1. Static routes
  const staticOverride = STATIC_ROUTES[path];
  if (staticOverride !== undefined) {
    return respond({ ...DEFAULT_META, ...staticOverride });
  }

  // 2. Tree detail page
  const treeMatch = path.match(TREE_RE);
  if (treeMatch) {
    return respond(await fetchTreeMeta(treeMatch[1]));
  }

  // 3. Research tree page
  const researchMatch = path.match(RESEARCH_TREE_RE);
  if (researchMatch) {
    return respond(await fetchResearchTreeMeta(researchMatch[1]));
  }

  // 4. Staff detail page
  const staffMatch = path.match(STAFF_RE);
  if (staffMatch) {
    return respond(buildStaffMeta(staffMatch[1]));
  }

  // 5. Fallback
  return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
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

    // Fetch tree, best photo, and NFTree/minted status in parallel
    const [treeRes, photoRes, mintedRes, staffRes] = await Promise.all([
      supabase
        .from("trees")
        .select("id, name, species, nation, latitude, longitude, description")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("offerings")
        .select("media_url")
        .eq("tree_id", id)
        .eq("type", "photo")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Check if tree has been minted (has chain anchor)
      supabase
        .from("chain_anchors")
        .select("id, status")
        .eq("asset_id", id)
        .eq("status", "confirmed")
        .limit(1)
        .maybeSingle(),
      // Check if tree has a staff-linked ceremony
      supabase
        .from("ceremony_logs")
        .select("staff_name, staff_species")
        .eq("ceremony_type", "binding")
        .limit(1)
        .maybeSingle(),
    ]);

    const tree = treeRes.data;
    if (!tree) return { ...DEFAULT_META, url: `${APP_URL}/tree/${id}` };

    const treeName = tree.name || "Ancient Friend";
    const species = tree.species || "Unknown species";
    const location = tree.nation || "Unknown location";
    const isMinted = !!mintedRes.data;
    const staffName = staffRes.data?.staff_name || null;

    // Image: use generated og-card SVG (dynamic card with photo/branding)
    const image = `${OG_CARD_BASE}?type=tree&id=${encodeURIComponent(id)}`;

    // Title: distinguish NFTree vs Ancient Friend
    const typeLabel = isMinted ? "NFTree" : "Ancient Friend";
    const title = `${treeName} — ${species} | S33D.life`;

    // Description with NFTree/staff context
    let desc: string;
    if (tree.description) {
      desc = tree.description.slice(0, 155).trim() + (tree.description.length > 155 ? "…" : "");
    } else if (isMinted && staffName) {
      desc = `A minted ${typeLabel} in ${location}. Bound with ${staffName}. Part of the S33D Living Atlas.`;
    } else if (isMinted) {
      desc = `A minted ${typeLabel} in ${location}. Part of the S33D Living Atlas.`;
    } else {
      desc = `An ${typeLabel} in ${location}. Visit this tree on the S33D Living Atlas.`;
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
  } catch {
    return { ...DEFAULT_META, url: `${APP_URL}/tree/${id}` };
  }
}

async function fetchResearchTreeMeta(id: string): Promise<Meta> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tree } = await supabase
      .from("research_trees")
      .select("id, name, species, country, latitude, longitude, significance, image_url")
      .eq("id", id)
      .maybeSingle();

    if (!tree) return { ...DEFAULT_META, url: `${APP_URL}/tree/research/${id}` };

    const treeName = tree.name || "Research Tree";
    const species = tree.species || "Unknown species";
    const location = tree.country || "Unknown location";

    // Image fallback: research image → global default
    const image = tree.image_url || DEFAULT_IMAGE;

    return {
      title: `${treeName} — ${species} | S33D.life`,
      description: tree.significance
        ? tree.significance.slice(0, 155).trim() + (tree.significance.length > 155 ? "…" : "")
        : `A research-layer tree in ${location}. Discover it on the S33D Living Atlas.`,
      image,
      url: `${APP_URL}/tree/research/${tree.id}`,
      imageWidth: 1200,
      imageHeight: 630,
      geoLat: tree.latitude,
      geoLon: tree.longitude,
    };
  } catch {
    return { ...DEFAULT_META, url: `${APP_URL}/tree/research/${id}` };
  }
}

function buildStaffMeta(code: string): Meta {
  const species = resolveStaffSpecies(code);
  const image = resolveStaffImage(code);
  const isCircle = isCircleStaff(code);

  const displayCode = code.toUpperCase();
  const title = isCircle
    ? `${displayCode} — ${species} Staff | S33D.life`
    : `${species} — Origin Staff | S33D.life`;

  const description = isCircle
    ? `A ${species} circle staff from the S33D Staff Room. Explore its lineage and lore.`
    : `The ${species} Origin Staff — one of 36 founding staffs in the S33D collection.`;

  return {
    title,
    description,
    // Staff images are local assets served from the app domain
    // If the image doesn't exist, crawlers will get a 404 and platforms
    // fall back gracefully — but most staffs have images
    image,
    url: `${APP_URL}/staff/${code}`,
    imageWidth: 1200,
    imageHeight: 630,
  };
}

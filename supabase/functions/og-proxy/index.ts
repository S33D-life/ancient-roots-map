/**
 * og-proxy — Universal Open Graph meta-tag proxy for S33D.
 *
 * Social-media crawlers (Telegram, WhatsApp, Discord, X/Twitter, iMessage)
 * fetch the raw HTML of a URL and cannot execute JavaScript. Because S33D
 * is a client-rendered SPA, crawlers only see the static index.html tags.
 *
 * This edge function intercepts crawler requests and returns a lightweight
 * HTML page with the correct OG tags for the requested route, then
 * redirects real browsers to the SPA.
 *
 * Usage (via rewrite rule or direct):
 *   GET /functions/v1/og-proxy?path=/tree/<id>
 *   GET /functions/v1/og-proxy?path=/library/staff-room
 *
 * For tree-specific previews it delegates to the existing tree-og function
 * logic (inlined here so one function handles all routes).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_URL = "https://ancient-roots-map.lovable.app";
const DEFAULT_IMAGE = `${APP_URL}/og/s33d-share-default.jpg`;

/* ── Route matchers ─────────────────────────────────────── */

const TREE_RE = /^\/tree\/([a-f0-9-]{36})$/i;
const RESEARCH_TREE_RE = /^\/tree\/research\/([a-f0-9-]{36})$/i;

/* ── Helpers ────────────────────────────────────────────── */

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
};

/* ── Main handler ───────────────────────────────────────── */

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";

  // 1. Check static routes
  const staticOverride = STATIC_ROUTES[path];
  if (staticOverride !== undefined) {
    const meta = { ...DEFAULT_META, ...staticOverride };
    return respond(meta);
  }

  // 2. Tree detail page
  const treeMatch = path.match(TREE_RE);
  if (treeMatch) {
    const treeId = treeMatch[1];
    const meta = await fetchTreeMeta(treeId);
    return respond(meta);
  }

  // 3. Research tree page
  const researchMatch = path.match(RESEARCH_TREE_RE);
  if (researchMatch) {
    const treeId = researchMatch[1];
    const meta = await fetchResearchTreeMeta(treeId);
    return respond(meta);
  }

  // 4. Fallback — use defaults with the requested path
  return respond({ ...DEFAULT_META, url: `${APP_URL}${path}` });
});

function respond(meta: Meta): Response {
  return new Response(renderHTML(meta), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

/* ── Dynamic data fetchers ──────────────────────────────── */

async function fetchTreeMeta(id: string): Promise<Meta> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tree } = await supabase
      .from("trees")
      .select("id, name, species, nation, latitude, longitude")
      .eq("id", id)
      .maybeSingle();

    if (!tree) return { ...DEFAULT_META, url: `${APP_URL}/tree/${id}` };

    // Try to find a photo
    const { data: photo } = await supabase
      .from("offerings")
      .select("media_url")
      .eq("tree_id", id)
      .eq("type", "photo")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const treeName = tree.name || "Ancient Friend";
    const species = tree.species || "Unknown species";
    const location = tree.nation || "Unknown location";

    return {
      title: `${treeName} — ${species}`,
      description: `An Ancient Friend in ${location}. Visit this tree on the S33D Living Atlas.`,
      image: photo?.media_url || DEFAULT_IMAGE,
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
      .select("id, name, species, country, latitude, longitude, significance")
      .eq("id", id)
      .maybeSingle();

    if (!tree) return { ...DEFAULT_META, url: `${APP_URL}/tree/research/${id}` };

    const treeName = tree.name || "Research Tree";
    const species = tree.species || "Unknown species";
    const location = tree.country || "Unknown location";

    return {
      title: `${treeName} — ${species}`,
      description: tree.significance
        ? tree.significance.slice(0, 155) + "…"
        : `A research-layer tree in ${location}. Discover it on the S33D Living Atlas.`,
      image: DEFAULT_IMAGE,
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

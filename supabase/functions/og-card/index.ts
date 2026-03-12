/**
 * og-card — Generate Open Graph card images for Ancient Friends and NFTrees.
 *
 * Returns an SVG-based card image rendered as PNG-like quality.
 * Since we can't use Canvas/Puppeteer in edge functions, we return
 * a clean SVG that social platforms can render.
 *
 * Usage:
 *   GET /functions/v1/og-card?type=tree&id=<uuid>
 *   GET /functions/v1/og-card?type=staff&id=<code>
 *
 * Returns: SVG image (1200x630) with tree/staff identity + S33D branding.
 * Social platforms that don't support SVG will fall back to og:image
 * which points to a photo or the default JPG.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ── Color palette (matches S33D design tokens) ─────────── */
const BG = "#1a1f14";       // --background
const GOLD = "#d4a017";     // --primary
const GOLD_LIGHT = "#f5e6b8"; // light gold for text
const MUTED = "#8a9178";    // muted green
const CARD_BG = "#232a1c";  // slightly lighter card

/* ── SVG helpers ────────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/* ── Card templates ─────────────────────────────────────── */

function treeCardSVG(opts: {
  name: string;
  species: string;
  location: string;
  isMinted: boolean;
  photoUrl?: string | null;
}): string {
  const badge = opts.isMinted ? "NFTree" : "Ancient Friend";
  const badgeColor = opts.isMinted ? "#c9a227" : GOLD;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#0f1309"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="#e8c547"/>
    </linearGradient>
    <clipPath id="photoClip">
      <rect x="60" y="60" width="400" height="510" rx="16"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle border frame -->
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="${GOLD}" stroke-opacity="0.15" stroke-width="1"/>

  <!-- Photo area (left side) -->
  ${opts.photoUrl ? `
  <rect x="60" y="60" width="400" height="510" rx="16" fill="${CARD_BG}"/>
  <image href="${esc(opts.photoUrl)}" x="60" y="60" width="400" height="510" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>
  ` : `
  <rect x="60" y="60" width="400" height="510" rx="16" fill="${CARD_BG}"/>
  <text x="260" y="320" text-anchor="middle" fill="${MUTED}" font-family="serif" font-size="64" opacity="0.3">🌳</text>
  `}

  <!-- Content area (right side) -->
  <!-- Badge -->
  <rect x="520" y="80" width="${badge.length * 14 + 32}" height="32" rx="16" fill="${badgeColor}" fill-opacity="0.15" stroke="${badgeColor}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="${520 + (badge.length * 14 + 32) / 2}" y="102" text-anchor="middle" fill="${badgeColor}" font-family="sans-serif" font-size="14" font-weight="500" letter-spacing="1.5">${esc(badge.toUpperCase())}</text>

  <!-- Tree name -->
  <text x="520" y="175" fill="${GOLD_LIGHT}" font-family="serif" font-size="42" font-weight="600" letter-spacing="0.5">
    ${esc(truncate(opts.name, 24))}
  </text>

  <!-- Species -->
  <text x="520" y="215" fill="${MUTED}" font-family="serif" font-size="22" font-style="italic">
    ${esc(truncate(opts.species, 36))}
  </text>

  <!-- Divider -->
  <line x1="520" y1="245" x2="780" y2="245" stroke="${GOLD}" stroke-opacity="0.2" stroke-width="1"/>

  <!-- Location -->
  <text x="520" y="285" fill="${MUTED}" font-family="sans-serif" font-size="18">
    📍 ${esc(truncate(opts.location, 40))}
  </text>

  <!-- S33D branding -->
  <text x="520" y="530" fill="${GOLD}" font-family="serif" font-size="28" font-weight="600" letter-spacing="3" opacity="0.7">S33D</text>
  <text x="520" y="555" fill="${MUTED}" font-family="serif" font-size="14" letter-spacing="1.5" opacity="0.5">The Living Atlas of Ancient Friends</text>

  <!-- Bottom gold line accent -->
  <rect x="520" y="580" width="200" height="2" rx="1" fill="url(#gold)" opacity="0.4"/>
</svg>`;
}

function staffCardSVG(opts: {
  code: string;
  species: string;
  isOrigin: boolean;
  photoUrl?: string | null;
}): string {
  const badge = opts.isOrigin ? "Origin Staff" : "Circle Staff";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#0f1309"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="#e8c547"/>
    </linearGradient>
    <clipPath id="staffClip">
      <rect x="60" y="60" width="400" height="510" rx="16"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="${GOLD}" stroke-opacity="0.15" stroke-width="1"/>

  <!-- Staff image -->
  ${opts.photoUrl ? `
  <rect x="60" y="60" width="400" height="510" rx="16" fill="${CARD_BG}"/>
  <image href="${esc(opts.photoUrl)}" x="60" y="60" width="400" height="510" clip-path="url(#staffClip)" preserveAspectRatio="xMidYMid slice"/>
  ` : `
  <rect x="60" y="60" width="400" height="510" rx="16" fill="${CARD_BG}"/>
  <text x="260" y="320" text-anchor="middle" fill="${MUTED}" font-family="serif" font-size="64" opacity="0.3">🪄</text>
  `}

  <!-- Badge -->
  <rect x="520" y="80" width="${badge.length * 13 + 32}" height="32" rx="16" fill="${GOLD}" fill-opacity="0.15" stroke="${GOLD}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="${520 + (badge.length * 13 + 32) / 2}" y="102" text-anchor="middle" fill="${GOLD}" font-family="sans-serif" font-size="14" font-weight="500" letter-spacing="1.5">${esc(badge.toUpperCase())}</text>

  <!-- Staff code -->
  <text x="520" y="175" fill="${GOLD_LIGHT}" font-family="serif" font-size="42" font-weight="600" letter-spacing="1">
    ${esc(opts.code.toUpperCase())}
  </text>

  <!-- Species -->
  <text x="520" y="215" fill="${MUTED}" font-family="serif" font-size="24" font-style="italic">
    ${esc(opts.species)}
  </text>

  <line x1="520" y1="245" x2="780" y2="245" stroke="${GOLD}" stroke-opacity="0.2" stroke-width="1"/>

  <!-- S33D branding -->
  <text x="520" y="530" fill="${GOLD}" font-family="serif" font-size="28" font-weight="600" letter-spacing="3" opacity="0.7">S33D</text>
  <text x="520" y="555" fill="${MUTED}" font-family="serif" font-size="14" letter-spacing="1.5" opacity="0.5">Staff Room · Ancient Friends</text>

  <rect x="520" y="580" width="200" height="2" rx="1" fill="url(#gold)" opacity="0.4"/>
</svg>`;
}

/* ── Main handler ───────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "tree";
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id parameter", { status: 400, headers: corsHeaders });
  }

  let svg: string;

  if (type === "staff") {
    svg = await buildStaffCard(id);
  } else {
    svg = await buildTreeCard(id);
  }

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});

async function buildTreeCard(id: string): Promise<string> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const [treeRes, photoRes, mintRes] = await Promise.all([
      supabase.from("trees").select("name, species, nation").eq("id", id).maybeSingle(),
      supabase.from("offerings").select("media_url").eq("tree_id", id).eq("type", "photo").not("media_url", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("chain_anchors").select("id").eq("asset_id", id).eq("status", "confirmed").limit(1).maybeSingle(),
    ]);

    return treeCardSVG({
      name: treeRes.data?.name || "Ancient Friend",
      species: treeRes.data?.species || "Unknown species",
      location: treeRes.data?.nation || "Unknown location",
      isMinted: !!mintRes.data,
      photoUrl: photoRes.data?.media_url || null,
    });
  } catch {
    return treeCardSVG({
      name: "Ancient Friend",
      species: "Unknown species",
      location: "Unknown location",
      isMinted: false,
    });
  }
}

async function buildStaffCard(code: string): Promise<string> {
  const APP_URL = "https://ancient-roots-map.lovable.app";
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

  const isCircle = code.includes("-C") || code.includes("-c");
  const base = code.split("-")[0].toUpperCase();
  const species = SPECIES_NAMES[base] || code;

  const lower = code.toLowerCase();
  let imgPath: string;
  if (isCircle) {
    const normalized = lower.replace(/c(\d+)s(\d+)/, "c$1-s$2");
    imgPath = `${APP_URL}/images/staffs/${normalized}.jpeg`;
  } else {
    imgPath = `${APP_URL}/images/staffs/${lower}.jpeg`;
  }

  return staffCardSVG({
    code,
    species,
    isOrigin: !isCircle,
    photoUrl: imgPath,
  });
}

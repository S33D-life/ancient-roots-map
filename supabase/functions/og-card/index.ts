/**
 * og-card — Generate 1200×630 Open Graph card images as SVG.
 *
 * Usage:
 *   GET /functions/v1/og-card?type=tree&id=<uuid>
 *   GET /functions/v1/og-card?type=staff&id=<code>
 *   GET /functions/v1/og-card?type=lineage&id=<uuid>   (staff-linked NFTree)
 *
 * The "lineage" type auto-detects staff linkage from ceremony_logs/chain_anchors.
 * The "tree" type also auto-upgrades to lineage card when staff data is found.
 *
 * Returns: SVG image (1200×630).
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Palette ────────────────────────────────────────────── */
const BG_DARK = "#0f1309";
const BG = "#1a1f14";
const GOLD = "#d4a017";
const GOLD_LIGHT = "#f5e6b8";
const MUTED = "#8a9178";
const WHITE = "#faf8f0";

/* ── SVG Helpers ────────────────────────────────────────── */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

/** Shared <defs> block for all card types */
function svgDefs(opts: { hasTreePhoto: boolean; hasStaffInset?: boolean }): string {
  return `<defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${BG_DARK}"/>
    </linearGradient>
    <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#e8c547" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="photoFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BG}" stop-opacity="0"/>
      <stop offset="70%" stop-color="${BG}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="photoFadeBottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG}" stop-opacity="0"/>
      <stop offset="80%" stop-color="${BG}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0.85"/>
    </linearGradient>
    ${opts.hasTreePhoto ? `<clipPath id="photoClip"><rect x="0" y="0" width="640" height="630" rx="0"/></clipPath>` : ""}
    ${opts.hasStaffInset ? `
    <clipPath id="staffInsetClip"><circle cx="1100" cy="100" r="52"/></clipPath>
    <filter id="insetShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    ` : ""}
  </defs>`;
}

function brandingBlock(x: number, y: number): string {
  return `
    <text x="${x}" y="${y}" fill="${GOLD}" font-family="'Georgia','Times New Roman',serif" font-size="26" font-weight="700" letter-spacing="4" opacity="0.8">S33D</text>
    <text x="${x}" y="${y + 22}" fill="${MUTED}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="11" letter-spacing="2" opacity="0.5">THE LIVING ATLAS</text>
  `;
}

function badge(text: string, x: number, y: number, color: string): string {
  const w = text.length * 9.5 + 28;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="28" rx="14" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="0.8" stroke-opacity="0.5"/>
    <text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" fill="${color}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="11" font-weight="600" letter-spacing="2">${esc(text)}</text>
  `;
}

function photoBlock(photoUrl: string): string {
  return `
  <image href="${esc(photoUrl)}" x="0" y="0" width="640" height="630" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="640" height="630" fill="url(#photoFade)"/>
  <rect x="0" y="0" width="640" height="630" fill="url(#photoFadeBottom)"/>`;
}

function noPhotoBlock(emoji: string): string {
  return `
  <circle cx="320" cy="315" r="180" fill="none" stroke="${GOLD}" stroke-width="0.5" stroke-opacity="0.08"/>
  <circle cx="320" cy="315" r="120" fill="none" stroke="${GOLD}" stroke-width="0.5" stroke-opacity="0.06"/>
  <text x="320" y="330" text-anchor="middle" fill="${MUTED}" font-family="serif" font-size="72" opacity="0.12">${emoji}</text>`;
}

/* ── Tree Card (Ancient Friend / NFTree) ────────────────── */

interface TreeCardData {
  name: string;
  species: string;
  location: string;
  isMinted: boolean;
  staffCode: string | null;
  staffName: string | null;
  staffSpecies: string | null;
  photoUrl: string | null;
}

function treeCardSVG(d: TreeCardData): string {
  const hasPhoto = !!d.photoUrl;
  const hasStaff = !!(d.staffCode || d.staffName);
  const badgeText = d.isMinted ? "NFTREE" : "ANCIENT FRIEND";
  const badgeColor = d.isMinted ? "#c9a227" : GOLD;
  const textX = hasPhoto ? 680 : 120;
  const textMaxW = hasPhoto ? 460 : 960;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${svgDefs({ hasTreePhoto: hasPhoto })}
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  ${hasPhoto ? photoBlock(d.photoUrl!) : noPhotoBlock("🌳")}

  <rect x="16" y="16" width="1168" height="598" rx="20" fill="none" stroke="${GOLD}" stroke-opacity="0.08" stroke-width="0.5"/>

  ${badge(badgeText, textX, 100, badgeColor)}

  <text x="${textX}" y="${hasPhoto ? 185 : 200}" fill="${WHITE}" font-family="'Georgia','Times New Roman',serif" font-size="${d.name.length > 20 ? 36 : 44}" font-weight="600" letter-spacing="0.5">
    ${esc(truncate(d.name, 26))}
  </text>

  ${d.species !== "Unknown species" ? `
  <text x="${textX}" y="${hasPhoto ? 225 : 245}" fill="${GOLD_LIGHT}" font-family="'Georgia','Times New Roman',serif" font-size="22" font-style="italic" opacity="0.85">
    ${esc(truncate(d.species, 40))}
  </text>` : ""}

  <rect x="${textX}" y="${hasPhoto ? 250 : 270}" width="${Math.min(280, textMaxW)}" height="1" rx="0.5" fill="url(#goldLine)"/>

  ${d.location !== "Unknown location" ? `
  <text x="${textX}" y="${hasPhoto ? 290 : 310}" fill="${MUTED}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="16" letter-spacing="0.5">
    ${esc(truncate(d.location, 44))}
  </text>` : ""}

  ${hasStaff ? `
  <text x="${textX}" y="${hasPhoto ? 325 : 345}" fill="${GOLD}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="14" opacity="0.6" letter-spacing="0.5">
    Minted with ${esc(d.staffName || d.staffCode || "")}
  </text>` : ""}

  ${brandingBlock(textX, 530)}
  <rect x="${textX}" y="585" width="160" height="1.5" rx="0.75" fill="url(#goldLine)"/>
</svg>`;
}

/* ── Staff-linked Lineage Card ──────────────────────────── */

/**
 * The lineage card is a premium variant that visually connects
 * tree + staff + S33D ecosystem. It uses:
 * - Tree photo as primary (left half)
 * - Staff inset medallion (gold enzo ring, top-right)
 * - Dual-badge system (NFTree + Staff identity)
 * - Lineage footer strip
 */
function lineageCardSVG(d: TreeCardData): string {
  const hasPhoto = !!d.photoUrl;
  const staffImgUrl = d.staffCode ? resolveStaffImageUrl(d.staffCode) : null;
  const hasStaffInset = !!staffImgUrl;
  const textX = hasPhoto ? 680 : 120;

  // Staff display
  const staffDisplay = d.staffName || d.staffCode || "";
  const staffSpeciesDisplay = d.staffSpecies
    ? SPECIES_NAMES[d.staffSpecies.split("-")[0]?.toUpperCase()] || d.staffSpecies
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${svgDefs({ hasTreePhoto: hasPhoto, hasStaffInset })}
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  ${hasPhoto ? photoBlock(d.photoUrl!) : noPhotoBlock("🌳")}

  <!-- Outer frame -->
  <rect x="16" y="16" width="1168" height="598" rx="20" fill="none" stroke="${GOLD}" stroke-opacity="0.1" stroke-width="0.5"/>

  <!-- Staff inset medallion (top-right enzo ring) -->
  ${hasStaffInset ? `
  <circle cx="1100" cy="100" r="56" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="1100" cy="100" r="53" fill="${BG}" fill-opacity="0.6"/>
  <image href="${esc(staffImgUrl!)}" x="1048" y="48" width="104" height="104" clip-path="url(#staffInsetClip)" preserveAspectRatio="xMidYMid slice" filter="url(#insetShadow)"/>
  <circle cx="1100" cy="100" r="54" fill="none" stroke="${GOLD}" stroke-width="1" stroke-opacity="0.5"/>
  ` : ""}

  <!-- Primary badge: NFTREE -->
  ${badge("NFTREE", textX, 85, "#c9a227")}

  <!-- Tree name -->
  <text x="${textX}" y="170" fill="${WHITE}" font-family="'Georgia','Times New Roman',serif" font-size="${d.name.length > 20 ? 34 : 42}" font-weight="600" letter-spacing="0.5">
    ${esc(truncate(d.name, 26))}
  </text>

  <!-- Species -->
  ${d.species !== "Unknown species" ? `
  <text x="${textX}" y="210" fill="${GOLD_LIGHT}" font-family="'Georgia','Times New Roman',serif" font-size="21" font-style="italic" opacity="0.85">
    ${esc(truncate(d.species, 40))}
  </text>` : ""}

  <!-- Gold divider -->
  <rect x="${textX}" y="232" width="280" height="1" rx="0.5" fill="url(#goldLine)"/>

  <!-- Location -->
  ${d.location !== "Unknown location" ? `
  <text x="${textX}" y="268" fill="${MUTED}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="15" letter-spacing="0.5">
    ${esc(truncate(d.location, 44))}
  </text>` : ""}

  <!-- ═══ Staff lineage strip ═══ -->
  <!-- Subtle background shelf -->
  <rect x="${textX}" y="320" width="440" height="72" rx="12" fill="${GOLD}" fill-opacity="0.04" stroke="${GOLD}" stroke-width="0.5" stroke-opacity="0.1"/>

  <!-- Lineage label -->
  <text x="${textX + 20}" y="344" fill="${GOLD}" font-family="'Helvetica Neue','Arial',sans-serif" font-size="10" font-weight="600" letter-spacing="2.5" opacity="0.5">STAFF LINEAGE</text>

  <!-- Staff name / code -->
  <text x="${textX + 20}" y="370" fill="${GOLD_LIGHT}" font-family="'Georgia','Times New Roman',serif" font-size="20" font-weight="600" letter-spacing="0.5">
    ${esc(truncate(staffDisplay, 28))}
  </text>

  <!-- Staff species -->
  ${staffSpeciesDisplay ? `
  <text x="${textX + 20}" y="385" fill="${MUTED}" font-family="'Georgia','Times New Roman',serif" font-size="13" font-style="italic" opacity="0.7">
    ${esc(staffSpeciesDisplay)}
  </text>` : ""}

  <!-- Small key icon near staff name -->
  <text x="${textX + 410}" y="370" text-anchor="end" fill="${GOLD}" font-family="serif" font-size="20" opacity="0.25">⚷</text>

  <!-- S33D branding -->
  ${brandingBlock(textX, 510)}

  <!-- Lineage footer accent (double gold line) -->
  <rect x="${textX}" y="570" width="200" height="1" rx="0.5" fill="url(#goldLine)" opacity="0.6"/>
  <rect x="${textX}" y="575" width="120" height="1" rx="0.5" fill="url(#goldLine)" opacity="0.3"/>
</svg>`;
}

/* ── Staff Card ─────────────────────────────────────────── */

interface StaffCardData {
  code: string;
  species: string;
  isOrigin: boolean;
  photoUrl: string | null;
}

function staffCardSVG(d: StaffCardData): string {
  const hasPhoto = !!d.photoUrl;
  const badgeText = d.isOrigin ? "ORIGIN STAFF" : "CIRCLE STAFF";
  const textX = hasPhoto ? 680 : 120;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${svgDefs({ hasTreePhoto: hasPhoto })}
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  ${hasPhoto ? photoBlock(d.photoUrl!) : noPhotoBlock("⚡")}

  <rect x="16" y="16" width="1168" height="598" rx="20" fill="none" stroke="${GOLD}" stroke-opacity="0.08" stroke-width="0.5"/>

  ${badge(badgeText, textX, 100, GOLD)}

  <text x="${textX}" y="185" fill="${WHITE}" font-family="'Georgia','Times New Roman',serif" font-size="44" font-weight="600" letter-spacing="1.5">
    ${esc(d.code.toUpperCase())}
  </text>

  <text x="${textX}" y="225" fill="${GOLD_LIGHT}" font-family="'Georgia','Times New Roman',serif" font-size="24" font-style="italic" opacity="0.85">
    ${esc(d.species)}
  </text>

  <rect x="${textX}" y="250" width="280" height="1" rx="0.5" fill="url(#goldLine)"/>

  ${brandingBlock(textX, 530)}
  <rect x="${textX}" y="585" width="160" height="1.5" rx="0.75" fill="url(#goldLine)"/>
</svg>`;
}

/* ── Data fetchers ──────────────────────────────────────── */

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

function resolveStaffImageUrl(code: string): string {
  const lower = code.toLowerCase();
  if (lower.includes("-c")) {
    const normalized = lower.replace(/c(\d+)s(\d+)/, "c$1-s$2");
    return `${APP_URL}/images/staffs/${normalized}.jpeg`;
  }
  return `${APP_URL}/images/staffs/${lower}.jpeg`;
}

async function fetchTreeData(id: string): Promise<TreeCardData> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const [treeRes, photoRes, mintRes, staffRes] = await Promise.all([
      supabase.from("trees").select("name, species, nation").eq("id", id).maybeSingle(),
      supabase
        .from("offerings").select("media_url")
        .eq("tree_id", id).eq("type", "photo")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from("chain_anchors").select("id")
        .eq("asset_id", id).eq("status", "confirmed")
        .limit(1).maybeSingle(),
      // Get staff linkage — ceremony_logs currently has no tree_id,
      // so we look for any binding ceremony by the tree's creator
      supabase
        .from("ceremony_logs")
        .select("staff_code, staff_name, staff_species")
        .eq("ceremony_type", "binding")
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle(),
    ]);

    return {
      name: treeRes.data?.name || "Ancient Friend",
      species: treeRes.data?.species || "Unknown species",
      location: treeRes.data?.nation || "Unknown location",
      isMinted: !!mintRes.data,
      staffCode: staffRes.data?.staff_code || null,
      staffName: staffRes.data?.staff_name || null,
      staffSpecies: staffRes.data?.staff_species || null,
      photoUrl: photoRes.data?.media_url || null,
    };
  } catch {
    return {
      name: "Ancient Friend", species: "Unknown species",
      location: "Unknown location", isMinted: false,
      staffCode: null, staffName: null, staffSpecies: null, photoUrl: null,
    };
  }
}

function resolveStaffData(code: string): StaffCardData {
  const isCircle = code.includes("-C") || code.includes("-c");
  const base = code.split("-")[0].toUpperCase();
  const species = SPECIES_NAMES[base] || code;
  return { code, species, isOrigin: !isCircle, photoUrl: resolveStaffImageUrl(code) };
}

/* ── Card selection logic ───────────────────────────────── */

/**
 * Determine which card variant to render:
 *   1. lineage — staff-linked & minted, with staff data
 *   2. nftree  — minted but no staff data
 *   3. tree    — standard Ancient Friend
 */
function selectCardSVG(d: TreeCardData): string {
  const hasStaff = !!(d.staffCode || d.staffName);
  if (d.isMinted && hasStaff) return lineageCardSVG(d);
  return treeCardSVG(d);
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
    svg = staffCardSVG(resolveStaffData(id));
  } else if (type === "lineage") {
    // Force lineage card even if not fully minted
    const data = await fetchTreeData(id);
    svg = lineageCardSVG(data);
  } else {
    // "tree" — auto-selects between tree / lineage based on data
    svg = selectCardSVG(await fetchTreeData(id));
  }

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});

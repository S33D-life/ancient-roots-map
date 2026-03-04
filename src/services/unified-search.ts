/**
 * Unified Search Service — One Search Brain for all of S33D.
 * Sources: Trees, Countries, Bioregions, Heartwood rooms, Staffs,
 *          Wanderer profiles, Council, Library, Support.
 */
import { supabase } from "@/integrations/supabase/client";

/* ── Result Schema ── */
export type SearchResultType =
  | "tree"
  | "grove"
  | "country"
  | "region"
  | "bioregion"
  | "heartwood_room"
  | "support_page"
  | "wanderer_profile"
  | "staff"
  | "council_record"
  | "library_item"
  | "offering"
  | "species";

export interface MapContext {
  lat?: number;
  lng?: number;
  zoom?: number;
  treeId?: string;
  region?: string;
  species?: string;
  collection?: string;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  keywords?: string[];
  url: string;
  mapContext?: MapContext;
  meta?: Record<string, unknown>;
  score: number; // relevance (higher = better)
  emoji?: string;
}

export type SearchFilter =
  | "all"
  | "trees"
  | "places"
  | "heartwood"
  | "staffs"
  | "wanderers"
  | "council"
  | "library"
  | "support";

export const FILTER_LABELS: Record<SearchFilter, string> = {
  all: "All",
  trees: "Trees",
  places: "Places",
  heartwood: "Heartwood",
  staffs: "Staffs",
  wanderers: "Wanderers",
  council: "Council",
  library: "Library",
  support: "Support",
};

const FILTER_TYPES: Record<SearchFilter, SearchResultType[]> = {
  all: [],
  trees: ["tree", "species", "grove"],
  places: ["country", "region", "bioregion", "grove"],
  heartwood: ["heartwood_room"],
  staffs: ["staff"],
  wanderers: ["wanderer_profile"],
  council: ["council_record"],
  library: ["library_item", "offering"],
  support: ["support_page"],
};

/* ── Static Indices ── */

const HEARTWOOD_ROOMS: SearchResult[] = [
  { id: "room-staff", type: "heartwood_room", title: "🪵 Staff Room", subtitle: "144 Sacred Staffs", url: "/library", keywords: ["staff", "nft", "wand", "og"], score: 0, emoji: "🪵" },
  { id: "room-greenhouse", type: "heartwood_room", title: "🌱 Greenhouse", subtitle: "Houseplants & Saplings", url: "/library", keywords: ["greenhouse", "plant", "sapling", "nursery"], score: 0, emoji: "🌱" },
  { id: "room-wishlist", type: "heartwood_room", title: "⭐ Wishing Tree", subtitle: "Trees you dream to visit", url: "/library", keywords: ["wish", "dream", "bucket list"], score: 0, emoji: "⭐" },
  { id: "room-creators", type: "heartwood_room", title: "🎨 Creator's Path", subtitle: "Your creative journey", url: "/library", keywords: ["creator", "art", "journey", "path"], score: 0, emoji: "🎨" },
  { id: "room-press", type: "heartwood_room", title: "🪶 Printing Press", subtitle: "Where reading becomes writing", url: "/library", keywords: ["press", "write", "scroll", "book"], score: 0, emoji: "🪶" },
  { id: "room-gallery", type: "heartwood_room", title: "🗺 Map Room", subtitle: "Ancient Friends Atlas", url: "/map", keywords: ["map", "atlas", "gallery", "explore"], score: 0, emoji: "🗺" },
  { id: "room-music", type: "heartwood_room", title: "🎵 Music Room", subtitle: "Tree Radio", url: "/library", keywords: ["music", "song", "radio", "listen"], score: 0, emoji: "🎵" },
  { id: "room-seed-cellar", type: "heartwood_room", title: "📦 Seed Cellar", subtitle: "Living Data Archive", url: "/library", keywords: ["seed", "cellar", "data", "archive", "export"], score: 0, emoji: "📦" },
  { id: "room-resources", type: "heartwood_room", title: "📖 Tree Resources", subtitle: "Project Directory", url: "/library", keywords: ["resource", "directory", "project", "link"], score: 0, emoji: "📖" },
  { id: "room-ledger", type: "heartwood_room", title: "📜 Scrolls & Ledger", subtitle: "Council Records", url: "/library", keywords: ["ledger", "scroll", "record", "stat"], score: 0, emoji: "📜" },
];

const SUPPORT_PAGES: SearchResult[] = [
  { id: "support-bugs", type: "support_page", title: "🐞 Report a Bug", subtitle: "Found something broken?", url: "/bug-garden", keywords: ["bug", "report", "broken", "error"], score: 0, emoji: "🐞" },
  { id: "support-suggest", type: "support_page", title: "✨ Suggest Improvement", subtitle: "Ideas to make S33D better", url: "/bug-garden", keywords: ["suggest", "improvement", "idea", "feedback"], score: 0, emoji: "✨" },
  { id: "support-contact", type: "support_page", title: "💬 Contact", subtitle: "Reach the grove keepers", url: "/support", keywords: ["contact", "email", "help", "support"], score: 0, emoji: "💬" },
  { id: "support-hearts", type: "support_page", title: "❤️ How Hearts Work", subtitle: "Understand the value system", url: "/how-hearts-work", keywords: ["heart", "value", "earn", "token"], score: 0, emoji: "❤️" },
  { id: "support-faq-add-tree", type: "support_page", title: "FAQ: How to add a tree", subtitle: "Navigate to Map → tap '+'", url: "/support", keywords: ["add", "tree", "how", "faq"], score: 0, emoji: "❓" },
  { id: "support-faq-offerings", type: "support_page", title: "FAQ: What are Offerings?", subtitle: "Photos, notes, birdsong, observations", url: "/support", keywords: ["offering", "photo", "note", "faq"], score: 0, emoji: "❓" },
  { id: "support-faq-signin", type: "support_page", title: "FAQ: Do I need to sign in?", subtitle: "Browsing is open; contributing needs an account", url: "/support", keywords: ["sign in", "login", "account", "register", "faq"], score: 0, emoji: "❓" },
  { id: "support-main", type: "support_page", title: "🛟 Support Hub", subtitle: "FAQs, donations, volunteering", url: "/support", keywords: ["support", "help", "faq", "donate", "volunteer"], score: 0, emoji: "🛟" },
];

const COUNTRY_PAGES: SearchResult[] = [
  { id: "atlas-main", type: "country", title: "🌍 The Atlas", subtitle: "Explore all countries", url: "/atlas", keywords: ["atlas", "countries", "explore", "world"], score: 0, emoji: "🌍" },
  // Top countries — static for speed; DB search adds more
  ...(["switzerland", "united-kingdom", "japan", "germany", "france", "italy", "spain", "portugal", "greece", "turkey", "india", "australia", "new-zealand", "canada", "united-states", "brazil", "mexico", "ireland", "norway", "sweden"] as const).map(slug => ({
    id: `country-${slug}`,
    type: "country" as const,
    title: `🌍 ${slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}`,
    subtitle: "Country portal",
    url: `/atlas/${slug}`,
    keywords: [slug.replace(/-/g, " "), slug],
    score: 0,
    emoji: "🌍",
  })),
];

/* ── Scoring ── */
function scoreMatch(query: string, item: { title: string; subtitle?: string; keywords?: string[] }): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle || "").toLowerCase();

  // Exact title match
  if (title === q) return 100;
  // Title starts with query
  if (title.startsWith(q)) return 80;
  // Title contains query
  if (title.includes(q)) return 60;
  // Subtitle match
  if (subtitle.includes(q)) return 40;
  // Keyword match
  if (item.keywords?.some(k => k.toLowerCase().includes(q))) return 30;
  return 0;
}

// Type priority boost (added to score)
const TYPE_BOOST: Record<SearchResultType, number> = {
  tree: 10,
  grove: 8,
  country: 7,
  region: 7,
  bioregion: 6,
  heartwood_room: 5,
  species: 5,
  staff: 4,
  wanderer_profile: 3,
  council_record: 2,
  library_item: 2,
  offering: 1,
  support_page: 0,
};

/* ── Main Search Function ── */
export async function unifiedSearch(
  query: string,
  filter: SearchFilter = "all",
  limit = 20,
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const q = query.trim();
  const results: SearchResult[] = [];
  const filterTypes = FILTER_TYPES[filter];
  const shouldInclude = (type: SearchResultType) =>
    filter === "all" || filterTypes.includes(type);

  // 1. Static indices (instant — no DB call)
  if (shouldInclude("heartwood_room")) {
    for (const room of HEARTWOOD_ROOMS) {
      const s = scoreMatch(q, room);
      if (s > 0) results.push({ ...room, score: s + TYPE_BOOST.heartwood_room });
    }
  }
  if (shouldInclude("support_page")) {
    for (const page of SUPPORT_PAGES) {
      const s = scoreMatch(q, page);
      if (s > 0) results.push({ ...page, score: s + TYPE_BOOST.support_page });
    }
  }
  if (shouldInclude("country")) {
    for (const page of COUNTRY_PAGES) {
      const s = scoreMatch(q, page);
      if (s > 0) results.push({ ...page, score: s + TYPE_BOOST.country });
    }
  }

  // 2. Database queries (parallel)
  const dbPromises: Promise<void>[] = [];

  // Trees
  if (shouldInclude("tree")) {
    dbPromises.push(
      supabase
        .from("trees")
        .select("id, name, species, nation, latitude, longitude")
        .or(`name.ilike.%${q}%,species.ilike.%${q}%,what3words.ilike.%${q}%`)
        .limit(10)
        .then(({ data }) => {
          if (data) {
            for (const t of data) {
              const s = scoreMatch(q, { title: t.name, subtitle: t.species || "", keywords: [t.nation || ""] });
              results.push({
                id: `tree-${t.id}`,
                type: "tree",
                title: t.name,
                subtitle: [t.species, t.nation].filter(Boolean).join(" · "),
                url: `/tree/${t.id}`,
                mapContext: { lat: t.latitude, lng: t.longitude, treeId: t.id, zoom: 16 },
                score: s + TYPE_BOOST.tree,
                emoji: "🌳",
              });
            }
          }
        }),
    );
  }

  // Species (distinct)
  if (shouldInclude("species") || shouldInclude("tree")) {
    dbPromises.push(
      supabase
        .from("trees")
        .select("species")
        .ilike("species", `%${q}%`)
        .limit(10)
        .then(({ data }) => {
          if (data) {
            const unique = [...new Set(data.map(d => d.species).filter(Boolean))];
            for (const sp of unique) {
              results.push({
                id: `species-${sp}`,
                type: "species",
                title: sp!,
                subtitle: "Species",
                url: `/map?species=${encodeURIComponent(sp!)}`,
                mapContext: { species: sp! },
                score: scoreMatch(q, { title: sp! }) + TYPE_BOOST.species,
                emoji: "🍃",
              });
            }
          }
        }),
    );
  }

  // Bioregions
  if (shouldInclude("bioregion")) {
    dbPromises.push(
      supabase
        .from("bio_regions")
        .select("id, name, type, center_lat, center_lon, countries")
        .or(`name.ilike.%${q}%,type.ilike.%${q}%`)
        .limit(8)
        .then(({ data }) => {
          if (data) {
            for (const r of data) {
              results.push({
                id: `bioregion-${r.id}`,
                type: "bioregion",
                title: `🏔 ${r.name}`,
                subtitle: [r.type, ...(r.countries || [])].filter(Boolean).join(" · "),
                url: `/atlas/bioregion/${r.id}`,
                mapContext: r.center_lat && r.center_lon ? { lat: r.center_lat, lng: r.center_lon, zoom: 8 } : undefined,
                score: scoreMatch(q, { title: r.name }) + TYPE_BOOST.bioregion,
                emoji: "🏔",
              });
            }
          }
        }),
    );
  }

  // Wanderer profiles (public only)
  if (shouldInclude("wanderer_profile")) {
    dbPromises.push(
      supabase
        .rpc("search_discoverable_profiles", { search_query: q, result_limit: 6 })
        .then(({ data }) => {
          if (data) {
            for (const p of data as any[]) {
              results.push({
                id: `wanderer-${p.id}`,
                type: "wanderer_profile",
                title: p.full_name || "Wanderer",
                subtitle: p.bio ? p.bio.slice(0, 60) : "Wanderer profile",
                url: `/wanderer/${p.id}`,
                score: scoreMatch(q, { title: p.full_name || "" }) + TYPE_BOOST.wanderer_profile,
                emoji: "🚶",
              });
            }
          }
        }),
    );
  }

  // Councils
  if (shouldInclude("council_record")) {
    dbPromises.push(
      supabase
        .from("councils")
        .select("id, name, scope, slug, description")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(6)
        .then(({ data }) => {
          if (data) {
            for (const c of data) {
              results.push({
                id: `council-${c.id}`,
                type: "council_record",
                title: `🌿 ${c.name}`,
                subtitle: c.scope,
                url: `/council-of-life`,
                score: scoreMatch(q, { title: c.name, subtitle: c.description || "" }) + TYPE_BOOST.council_record,
                emoji: "🌿",
              });
            }
          }
        }),
    );
  }

  // Library — bookshelf entries
  if (shouldInclude("library_item")) {
    dbPromises.push(
      supabase
        .from("bookshelf_entries")
        .select("id, title, author, genre")
        .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
        .eq("visibility", "public")
        .limit(6)
        .then(({ data }) => {
          if (data) {
            for (const b of data) {
              results.push({
                id: `book-${b.id}`,
                type: "library_item",
                title: `📖 ${b.title}`,
                subtitle: b.author,
                url: `/library`,
                score: scoreMatch(q, { title: b.title, subtitle: b.author }) + TYPE_BOOST.library_item,
                emoji: "📖",
              });
            }
          }
        }),
    );
  }

  await Promise.all(dbPromises);

  // 3. Deduplicate by id
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // 4. Sort by score descending
  deduped.sort((a, b) => b.score - a.score);

  return deduped.slice(0, limit);
}

/* ── Group results by type for UI ── */
export function groupResults(results: SearchResult[]): { type: SearchResultType; label: string; items: SearchResult[] }[] {
  const TYPE_LABELS: Record<SearchResultType, string> = {
    tree: "Ancient Trees",
    grove: "Groves",
    country: "Countries & Atlas",
    region: "Regions",
    bioregion: "Bioregions",
    heartwood_room: "Heartwood Rooms",
    support_page: "Support & Help",
    wanderer_profile: "Wanderers",
    staff: "Staffs",
    council_record: "Council of Life",
    library_item: "Library",
    offering: "Offerings",
    species: "Species",
  };

  const groups = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    if (!groups.has(r.type)) groups.set(r.type, []);
    groups.get(r.type)!.push(r);
  }

  return Array.from(groups.entries()).map(([type, items]) => ({
    type,
    label: TYPE_LABELS[type] || type,
    items,
  }));
}

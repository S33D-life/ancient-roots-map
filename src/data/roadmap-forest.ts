/**
 * Living Forest Roadmap — data model
 * Each feature is a natural element in the woodland landscape.
 *
 * Stages map to organic growth:
 *   seed    → planned
 *   sprout  → building
 *   rooted  → live
 *   ancient → mature pillar
 *
 * Categories map to TETOL layers:
 *   ancient-friends  → The Roots (mapping, trees, atlas)
 *   council-of-life  → The Canopy (governance, community)
 *   library          → The Trunk (knowledge, culture)
 *   golden-dream     → The Crown (vision, economy, infrastructure)
 */

export type RoadmapStage = "seed" | "sprout" | "rooted" | "ancient";
export type RoadmapRegion = "roots" | "trunk" | "canopy" | "mycelium";
export type RoadmapStatus = "planned" | "building" | "live";
export type RoadmapCategory = "ancient-friends" | "council-of-life" | "library" | "golden-dream";

export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
  stage: RoadmapStage;
  status: RoadmapStatus;
  region: RoadmapRegion;
  category: RoadmapCategory;
  /** IDs of connected features (mycelial links) */
  connections: string[];
  /** Grid position hint: row 0 = top of forest */
  row: number;
  col: number;
  /** Optional Notion documentation link */
  notionLink?: string;
  /** Optional icon/symbol override */
  symbol?: string;
}

export const STAGE_META: Record<RoadmapStage, { emoji: string; label: string; color: string }> = {
  seed:    { emoji: "🌱", label: "Seed — planned",             color: "hsl(0 0% 55%)" },
  sprout:  { emoji: "🌿", label: "Sprout — building",          color: "hsl(90 55% 45%)" },
  rooted:  { emoji: "🌳", label: "Growth — live",              color: "hsl(42 88% 45%)" },
  ancient: { emoji: "✨", label: "Canopy — mature pillar",     color: "hsl(42 88% 55%)" },
};

export const STATUS_META: Record<RoadmapStatus, { emoji: string; label: string; color: string }> = {
  planned:  { emoji: "🌱", label: "Planned",  color: "hsl(0 0% 55%)" },
  building: { emoji: "🔨", label: "Building", color: "hsl(42 90% 55%)" },
  live:     { emoji: "✅", label: "Live",     color: "hsl(120 55% 45%)" },
};

export const CATEGORY_META: Record<RoadmapCategory, { label: string; emoji: string }> = {
  "ancient-friends":  { label: "Ancient Friends",  emoji: "🌳" },
  "council-of-life":  { label: "Council of Life",  emoji: "🍃" },
  "library":          { label: "Library",           emoji: "📚" },
  "golden-dream":     { label: "Golden Dream",     emoji: "👑" },
};

export const REGION_META: Record<RoadmapRegion, { label: string; description: string }> = {
  roots:    { label: "Roots",    description: "Ancient Friends mapping · tree discovery · map exploration" },
  trunk:    { label: "Trunk",    description: "Heartwood Library · knowledge systems" },
  canopy:   { label: "Canopy",   description: "Council of Life · community gatherings" },
  mycelium: { label: "Mycelium", description: "S33D Hearts economy · game mechanics · rewards" },
};

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  // ═══════════════════════════════════════
  // SEED STAGE — Early prototypes
  // ═══════════════════════════════════════
  { id: "map",           name: "Ancient Friends Map",       description: "Interactive global map of ancient and remarkable trees — the first prototype and heart of the platform.",                        stage: "ancient", status: "live",     region: "roots",    category: "ancient-friends", connections: ["hives", "hearts"],        row: 0, col: 1,  symbol: "🗺️" },
  { id: "council",       name: "Council of Life",           description: "Community governance gatherings for ecological decision-making. Initiated in the earliest S33D sessions.",                     stage: "rooted",  status: "live",     region: "canopy",   category: "council-of-life", connections: ["hearts", "offerings"],    row: 6, col: 1,  symbol: "🏛️" },
  { id: "nft-experiments", name: "Initial NFT Experiments", description: "Early experiments with NFTs as ecological proof-of-care, paving the way for NFTrees.",                                        stage: "rooted",  status: "live",     region: "mycelium", category: "golden-dream",    connections: ["hearts"],                 row: 8, col: 0,  symbol: "🧪" },

  // ═══════════════════════════════════════
  // SPROUT STAGE — Building now
  // ═══════════════════════════════════════
  { id: "staff-room",    name: "Staff Room Patron Launch",  description: "First 36 handcrafted staffs and the initial patrons of the Ancient Friends world.",                                           stage: "sprout",  status: "building", region: "trunk",    category: "library",         connections: ["library"],                row: 4, col: 3,  symbol: "🪄" },
  { id: "add-tree",      name: "Map Expansion",             description: "Community-driven tree mapping with GPS, photos, and species tagging — expanding the atlas worldwide.",                        stage: "rooted",  status: "live",     region: "roots",    category: "ancient-friends", connections: ["map", "hearts"],          row: 1, col: 2,  symbol: "📍" },
  { id: "tree-detail",   name: "Tree Profiles",             description: "Rich detail pages for every mapped tree with photos, history, offerings, and community data.",                                stage: "rooted",  status: "live",     region: "roots",    category: "ancient-friends", connections: ["map", "offerings"],       row: 1, col: 0,  symbol: "🌲" },
  { id: "council-ledger", name: "Council of Life Ledger",   description: "Transparent record of all council decisions and seasonal gathering notes.",                                                   stage: "sprout",  status: "building", region: "canopy",   category: "council-of-life", connections: ["council"],                row: 7, col: 0,  symbol: "📜" },
  { id: "bio-regions",   name: "Bio-Regions Atlas",         description: "Ecological region portals with seasonal calendars and species data.",                                                         stage: "rooted",  status: "live",     region: "roots",    category: "ancient-friends", connections: ["map", "calendar"],        row: 2, col: 1,  symbol: "🌍" },

  // ═══════════════════════════════════════
  // GROWTH STAGE — Active systems
  // ═══════════════════════════════════════
  { id: "hearts",        name: "S33D Hearts",               description: "Living reward currency earned through ecological participation. The lifeblood of the ecosystem.",                             stage: "rooted",  status: "live",     region: "mycelium", category: "golden-dream",    connections: ["offerings", "council"],   row: 8, col: 1,  symbol: "❤️" },
  { id: "hives",         name: "Species Hives",             description: "Species-based community clusters with honeycomb visualisation and Species Hearts.",                                           stage: "rooted",  status: "live",     region: "canopy",   category: "ancient-friends", connections: ["map", "council"],         row: 6, col: 3,  symbol: "🐝" },
  { id: "offerings",     name: "Offerings",                 description: "Creative gifts to trees: songs, stories, photos, birdsong recordings.",                                                      stage: "rooted",  status: "live",     region: "mycelium", category: "ancient-friends", connections: ["hearts", "tree-detail"],  row: 8, col: 3,  symbol: "🎁" },
  { id: "library",       name: "Heartwood Library",         description: "Shared knowledge hub: books, wisdom scrolls, music room, and species research.",                                             stage: "rooted",  status: "live",     region: "trunk",    category: "library",         connections: ["offerings", "wisdom"],    row: 4, col: 1,  symbol: "📚" },
  { id: "companions",    name: "Grove Companions",          description: "Friendship and quest system for collaborative tree care.",                                                                    stage: "sprout",  status: "building", region: "canopy",   category: "council-of-life", connections: ["council"],                row: 7, col: 2,  symbol: "🤝" },
  { id: "harvest",       name: "Harvest Marketplace",       description: "Guardian-managed exchange for seasonal tree produce and seeds.",                                                              stage: "rooted",  status: "live",     region: "roots",    category: "ancient-friends", connections: ["map", "calendar"],        row: 3, col: 0,  symbol: "🍎" },

  // ═══════════════════════════════════════
  // CANOPY STAGE — Vision & future
  // ═══════════════════════════════════════
  { id: "dao",           name: "DAO Governance Layer",      description: "Decentralised autonomous governance for the S33D ecosystem, powered by Influence Tokens.",                                    stage: "seed",    status: "planned",  region: "canopy",   category: "golden-dream",    connections: ["council", "influence"],   row: 7, col: 4,  symbol: "🏗️" },
  { id: "global-map",    name: "Global Tree Expansion",    description: "Scaling tree mapping to every continent with community hubs and bioregional partnerships.",                                    stage: "seed",    status: "planned",  region: "roots",    category: "ancient-friends", connections: ["map", "bio-regions"],     row: 3, col: 2,  symbol: "🌐" },
  { id: "regen-funding", name: "Regenerative Funding",     description: "Using S33D economy to fund real-world reforestation and ancient tree protection projects.",                                    stage: "seed",    status: "planned",  region: "mycelium", category: "golden-dream",    connections: ["hearts", "dao"],          row: 9, col: 2,  symbol: "💚" },
  { id: "love-archive",  name: "Library of Love Archive",  description: "Permanent archive of ecological wisdom, stories, and community contributions.",                                               stage: "seed",    status: "planned",  region: "trunk",    category: "library",         connections: ["library"],                row: 5, col: 4,  symbol: "💛" },

  // ── Supporting systems ──
  { id: "influence",     name: "Influence System",          description: "Weighted community voice earned through sustained ecological action.",                                                         stage: "sprout",  status: "building", region: "mycelium", category: "golden-dream",    connections: ["hearts", "council"],      row: 9, col: 0,  symbol: "⚖️" },
  { id: "calendar",      name: "Cosmic Calendar",           description: "Multi-lens temporal navigation: Gregorian, lunar, indigenous, ecological.",                                                   stage: "rooted",  status: "live",     region: "mycelium", category: "golden-dream",    connections: ["bio-regions"],            row: 10, col: 1, symbol: "🌙" },
  { id: "sync",          name: "Offline Sync & Vault",      description: "Offline-first data persistence and IPFS content anchoring.",                                                                  stage: "sprout",  status: "building", region: "mycelium", category: "golden-dream",    connections: ["hearts"],                 row: 10, col: 3, symbol: "🔐" },
  { id: "wisdom",        name: "Wisdom of the Grove",       description: "Daily rotating quotes and ecological reflections.",                                                                           stage: "rooted",  status: "live",     region: "trunk",    category: "library",         connections: ["library"],                row: 4, col: 3 },
  { id: "bookshelf",     name: "Personal Bookshelves",      description: "Curate your own reading collection linked to trees and councils.",                                                            stage: "rooted",  status: "live",     region: "trunk",    category: "library",         connections: ["library"],                row: 5, col: 0 },
  { id: "pathways",      name: "Pilgrimage Pathways",       description: "Curated walking routes connecting ancient trees across landscapes.",                                                          stage: "sprout",  status: "building", region: "roots",    category: "ancient-friends", connections: ["map", "bio-regions"],     row: 2, col: 3 },
  { id: "groves",        name: "Living Groves",             description: "Clustered tree communities that breathe and pulse on the map.",                                                               stage: "rooted",  status: "live",     region: "roots",    category: "ancient-friends", connections: ["map"],                    row: 3, col: 4 },
  { id: "chat",          name: "Grove Chat",                description: "Real-time messaging rooms anchored to trees and communities.",                                                                stage: "sprout",  status: "building", region: "canopy",   category: "council-of-life", connections: ["council", "hives"],       row: 6, col: 0 },
  { id: "birdsong-ai",   name: "Birdsong AI",               description: "AI-powered bird species identification from audio recordings at trees.",                                                      stage: "seed",    status: "planned",  region: "roots",    category: "ancient-friends", connections: ["offerings", "tree-detail"], row: 2, col: 4 },
  { id: "nftree",        name: "NFTree Minting",            description: "Mint ecological proof-of-care NFTs for mapped trees, linking on-chain to real-world guardianship.",                            stage: "sprout",  status: "building", region: "mycelium", category: "golden-dream",    connections: ["hearts", "nft-experiments"], row: 9, col: 4, symbol: "🌿" },
];
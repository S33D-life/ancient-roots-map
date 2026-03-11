/**
 * Living Forest Roadmap — data model
 * Each feature is a natural element in the woodland landscape.
 */

export type RoadmapStage = "seed" | "sprout" | "rooted" | "ancient";
export type RoadmapRegion = "roots" | "trunk" | "canopy" | "mycelium";

export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
  stage: RoadmapStage;
  region: RoadmapRegion;
  /** IDs of connected features (mycelial links) */
  connections: string[];
  /** Grid position hint: row 0 = top of forest */
  row: number;
  col: number;
}

export const STAGE_META: Record<RoadmapStage, { emoji: string; label: string; color: string }> = {
  seed:    { emoji: "🌱", label: "Seedling — planned",         color: "hsl(var(--muted-foreground))" },
  sprout:  { emoji: "🌿", label: "Sprouting — in development", color: "hsl(90 55% 45%)" },
  rooted:  { emoji: "🌳", label: "Rooted — live",              color: "hsl(var(--primary))" },
  ancient: { emoji: "✨", label: "Ancient — mature pillar",    color: "hsl(var(--sacred-gold))" },
};

export const REGION_META: Record<RoadmapRegion, { label: string; description: string }> = {
  roots:    { label: "Roots",    description: "Ancient Friends mapping · tree discovery · map exploration" },
  trunk:    { label: "Trunk",    description: "Heartwood Library · knowledge systems" },
  canopy:   { label: "Canopy",   description: "Council of Life · community gatherings" },
  mycelium: { label: "Mycelium", description: "S33D Hearts economy · game mechanics · rewards" },
};

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  // ── ROOTS ──
  { id: "map",           name: "Ancient Friends Map",     description: "Interactive global map of ancient and remarkable trees.",                       stage: "rooted",  region: "roots",    connections: ["hives", "hearts"],       row: 0, col: 1 },
  { id: "tree-detail",   name: "Tree Profiles",           description: "Rich detail pages for every mapped tree with photos, history, and offerings.",  stage: "rooted",  region: "roots",    connections: ["map", "offerings"],      row: 1, col: 0 },
  { id: "add-tree",      name: "Add a Tree",              description: "Community-driven tree mapping with GPS, photos, and species tagging.",          stage: "rooted",  region: "roots",    connections: ["map", "hearts"],         row: 1, col: 2 },
  { id: "bio-regions",   name: "Bio-Regions Atlas",       description: "Ecological region portals with seasonal calendars and species data.",           stage: "rooted",  region: "roots",    connections: ["map", "calendar"],       row: 2, col: 1 },
  { id: "pathways",      name: "Pilgrimage Pathways",     description: "Curated walking routes connecting ancient trees across landscapes.",            stage: "sprout",  region: "roots",    connections: ["map", "bio-regions"],    row: 2, col: 3 },
  { id: "groves",        name: "Living Groves",           description: "Clustered tree communities that breathe and pulse on the map.",                 stage: "rooted",  region: "roots",    connections: ["map"],                   row: 3, col: 0 },

  // ── TRUNK ──
  { id: "library",       name: "Heartwood Library",       description: "Shared knowledge hub: books, wisdom scrolls, and species research.",            stage: "rooted",  region: "trunk",    connections: ["offerings", "wisdom"],   row: 4, col: 1 },
  { id: "wisdom",        name: "Wisdom of the Grove",     description: "Daily rotating quotes and ecological reflections.",                             stage: "rooted",  region: "trunk",    connections: ["library"],               row: 4, col: 3 },
  { id: "collaborators", name: "Collaborator Volumes",    description: "Integration of external research documents into the living library.",           stage: "sprout",  region: "trunk",    connections: ["library"],               row: 5, col: 2 },
  { id: "bookshelf",     name: "Personal Bookshelves",    description: "Curate your own reading collection linked to trees and councils.",              stage: "rooted",  region: "trunk",    connections: ["library"],               row: 5, col: 0 },

  // ── CANOPY ──
  { id: "council",       name: "Council of Life",         description: "Community governance gatherings for ecological decision-making.",                stage: "rooted",  region: "canopy",   connections: ["hearts", "offerings"],   row: 6, col: 1 },
  { id: "hives",         name: "Species Hives",           description: "Species-based community clusters with honeycomb visualisation.",                stage: "rooted",  region: "canopy",   connections: ["map", "council"],        row: 6, col: 3 },
  { id: "chat",          name: "Grove Chat",              description: "Real-time messaging rooms anchored to trees and communities.",                  stage: "sprout",  region: "canopy",   connections: ["council", "hives"],      row: 7, col: 2 },
  { id: "companions",    name: "Grove Companions",        description: "Friendship and quest system for collaborative tree care.",                      stage: "sprout",  region: "canopy",   connections: ["council"],               row: 7, col: 0 },

  // ── MYCELIUM ──
  { id: "hearts",        name: "S33D Hearts",             description: "Living reward currency earned through ecological participation.",                stage: "rooted",  region: "mycelium", connections: ["offerings", "council"],  row: 8, col: 1 },
  { id: "offerings",     name: "Offerings",               description: "Creative gifts to trees: songs, stories, photos, birdsong recordings.",         stage: "rooted",  region: "mycelium", connections: ["hearts", "tree-detail"], row: 8, col: 3 },
  { id: "influence",     name: "Influence System",        description: "Weighted community voice earned through sustained ecological action.",           stage: "sprout",  region: "mycelium", connections: ["hearts", "council"],     row: 9, col: 0 },
  { id: "markets",       name: "Cycle Markets",           description: "Prediction markets for ecological events, powered by S33D economy.",            stage: "seed",    region: "mycelium", connections: ["hearts"],                row: 9, col: 2 },
  { id: "calendar",      name: "Cosmic Calendar",         description: "Multi-lens temporal navigation: Gregorian, lunar, indigenous, ecological.",      stage: "rooted",  region: "mycelium", connections: ["bio-regions"],            row: 10, col: 1 },
  { id: "sync",          name: "Offline Sync & Vault",    description: "Offline-first data persistence and IPFS content anchoring.",                     stage: "sprout",  region: "mycelium", connections: ["hearts"],                row: 10, col: 3 },

  // ── FUTURE SEEDS ──
  { id: "honeycomb",     name: "Honeycomb Grid",          description: "Hexagonal tessellation layout for hive communities.",                           stage: "seed",    region: "canopy",   connections: ["hives"],                 row: 7, col: 4 },
  { id: "birdsong-ai",   name: "Birdsong AI",             description: "AI-powered bird species identification from audio recordings at trees.",         stage: "seed",    region: "roots",    connections: ["offerings", "tree-detail"], row: 3, col: 2 },
  { id: "food-cycles",   name: "Food Cycle Network",      description: "Seasonal food production mapping linked to bio-regions.",                       stage: "seed",    region: "trunk",    connections: ["bio-regions", "calendar"], row: 5, col: 4 },
];

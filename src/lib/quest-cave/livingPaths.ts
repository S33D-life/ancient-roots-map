/**
 * Living Paths config — quiet, ecological progression definitions for
 * the Quest Cave. Pure data, no Supabase calls. The shape is intentionally
 * lightweight so each section can later be backed by a real table.
 */

export interface Milestone {
  count: number;
  /** Short ceremonial name, e.g. "First Sapling". */
  seal: string;
  /** Poetic line that appears once the milestone is reached. */
  whisper: string;
}

export interface HiveDefinition {
  id: string;
  /**
   * Preferred: lowercase genus names (e.g. "quercus"). When the canonical
   * resolver returns a scientific lineage, the first token is matched here.
   * This collapses synonyms like "english oak" / "oak" / "Quercus robur"
   * into a single hive count.
   */
  genuses?: string[];
  /**
   * Fallback only — case-insensitive substring matchers against the raw
   * species string. Used when canonical resolution fails.
   */
  speciesMatchers: string[];
  label: string; // "Oak Hive"
  sigil: string; // single-glyph SVG-friendly hint, used by glyph component
  blurb: string;
  toneClass: string; // tailwind classes for the soft tint
}

export interface QuestPath {
  id: string;
  title: string;
  description: string;
  /** When current >= target, the quest is complete. */
  target?: number;
  /** Optional grouping label rendered as a small caption. */
  group?: string;
}

export const SPECIES_MILESTONES: Milestone[] = [
  { count: 3,   seal: "First Three",     whisper: "Three species met. The forest learns your step." },
  { count: 12,  seal: "Twelve Canopies", whisper: "12 species met beneath the changing canopy." },
  { count: 25,  seal: "Quiet Naturalist",whisper: "Twenty-five species remembered by name." },
  { count: 50,  seal: "Half-Hundred",    whisper: "Fifty species — a small library walks with you." },
  { count: 100, seal: "Centuried Eye",   whisper: "A hundred species. A wandering naturalist's gift." },
];

export const HIVE_MILESTONES: number[] = [3, 12, 33, 100, 200];

export const HIVES: HiveDefinition[] = [
  { id: "oak",   label: "Oak Hive",   sigil: "oak",   genuses: ["quercus"], speciesMatchers: ["oak", "quercus"],
    blurb: "Endurance, lineage, the long memory.",
    toneClass: "from-amber-50/40 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10" },
  { id: "yew",   label: "Yew Hive",   sigil: "yew",   genuses: ["taxus"], speciesMatchers: ["yew", "taxus"],
    blurb: "Threshold trees — between worlds.",
    toneClass: "from-emerald-50/40 to-sky-50/30 dark:from-emerald-950/10 dark:to-sky-950/10" },
  { id: "hazel", label: "Hazel Hive", sigil: "hazel", genuses: ["corylus"], speciesMatchers: ["hazel", "corylus"],
    blurb: "Wisdom, listening, gentle counsel.",
    toneClass: "from-amber-50/40 to-amber-100/30 dark:from-amber-950/10 dark:to-amber-900/10" },
  { id: "apple", label: "Apple Hive", sigil: "apple", genuses: ["malus"], speciesMatchers: ["apple", "malus"],
    blurb: "Sweetness, gathering, family table.",
    toneClass: "from-rose-50/40 to-emerald-50/30 dark:from-rose-950/10 dark:to-emerald-950/10" },
  { id: "ash",   label: "Ash Hive",   sigil: "ash",   genuses: ["fraxinus"], speciesMatchers: ["ash ", "fraxinus", "ash,"],
    blurb: "Spear of sky and earth.",
    toneClass: "from-sky-50/40 to-emerald-50/30 dark:from-sky-950/10 dark:to-emerald-950/10" },
  { id: "olive", label: "Olive Hive", sigil: "olive", genuses: ["olea"], speciesMatchers: ["olive", "olea"],
    blurb: "Peace, anointing, lasting light.",
    toneClass: "from-amber-50/40 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10" },
  { id: "beech", label: "Beech Hive", sigil: "beech", genuses: ["fagus"], speciesMatchers: ["beech", "fagus"],
    blurb: "Quiet strength, books of the forest.",
    toneClass: "from-emerald-50/40 to-amber-50/30 dark:from-emerald-950/10 dark:to-amber-950/10" },
];

export const ANCIENT_QUESTS: QuestPath[] = [
  { id: "ancient-3",   title: "Meet 3 Ancient Friends",  description: "Three trees of considerable years.", target: 3,  group: "Elders" },
  { id: "ancient-12",  title: "Meet 12 Ancient Friends", description: "A small council of elders.",         target: 12, group: "Elders" },
  { id: "elder-500",   title: "Sit beneath a tree older than 500 years", description: "A long pause beneath long memory.", group: "Elders" },
  { id: "regions-3",   title: "Visit trees across 3 regions", description: "Carry your steps to different lands.",        group: "Pilgrim" },
  { id: "return-seasons", title: "Return to the same ancient tree in different seasons", description: "Watch one tree turn through the year.", group: "Return" },
];

export const SEASONAL_QUESTS: QuestPath[] = [
  { id: "first-blossom",     title: "Witness first blossom",     description: "Be present when a tree opens." },
  { id: "trees-in-bloom",    title: "Visit trees in bloom",      description: "Three trees in flower, this season.", target: 3 },
  { id: "orchard-wanderer",  title: "Orchard bloom wanderer",    description: "Walk an orchard while it sings." },
  { id: "fruit-bearer",      title: "Fruit bearer",              description: "Note a tree carrying fruit." },
  { id: "autumn-acorns",     title: "Autumn acorn gatherer",     description: "Gather a small handful in autumn." },
  { id: "spring-canopy",     title: "Spring canopy walker",      description: "A walk under the new green." },
];

export const OFFERING_QUESTS: QuestPath[] = [
  { id: "offer-3",      title: "Leave 3 offerings",                description: "Three quiet contributions.",   target: 3 },
  { id: "song-tree",    title: "Offer a song to a tree",           description: "Voice or birdsong, recorded." },
  { id: "recipe-tree",  title: "Share a recipe beneath a tree",    description: "Food remembered with place." },
  { id: "leave-poem",   title: "Leave a poem",                     description: "A few lines for the canopy." },
  { id: "bloom-off",    title: "Create a bloom offering",          description: "Mark a tree's flowering." },
  { id: "tree-radio",   title: "Record Tree Radio",                description: "A short field recording." },
  { id: "send-whisper", title: "Send a whisper",                   description: "A note to the next wanderer." },
  { id: "tend-grove",   title: "Tend a Life Grove",                description: "Plant or visit a Life Grove." },
];

export const ANCIENT_PATHS: QuestPath[] = [
  { id: "drovers",      title: "Drovers' roads",       description: "Trees along old droving routes.",    group: "Routes" },
  { id: "holloways",    title: "Holloway listeners",   description: "Sunken lanes and their elders.",     group: "Routes" },
  { id: "boundary",     title: "Boundary walkers",     description: "Old hedge and parish boundaries.",   group: "Routes" },
  { id: "pilgrim",      title: "Pilgrim companions",   description: "Trees beside pilgrimage paths.",     group: "Routes" },
  { id: "orchard-mem",  title: "Orchard memory routes",description: "Lost orchards remembered.",          group: "Routes" },
];

/** Borrowed Staff resonance lines, keyed by archetype species lower-cased. */
export const STAFF_RESONANCE: Record<string, string> = {
  oak:   "Boundary and gathering trees call to this staff.",
  yew:   "Old thresholds and church paths resonate here.",
  hazel: "Quiet wisdom paths stir nearby.",
  apple: "Orchards and family tables hum to this staff.",
  ash:   "Sky-and-earth trees lean toward this staff.",
  olive: "Anointed places listen for this staff.",
  beech: "Reading-trees and quiet groves answer.",
};

export function nextMilestone(count: number, milestones: Milestone[] | number[]) {
  const list = (milestones as Array<Milestone | number>).map((m) =>
    typeof m === "number" ? m : m.count,
  );
  const next = list.find((n) => count < n);
  return next ?? list[list.length - 1];
}

export function reachedMilestones(count: number, milestones: Milestone[]) {
  return milestones.filter((m) => count >= m.count);
}

export function currentSeason(d = new Date()): "Spring" | "Summer" | "Autumn" | "Winter" {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return "Spring";
  if (m >= 5 && m <= 7) return "Summer";
  if (m >= 8 && m <= 10) return "Autumn";
  return "Winter";
}

export function speciesMatchesHive(species: string | null | undefined, hive: HiveDefinition) {
  if (!species) return false;
  const s = species.toLowerCase();
  return hive.speciesMatchers.some((m) => s.includes(m));
}

/**
 * Seasonal quest config — drives the Spring/Summer/Autumn/Winter
 * panel inside Quest Cave. Pure config; progress is derived elsewhere.
 */
export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export type SeasonalQuestScope = "individual" | "hearth" | "circle" | "collective";

export interface SeasonalQuestSeed {
  id: string;
  scope: SeasonalQuestScope;
  title: string;
  hint: string;
  goal: number;
  /** Which activity field drives derived progress, if any */
  derivedFrom?: "trees" | "offerings" | "whispers" | "visits" | "globalTrees" | "globalOfferings";
}

export interface SeasonMeta {
  key: SeasonKey;
  label: string;
  glyph: string;
  accent: string;
  whisper: string;
}

export const SEASON_META: Record<SeasonKey, SeasonMeta> = {
  spring: {
    key: "spring",
    label: "Spring",
    glyph: "🌸",
    accent: "hsl(335, 55%, 65%)",
    whisper: "Follow the seasons. Meet the trees as they change. Help the Blooming Map awaken.",
  },
  summer: {
    key: "summer",
    label: "Summer",
    glyph: "☀️",
    accent: "hsl(45, 80%, 55%)",
    whisper: "Sit in the long shade. Listen to the canopy.",
  },
  autumn: {
    key: "autumn",
    label: "Autumn",
    glyph: "🍂",
    accent: "hsl(25, 70%, 50%)",
    whisper: "Gather seeds and stories before the great quiet.",
  },
  winter: {
    key: "winter",
    label: "Winter",
    glyph: "❄️",
    accent: "hsl(200, 45%, 60%)",
    whisper: "Bare bones, deep roots. The forest dreams in silence.",
  },
};

export const SEASONAL_QUESTS: Record<SeasonKey, SeasonalQuestSeed[]> = {
  spring: [
    { id: "sp-12-friends",   scope: "individual", title: "Meet 12 Spring Ancient Friends", hint: "Twelve trees in awakening light.", goal: 12, derivedFrom: "trees" },
    { id: "sp-first-bloom",  scope: "individual", title: "Find the First Bloom",            hint: "Mark the first blossom you witness.", goal: 1 },
    { id: "sp-return",       scope: "individual", title: "Return to a Tree in Spring",      hint: "A second visit thickens kinship.", goal: 1, derivedFrom: "visits" },
    { id: "sp-3-songs",      scope: "individual", title: "Offer 3 Spring Songs to Tree Radio", hint: "Songs of awakening for the canopy.", goal: 3, derivedFrom: "offerings" },
    { id: "sp-family-walk",  scope: "hearth",     title: "Family Blossom Walk",             hint: "Walk together. Map what you find.", goal: 1 },
    { id: "sp-seed-jars",    scope: "hearth",     title: "Record 12 Seed Jars or Saplings", hint: "Spring beginnings in the Hearth.", goal: 12 },
    { id: "sp-oak-hive",     scope: "circle",     title: "Oak Hive Spring Awakening",       hint: "Visit an Oak in budburst.", goal: 1 },
    { id: "sp-churchyard",   scope: "circle",     title: "Churchyard Spring Trail",         hint: "Old stones, older roots.", goal: 3 },
    { id: "sp-blooming-map", scope: "collective", title: "Grow the Spring Blooming Map",    hint: "Every encounter awakens a region.", goal: 1000, derivedFrom: "globalTrees" },
    { id: "sp-33-species",   scope: "collective", title: "33 Species Waking",               hint: "A species is awake when it is witnessed.", goal: 33 },
    { id: "sp-1000-encounters", scope: "collective", title: "1,000 Spring Ancient Friend Encounters", hint: "Together we cross the threshold.", goal: 1000, derivedFrom: "globalOfferings" },
  ],
  summer: [],
  autumn: [],
  winter: [],
};

export function currentSeason(date: Date = new Date()): SeasonKey {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** Per-season offering suggestions for the Four Seasons quest. */
export const SEASONAL_OFFERING_HINTS: Record<SeasonKey, string[]> = {
  spring: ["blossom photo", "budburst / first leaf record", "song of awakening", "spring whisper"],
  summer: ["canopy photo", "shade memory", "pollinator note", "summer song"],
  autumn: ["seed / fruit / fungi record", "harvest reflection", "autumn photo"],
  winter: ["bark / silhouette photo", "root reflection", "ancestral whisper", "winter sound"],
};

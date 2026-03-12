/**
 * Sub-region registry for countries with regional portals.
 *
 * Each country can define its own geographic vocabulary via `levelLabel`:
 * Cantons (Switzerland), Islands (Indonesia), States, Provinces, Counties, etc.
 *
 * Used by CountryPortalPage to render a dynamic sub-region grid.
 */

export interface SubRegionEntry {
  /** Display name */
  name: string;
  /** URL slug — appended to /atlas/{country}/ */
  slug: string;
  /** Parent country slug */
  countrySlug: string;
  /** Short tagline */
  tagline: string;
  /** Emoji or icon prefix */
  icon: string;
  /** Province value in research_trees.province (for DB counts) */
  provinceKey: string;
}

/** Geographic vocabulary label per country */
export const SUB_REGION_LABELS: Record<string, string> = {
  switzerland: "Cantons",
  indonesia: "Islands",
  "united-states": "States",
};

const SUB_REGION_REGISTRY: SubRegionEntry[] = [
  // Switzerland — Cantons
  {
    name: "Valais (Wallis)",
    slug: "valais",
    countrySlug: "switzerland",
    tagline: "Alpine Elders of Stone, Ice & Light",
    icon: "🏔️",
    provinceKey: "Valais",
  },
  {
    name: "Zürich (ZH)",
    slug: "zurich",
    countrySlug: "switzerland",
    tagline: "Lakeside limes, urban oaks & Sihl valley elders",
    icon: "🏙️",
    provinceKey: "Zürich",
  },
  {
    name: "Genève (GE)",
    slug: "geneva",
    countrySlug: "switzerland",
    tagline: "Lakeside plane trees, Rhône guardians & park sentinels",
    icon: "⛲",
    provinceKey: "Genève",
  },
  {
    name: "Basel-Stadt (BS)",
    slug: "basel-stadt",
    countrySlug: "switzerland",
    tagline: "Rhine elders, botanical treasures & urban heritage trees",
    icon: "🌉",
    provinceKey: "Basel-Stadt",
  },

  // Indonesia — Island Regions
  {
    name: "Bali & Nusa Tenggara",
    slug: "bali-nusa-tenggara",
    countrySlug: "indonesia",
    tagline: "Sacred groves & volcanic island forests",
    icon: "🌺",
    provinceKey: "Bali & Nusa Tenggara",
  },
  {
    name: "Java",
    slug: "java",
    countrySlug: "indonesia",
    tagline: "Ancient banyans & highland cloud forests",
    icon: "🏛️",
    provinceKey: "Java",
  },
  {
    name: "Sumatra",
    slug: "sumatra",
    countrySlug: "indonesia",
    tagline: "Rainforest giants & volcanic sentinels",
    icon: "🌿",
    provinceKey: "Sumatra",
  },
  {
    name: "Kalimantan (Borneo)",
    slug: "kalimantan",
    countrySlug: "indonesia",
    tagline: "Dipterocarp cathedrals & peatland guardians",
    icon: "🦧",
    provinceKey: "Kalimantan",
  },
  {
    name: "Sulawesi",
    slug: "sulawesi",
    countrySlug: "indonesia",
    tagline: "Endemic forests & coral coast elders",
    icon: "🦜",
    provinceKey: "Sulawesi",
  },
  {
    name: "Maluku",
    slug: "maluku",
    countrySlug: "indonesia",
    tagline: "Spice islands & clove tree heritage",
    icon: "🫚",
    provinceKey: "Maluku",
  },
  {
    name: "Papua",
    slug: "papua",
    countrySlug: "indonesia",
    tagline: "Montane forests & lowland giants",
    icon: "🌴",
    provinceKey: "Papua",
  },

  // United States — States
  {
    name: "Hawaii",
    slug: "hawaii",
    countrySlug: "united-states",
    tagline: "Volcanic groves, sacred ʻōhiʻa lehua & tropical elders",
    icon: "🌺",
    provinceKey: "Hawaii",
  },
  {
    name: "New York",
    slug: "new-york",
    countrySlug: "united-states",
    tagline: "Urban oaks, Hudson Valley elders & Adirondack giants",
    icon: "🗽",
    provinceKey: "New York",
  },
];

export default SUB_REGION_REGISTRY;

export const getSubRegionsByCountry = (countrySlug: string): SubRegionEntry[] =>
  SUB_REGION_REGISTRY.filter(c => c.countrySlug === countrySlug);

export const getSubRegionBySlug = (countrySlug: string, regionSlug: string): SubRegionEntry | undefined =>
  SUB_REGION_REGISTRY.find(c => c.countrySlug === countrySlug && c.slug === regionSlug);

/** Get the geographic vocabulary label for a country (defaults to "Regions") */
export const getSubRegionLabel = (countrySlug: string): string =>
  SUB_REGION_LABELS[countrySlug] || "Regions";

// Backwards-compatible aliases
export type CantonRegistryEntry = SubRegionEntry;
export const getCantonsByCountry = getSubRegionsByCountry;
export const getCantonBySlug = getSubRegionBySlug;

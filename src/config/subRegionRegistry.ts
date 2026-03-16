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
  /** Province value in research_trees.province (for DB counts).
   *  Can be a single string (exact match) or an array of strings (OR match). */
  provinceKey: string | string[];
}

/** Geographic vocabulary label per country */
export const SUB_REGION_LABELS: Record<string, string> = {
  switzerland: "Cantons",
  indonesia: "Islands",
  "united-states": "States",
  "united-kingdom": "Regions",
  italy: "Regions",
};

const SUB_REGION_REGISTRY: SubRegionEntry[] = [
  // Hong Kong — Districts
  {
    name: "Central & Western",
    slug: "central-western",
    countrySlug: "hong-kong",
    tagline: "Stone wall survivors & harbour-front sentinels",
    icon: "🏙️",
    provinceKey: "Central and Western",
  },
  {
    name: "Kowloon",
    slug: "kowloon",
    countrySlug: "hong-kong",
    tagline: "Urban elders among the densest canopy on Earth",
    icon: "🌆",
    provinceKey: ["Kowloon City", "Yau Tsim Mong", "Sham Shui Po", "Wong Tai Sin", "Kwun Tong"],
  },
  {
    name: "New Territories",
    slug: "new-territories",
    countrySlug: "hong-kong",
    tagline: "Fung shui woods, village banyans & hillside pioneers",
    icon: "🌿",
    provinceKey: ["Sha Tin", "Tai Po", "North", "Yuen Long", "Tuen Mun", "Tsuen Wan", "Kwai Tsing", "Sai Kung", "Islands"],
  },
  {
    name: "Hong Kong Island",
    slug: "hong-kong-island",
    countrySlug: "hong-kong",
    tagline: "Botanical garden treasures & Peak District elders",
    icon: "🏝️",
    provinceKey: ["Eastern", "Southern", "Wan Chai", "Central and Western"],
  },

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
  {
    name: "California",
    slug: "california",
    countrySlug: "united-states",
    tagline: "Redwood cathedrals, desert Joshuas & coastal live oaks",
    icon: "🌲",
    provinceKey: "California",
  },
  {
    name: "Washington",
    slug: "washington",
    countrySlug: "united-states",
    tagline: "Olympic rainforest giants, Cascadian firs & urban cedars",
    icon: "🏔️",
    provinceKey: "Washington",
  },

  // United Kingdom — Regions
  {
    name: "England",
    slug: "england",
    countrySlug: "united-kingdom",
    tagline: "Ancient oaks, churchyard yews & royal park veterans",
    icon: "🏰",
    provinceKey: ["East Midlands", "East of England", "London", "North West England", "Northern England & Lake District", "South East England", "South West England", "West Midlands", "Yorkshire & Humber", "Chapter 16", "Chapter 17", "Chapter 18"],
  },
  {
    name: "Wales",
    slug: "wales",
    countrySlug: "united-kingdom",
    tagline: "Sacred yews, Celtic sessile oaks & valley ash elders",
    icon: "🐉",
    provinceKey: "Wales",
  },
  {
    name: "Scotland",
    slug: "scotland",
    countrySlug: "united-kingdom",
    tagline: "Highland pines, Caledonian relicts & ancient yews",
    icon: "🦌",
    provinceKey: ["Scotland — East & Edinburgh", "Scotland — Highlands & Islands", "Scotland — West & Glasgow"],
  },
  {
    name: "Northern Ireland",
    slug: "northern-ireland",
    countrySlug: "united-kingdom",
    tagline: "Dark Hedges beeches, lakeland oaks & ancient ash",
    icon: "☘️",
    provinceKey: "Northern Ireland",
  },

  // Italy — Regions
  {
    name: "Tuscany",
    slug: "tuscany",
    countrySlug: "italy",
    tagline: "Renaissance cypresses, Chianti oaks & sacred olive groves",
    icon: "🏛️",
    provinceKey: "Tuscany",
  },
  {
    name: "Umbria",
    slug: "umbria",
    countrySlug: "italy",
    tagline: "Franciscan olives, valley oaks & Apennine beeches",
    icon: "⛪",
    provinceKey: "Umbria",
  },
  {
    name: "Sicily",
    slug: "sicily",
    countrySlug: "italy",
    tagline: "Etna chestnuts, ancient olives & Hundred Horse Giant",
    icon: "🌋",
    provinceKey: "Sicily",
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

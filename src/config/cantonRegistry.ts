/**
 * Canton / Sub-region registry for countries that have canton-level portals.
 *
 * Used by CountryPortalPage to render a dynamic canton grid.
 */

export interface CantonRegistryEntry {
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

const CANTON_REGISTRY: CantonRegistryEntry[] = [
  {
    name: "Valais (Wallis)",
    slug: "valais",
    countrySlug: "switzerland",
    tagline: "Alpine Elders of Stone, Ice & Light",
    icon: "🏔️",
    provinceKey: "Valais",
  },
  // Future cantons can be added here:
  // { name: "Bern", slug: "bern", countrySlug: "switzerland", ... },

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
];

export default CANTON_REGISTRY;

export const getCantonsByCountry = (countrySlug: string): CantonRegistryEntry[] =>
  CANTON_REGISTRY.filter(c => c.countrySlug === countrySlug);

export const getCantonBySlug = (countrySlug: string, cantonSlug: string): CantonRegistryEntry | undefined =>
  CANTON_REGISTRY.find(c => c.countrySlug === countrySlug && c.slug === cantonSlug);

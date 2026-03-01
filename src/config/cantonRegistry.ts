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
];

export default CANTON_REGISTRY;

export const getCantonsByCountry = (countrySlug: string): CantonRegistryEntry[] =>
  CANTON_REGISTRY.filter(c => c.countrySlug === countrySlug);

export const getCantonBySlug = (countrySlug: string, cantonSlug: string): CantonRegistryEntry | undefined =>
  CANTON_REGISTRY.find(c => c.countrySlug === countrySlug && c.slug === cantonSlug);

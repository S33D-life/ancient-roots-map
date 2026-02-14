/**
 * Shared Country Registry for the World Atlas system.
 *
 * To add a new country portal, simply add an entry here.
 * Both the World Atlas landing page and the Country Portal page
 * will automatically pick it up — no UI changes required.
 */

export interface CountryRegistryEntry {
  /** Display name (must match research_trees.country exactly) */
  country: string;
  /** URL slug for /atlas/:countrySlug */
  slug: string;
  /** Emoji flag */
  flag: string;
  /** Short programme / register descriptor */
  descriptor: string;
  /** Portal hero title */
  portalTitle: string;
  /** Portal hero subtitle */
  portalSubtitle: string;
  /** Source badge label */
  sourceLabel: string;
}

const COUNTRY_REGISTRY: CountryRegistryEntry[] = [
  {
    country: "South Africa",
    slug: "south-africa",
    flag: "🇿🇦",
    descriptor: "Champion Trees Programme",
    portalTitle: "South Africa — Champion Trees",
    portalSubtitle:
      "An official research layer. Verified Ancient Friends are born only through living footsteps.",
    sourceLabel: "DFFE sources",
  },
  {
    country: "United Kingdom",
    slug: "united-kingdom",
    flag: "🇬🇧",
    descriptor: "Ancient & Heritage Trees",
    portalTitle: "United Kingdom — Ancient & Heritage Trees",
    portalSubtitle:
      "A research layer drawn from heritage registers. Verification comes through presence.",
    sourceLabel: "Heritage sources",
  },
  {
    country: "Ireland",
    slug: "ireland",
    flag: "🇮🇪",
    descriptor: "Heritage Tree Register",
    portalTitle: "Ireland — Heritage Trees",
    portalSubtitle:
      "A research layer preserving Ireland's living heritage. Walk among the ancients.",
    sourceLabel: "Heritage sources",
  },
  {
    country: "Australia",
    slug: "australia",
    flag: "🇦🇺",
    descriptor: "Significant Trees",
    portalTitle: "Australia — Significant Trees",
    portalSubtitle:
      "A research layer honouring Australia's remarkable trees. Verification by footsteps.",
    sourceLabel: "National register",
  },
  {
    country: "New Zealand",
    slug: "new-zealand",
    flag: "🇳🇿",
    descriptor: "Notable Trees",
    portalTitle: "New Zealand — Notable Trees",
    portalSubtitle:
      "A research layer drawn from Aotearoa's notable tree schedules.",
    sourceLabel: "Notable tree schedules",
  },
  {
    country: "Japan",
    slug: "japan",
    flag: "🇯🇵",
    descriptor: "Natural Monuments",
    portalTitle: "Japan — Natural Monuments",
    portalSubtitle:
      "A research layer of Japan's designated natural monuments and sacred trees.",
    sourceLabel: "Natural monument records",
  },
  {
    country: "India",
    slug: "india",
    flag: "🇮🇳",
    descriptor: "Heritage Trees",
    portalTitle: "India — Heritage Trees",
    portalSubtitle:
      "A research layer of India's heritage and culturally significant trees.",
    sourceLabel: "Heritage records",
  },
];

export default COUNTRY_REGISTRY;

/** Lookup helpers */
export const getEntryBySlug = (slug: string): CountryRegistryEntry | undefined =>
  COUNTRY_REGISTRY.find((e) => e.slug === slug);

export const getEntryByCountry = (country: string): CountryRegistryEntry | undefined =>
  COUNTRY_REGISTRY.find((e) => e.country === country);

/** Build a slug→entry map for O(1) lookups */
export const SLUG_MAP: Record<string, CountryRegistryEntry> = Object.fromEntries(
  COUNTRY_REGISTRY.map((e) => [e.slug, e])
);

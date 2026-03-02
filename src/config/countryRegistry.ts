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
  /** Bounding box for map auto-zoom [south, west, north, east] */
  bbox?: [number, number, number, number];
  /** True if data is community-seeded rather than from official registers */
  isCommunitySeeded?: boolean;
  /** Custom provenance description (overrides default DFFE text) */
  provenanceText?: string;
}

const COUNTRY_REGISTRY: CountryRegistryEntry[] = [
  {
    country: "South Africa",
    slug: "south-africa",
    flag: "🇿🇦",
    descriptor: "Champion Trees Programme",
    portalTitle: "South Africa — Champion Trees",
    portalSubtitle: "An official research layer. Verified Ancient Friends are born only through living footsteps.",
    sourceLabel: "DFFE sources",
    bbox: [-35, 16, -22, 33],
  },
  {
    country: "United Kingdom",
    slug: "united-kingdom",
    flag: "🇬🇧",
    descriptor: "Ancient & Heritage Trees",
    portalTitle: "United Kingdom — Ancient & Heritage Trees",
    portalSubtitle: "A research layer drawn from heritage registers. Verification comes through presence.",
    sourceLabel: "Heritage sources",
    bbox: [49.9, -8.2, 60.9, 1.8],
  },
  {
    country: "Ireland",
    slug: "ireland",
    flag: "🇮🇪",
    descriptor: "Heritage Tree Register",
    portalTitle: "Ireland — Heritage Trees",
    portalSubtitle: "A research layer preserving Ireland's living heritage. Walk among the ancients.",
    sourceLabel: "Heritage sources",
    bbox: [51.4, -10.5, 55.4, -5.9],
  },
  {
    country: "Australia",
    slug: "australia",
    flag: "🇦🇺",
    descriptor: "Significant Trees",
    portalTitle: "Australia — Significant Trees",
    portalSubtitle: "A research layer honouring Australia's remarkable trees. Verification by footsteps.",
    sourceLabel: "National register",
    bbox: [-44, 112, -10, 154],
  },
  {
    country: "New Zealand",
    slug: "new-zealand",
    flag: "🇳🇿",
    descriptor: "Notable Trees",
    portalTitle: "New Zealand — Notable Trees",
    portalSubtitle: "A research layer drawn from Aotearoa's notable tree schedules.",
    sourceLabel: "Notable tree schedules",
    bbox: [-47.3, 166, -34.4, 178.6],
  },
  {
    country: "Japan",
    slug: "japan",
    flag: "🇯🇵",
    descriptor: "Natural Monuments",
    portalTitle: "Japan — Natural Monuments",
    portalSubtitle: "A research layer of Japan's designated natural monuments and sacred trees.",
    sourceLabel: "Natural monument records",
    bbox: [24, 122.9, 45.5, 153.9],
  },
  {
    country: "India",
    slug: "india",
    flag: "🇮🇳",
    descriptor: "Heritage Trees",
    portalTitle: "India — Heritage Trees",
    portalSubtitle: "A research layer of India's heritage and culturally significant trees.",
    sourceLabel: "Heritage records",
    bbox: [6.7, 68.1, 35.5, 97.4],
  },
  {
    country: "United States",
    slug: "united-states",
    flag: "🇺🇸",
    descriptor: "National Champion Trees",
    portalTitle: "United States — Champion Trees",
    portalSubtitle: "The largest known individuals by species, scored by the National Champion Tree formula.",
    sourceLabel: "American Forests register",
    bbox: [24.5, -125, 49.4, -66.9],
  },
  {
    country: "Brazil",
    slug: "brazil",
    flag: "🇧🇷",
    descriptor: "Árvores Patrimônio",
    portalTitle: "Brazil — Heritage Trees",
    portalSubtitle: "A research layer honouring Brazil's immense arboreal heritage across biomes.",
    sourceLabel: "Heritage records",
    bbox: [-33.7, -73.9, 5.3, -34.8],
  },
  {
    country: "Zimbabwe",
    slug: "zimbabwe",
    flag: "🇿🇼",
    descriptor: "Sacred & Heritage Trees",
    portalTitle: "Zimbabwe — Sacred & Heritage Trees",
    portalSubtitle: "A research layer preserving Zimbabwe's sacred groves and heritage trees.",
    sourceLabel: "Heritage sources",
    bbox: [-22.4, 25.2, -15.6, 33],
  },
  {
    country: "Italy",
    slug: "italy",
    flag: "🇮🇹",
    descriptor: "Alberi Monumentali",
    portalTitle: "Italy — Monumental Trees",
    portalSubtitle: "A research layer from Italy's official register of monumental trees.",
    sourceLabel: "MIPAAF register",
    bbox: [36.6, 6.6, 47.1, 18.5],
  },
  {
    country: "Colombia",
    slug: "colombia",
    flag: "🇨🇴",
    descriptor: "Árboles Patrimoniales",
    portalTitle: "Colombia — Heritage Trees",
    portalSubtitle: "A research layer celebrating Colombia's extraordinary biodiversity and heritage trees.",
    sourceLabel: "Heritage records",
    bbox: [-4.2, -79.5, 12.5, -66.8],
  },
  {
    country: "Greece",
    slug: "greece",
    flag: "🇬🇷",
    descriptor: "Ancient & Sacred Trees",
    portalTitle: "Greece — Ancient & Sacred Trees",
    portalSubtitle: "A research layer honouring Greece's legendary planes, olives, and sacred groves.",
    sourceLabel: "Heritage records",
    bbox: [34.8, 19.4, 41.7, 29.6],
  },
  {
    country: "Canada",
    slug: "canada",
    flag: "🇨🇦",
    descriptor: "Champion & Heritage Trees",
    portalTitle: "Canada — Champion & Heritage Trees",
    portalSubtitle: "A research layer honouring Canada's ancient cedars, old-growth giants, and boreal elders.",
    sourceLabel: "Heritage records",
    bbox: [41.7, -141, 83.1, -52.6],
  },
  {
    country: "China",
    slug: "china",
    flag: "🇨🇳",
    descriptor: "Ancient & Sacred Trees",
    portalTitle: "China — Ancient & Sacred Trees",
    portalSubtitle: "A research layer honouring China's millennia-old cypresses, ginkgos, and sacred mountain pines.",
    sourceLabel: "Heritage records",
    bbox: [18.2, 73.5, 53.6, 135],
  },
  {
    country: "Russia",
    slug: "russia",
    flag: "🇷🇺",
    descriptor: "Ancient & Monumental Trees",
    portalTitle: "Russia — Ancient & Monumental Trees",
    portalSubtitle: "A research layer spanning Russia's boreal larches, Caucasian relicts, and taiga cedar pines.",
    sourceLabel: "Heritage records",
    bbox: [41.2, 19.6, 81.8, 180],
  },
  {
    country: "France",
    slug: "france",
    flag: "🇫🇷",
    descriptor: "Arbres Remarquables",
    portalTitle: "France — Remarkable Trees",
    portalSubtitle: "A research layer honouring France's ancient oaks, twisted beeches, and legendary forest groves.",
    sourceLabel: "Heritage records",
    bbox: [41.3, -5.1, 51.1, 9.6],
  },
  {
    country: "Nigeria",
    slug: "nigeria",
    flag: "🇳🇬",
    descriptor: "Sacred Groves & Sentinels",
    portalTitle: "Nigeria — Sacred Groves & Sentinels",
    portalSubtitle: "Savannah Sentinels, Sacred Groves & Rainforest Giants — a living map of Nigeria's arboreal heritage.",
    sourceLabel: "Cultural heritage sources",
    bbox: [4.3, 2.7, 13.9, 14.7],
  },
  {
    country: "Kenya",
    slug: "kenya",
    flag: "🇰🇪",
    descriptor: "Sacred Trees & Highland Cedars",
    portalTitle: "Kenya — Sacred Trees & Highland Cedars",
    portalSubtitle: "Rift Valley Figs, Highland Cedars & Coastal Baobabs — a living map of Kenya's arboreal heritage.",
    sourceLabel: "Cultural heritage sources",
    bbox: [-4.7, 33.9, 5.0, 41.9],
  },
  {
    country: "Ethiopia",
    slug: "ethiopia",
    flag: "🇪🇹",
    descriptor: "Church Forests & Highland Junipers",
    portalTitle: "Ethiopia — Church Forests & Highland Junipers",
    portalSubtitle: "Church Forest Guardians, Highland Junipers & Rift Valley Fig Elders — a living map of Ethiopia's arboreal heritage.",
    sourceLabel: "Cultural heritage sources",
    bbox: [3.4, 33.0, 14.9, 48.0],
  },
  {
    country: "Tanzania",
    slug: "tanzania",
    flag: "🇹🇿",
    descriptor: "Baobab Giants & Montane Forests",
    portalTitle: "Tanzania — Baobab Giants & Montane Forests",
    portalSubtitle: "Baobab Giants, Kilimanjaro Cedars & Rift Valley Fig Elders — a living map of Tanzania's arboreal heritage.",
    sourceLabel: "Cultural heritage sources",
    bbox: [-11.7, 29.3, -1.0, 40.4],
  },
  {
    country: "Democratic Republic of the Congo",
    slug: "dr-congo",
    flag: "🇨🇩",
    descriptor: "Congo Basin Giants & River Guardians",
    portalTitle: "DR Congo — Congo Basin Giants & River Guardians",
    portalSubtitle: "Congo Basin Giants, Okapi Forest Elders & River Guardians — a living map of DR Congo's arboreal heritage.",
    sourceLabel: "Cultural heritage sources",
    bbox: [-13.5, 12.2, 5.4, 31.3],
  },
  {
    country: "Switzerland",
    slug: "switzerland",
    flag: "🇨🇭",
    descriptor: "Ancient Alpine Trees & Monumental Sentinels",
    portalTitle: "Switzerland — Ancient Alpine Trees",
    portalSubtitle: "Larch elders, stone-pine sentinels & lime guardians — a living map of Switzerland's arboreal heritage across 26 cantons.",
    sourceLabel: "Heritage & cantonal records",
    bbox: [45.8, 5.9, 47.8, 10.5],
  },
  {
    country: "Indonesia",
    slug: "indonesia",
    flag: "🇮🇩",
    descriptor: "Pohon Warisan — Heritage & Sacred Trees",
    portalTitle: "Indonesia — Heritage & Sacred Trees",
    portalSubtitle: "Banyan guardians, rainforest giants & sacred grove elders — a living map of the archipelago's arboreal heritage.",
    sourceLabel: "Heritage & community sources",
    bbox: [-11, 95, 6, 141],
    isCommunitySeeded: true,
    provenanceText: "These seeds were planted by the S33D community. Walk among them and help them grow.",
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

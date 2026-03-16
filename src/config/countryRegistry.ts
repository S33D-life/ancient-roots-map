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
  /** ISO-3166 alpha-2 country code */
  isoCode?: string;
  /** Preferred camera focus when entering map from portal */
  defaultMapFocus?: {
    center: { lat: number; lng: number };
    zoom: number;
  };
  /** Default semantic filters for map context */
  defaultFilters?: {
    tags?: string[];
    researchLayer?: "on" | "off";
  };
  /** Curated external research sources for the country portal */
  keySources?: Array<{ label: string; url: string }>;
  /** True if data is community-seeded rather than from official registers */
  isCommunitySeeded?: boolean;
  /** Custom provenance description (overrides default DFFE text) */
  provenanceText?: string;
}

const COUNTRY_REGISTRY: CountryRegistryEntry[] = [
  {
    country: "Costa Rica",
    slug: "costa-rica",
    flag: "🇨🇷",
    descriptor: "Ancient & Research Trees",
    portalTitle: "Costa Rica — Ancient & Research Trees",
    portalSubtitle: "Cloud-forest giants, ceiba guardians, and living research records across Costa Rica.",
    sourceLabel: "Research & heritage sources",
    isoCode: "CR",
    bbox: [8.0, -85.95, 11.35, -82.55],
    defaultMapFocus: {
      center: { lat: 9.7489, lng: -83.7534 },
      zoom: 7,
    },
    defaultFilters: {
      tags: ["ancient", "champion", "research"],
      researchLayer: "on",
    },
    keySources: [
      { label: "SINAC / protected areas dataset (placeholder)", url: "https://www.sinac.go.cr/" },
      { label: "National biodiversity research sources (placeholder)", url: "https://www.inbio.ac.cr/" },
    ],
  },
  {
    country: "Peru",
    slug: "peru",
    flag: "🇵🇪",
    descriptor: "Ancient & Research Trees",
    portalTitle: "Peru — Ancient & Research Trees",
    portalSubtitle: "Andean relicts, Amazonian elders, and documentary records across Peru's living biomes.",
    sourceLabel: "Research & heritage sources",
    isoCode: "PE",
    bbox: [-18.5, -81.5, 0.2, -68.6],
    defaultMapFocus: {
      center: { lat: -9.19, lng: -75.0152 },
      zoom: 5,
    },
    defaultFilters: {
      tags: ["ancient", "champion", "research"],
      researchLayer: "on",
    },
    keySources: [
      { label: "SERFOR forest information (placeholder)", url: "https://www.gob.pe/serfor" },
      { label: "Peru biodiversity institute sources (placeholder)", url: "https://www.iiap.gob.pe/" },
    ],
  },
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
    isoCode: "US",
    bbox: [24.5, -125, 49.4, -66.9],
    defaultMapFocus: {
      center: { lat: 39.8, lng: -98.5 },
      zoom: 4,
    },
    defaultFilters: {
      tags: ["ancient", "champion", "research"],
      researchLayer: "on",
    },
    keySources: [
      { label: "American Forests National Champion Trees", url: "https://www.americanforests.org/champion-trees/" },
      { label: "National Register of Champion Trees", url: "https://www.americanforests.org/get-involved/americas-biggest-trees/champion-trees-database/" },
    ],
    isCommunitySeeded: true,
    provenanceText: "Research records drawn from champion tree registries and heritage surveys. Verification comes through presence.",
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
    isoCode: "ID",
    bbox: [-11, 95, 6, 141],
    defaultMapFocus: {
      center: { lat: -2.5489, lng: 118.0149 },
      zoom: 5,
    },
    defaultFilters: {
      tags: ["ancient", "champion", "research"],
      researchLayer: "on",
    },
    keySources: [
      { label: "Indonesia KLHK forestry data (placeholder)", url: "https://www.menlhk.go.id/" },
      { label: "BRIN biodiversity research index (placeholder)", url: "https://www.brin.go.id/" },
    ],
    isCommunitySeeded: true,
    provenanceText: "These seeds were planted by the S33D community. Walk among them and help them grow.",
  },
  {
    country: "Hong Kong",
    slug: "hong-kong",
    flag: "🇭🇰",
    descriptor: "Old & Valuable Trees / Stone Wall Trees",
    portalTitle: "Hong Kong — Living Walls & Heritage Trees",
    portalSubtitle: "Stone wall survivors, harbour sentinels & garden elders — a living map of Hong Kong's arboreal heritage.",
    sourceLabel: "LCSD / GLTMS registers",
    isoCode: "HK",
    bbox: [22.15, 113.83, 22.56, 114.43],
    defaultMapFocus: {
      center: { lat: 22.3193, lng: 114.1694 },
      zoom: 11,
    },
    defaultFilters: {
      tags: ["heritage", "stone_wall", "ancient"],
      researchLayer: "on",
    },
    keySources: [
      { label: "Old and Valuable Trees Register (GLTMS)", url: "https://www.greening.gov.hk/en/greening-activities/register-ovt.html" },
      { label: "Stone Wall Trees — LCSD", url: "https://www.lcsd.gov.hk/en/green/tree/index.html" },
    ],
    provenanceText: "Research records drawn from the Hong Kong Old and Valuable Trees Register and Stone Wall Trees dataset. Verification comes through presence.",
  },
  {
    country: "Iran",
    slug: "iran",
    flag: "🇮🇷",
    descriptor: "Land of Eternal Cypress",
    portalTitle: "Iran — Land of Eternal Cypress",
    portalSubtitle: "Where desert winds, mountain forests and ancient civilizations meet beneath trees that have witnessed millennia.",
    sourceLabel: "Heritage & cultural sources",
    isoCode: "IR",
    bbox: [25.0, 44.0, 39.8, 63.3],
    defaultMapFocus: {
      center: { lat: 32.4279, lng: 53.6880 },
      zoom: 5,
    },
    defaultFilters: {
      tags: ["ancient", "champion", "research"],
      researchLayer: "on",
    },
    keySources: [
      { label: "Iran Cultural Heritage Organization (placeholder)", url: "https://www.ichto.ir/" },
      { label: "Iran Department of Environment (placeholder)", url: "https://www.doe.ir/" },
    ],
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

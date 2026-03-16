/**
 * Dataset Integration Toolkit
 *
 * Config-driven framework for integrating heritage tree datasets into S33D.
 * Uses existing tables: tree_data_sources → tree_datasets → research_trees
 *
 * To add a new dataset:
 * 1. Add a DatasetConfig entry
 * 2. Add country to countryRegistry.ts
 * 3. Add country to registry.json
 * 4. Create a seed script using createSeedScript()
 * 5. Optionally add sub-regions to subRegionRegistry.ts
 */

/* ── Dataset Configuration ── */

export interface DatasetConfig {
  /** Unique key, e.g. "sg-heritage-trees" */
  key: string;
  /** Human-readable name */
  name: string;
  /** ISO-3166 alpha-2 */
  countryCode: string;
  /** Country name as stored in research_trees.country */
  countryName: string;
  /** URL slug for atlas page */
  countrySlug: string;
  /** Dataset type classification */
  datasetType: DatasetType;
  /** Primary source URL */
  sourceUrl: string;
  /** Source organisation */
  sourceOrg: string;
  /** Data format of the original source */
  dataFormat: DataFormat;
  /** License information */
  license?: string;
  /** How often the source is updated */
  updateFrequency?: UpdateFrequency;
  /** BBox for map focus [south, west, north, east] */
  bbox: [number, number, number, number];
  /** Map center point */
  center: { lat: number; lng: number };
  /** Default map zoom level */
  defaultZoom: number;
  /** Emoji flag */
  flag: string;
  /** Region type (city-state, territory, country, etc.) */
  regionType: RegionType;
  /** Thematic circles for grouping seed trees */
  circles: CircleConfig[];
  /** Additional source links for the atlas page */
  keySources?: Array<{ label: string; url: string }>;
  /** Provenance description */
  provenanceText?: string;
  /** Portal page title */
  portalTitle: string;
  /** Portal page subtitle */
  portalSubtitle: string;
  /** Descriptor for country registry */
  descriptor: string;
  /** Source badge label */
  sourceLabel: string;
}

export interface CircleConfig {
  /** URL-safe key */
  key: string;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** How to identify trees in this circle (source_row_ref prefix) */
  refPrefix: string;
}

export type DatasetType =
  | "heritage_trees"
  | "champion_trees"
  | "sacred_trees"
  | "urban_canopy"
  | "research_dataset"
  | "ancient_trees"
  | "monumental_trees"
  | "notable_trees";

export type DataFormat =
  | "csv"
  | "geojson"
  | "rest_api"
  | "open_data_portal"
  | "manual_curation"
  | "pdf_register";

export type UpdateFrequency =
  | "live"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "annual"
  | "static";

export type RegionType =
  | "country"
  | "city-state"
  | "territory"
  | "region"
  | "state";

/* ── Seed Tree Schema ── */

export interface SeedTree {
  tree_name: string;
  species_scientific: string;
  species_common: string;
  designation_type: string;
  /** Planning area / province / district */
  province: string;
  /** City name (for city-scale datasets) */
  city: string;
  /** Human-readable location */
  locality_text: string;
  latitude: number;
  longitude: number;
  height_m?: number;
  girth_or_stem?: string;
  crown_spread?: string;
  age_estimate?: string;
  description: string;
  /** Reference ID linking back to the circle via prefix */
  source_row_ref: string;
  /** Optional image URL */
  image_url?: string;
}

/* ── Normaliser: SeedTree → research_trees row ── */

export function normaliseToResearchTree(
  tree: SeedTree,
  config: DatasetConfig,
): Record<string, unknown> {
  return {
    tree_name: tree.tree_name,
    species_scientific: tree.species_scientific,
    species_common: tree.species_common,
    designation_type: tree.designation_type,
    province: tree.province,
    city: tree.city,
    country: config.countryName,
    locality_text: tree.locality_text,
    latitude: tree.latitude,
    longitude: tree.longitude,
    height_m: tree.height_m ?? null,
    girth_or_stem: tree.girth_or_stem ?? null,
    crown_spread: tree.crown_spread ?? null,
    age_estimate: tree.age_estimate ?? null,
    description: tree.description,
    source_doc_title: config.name,
    source_doc_url: config.sourceUrl,
    source_doc_year: new Date().getFullYear(),
    source_program: config.key,
    source_row_ref: tree.source_row_ref,
    geo_precision: "approx",
    heritage_status: "official_register",
    status: "research",
    record_status: "draft",
    record_kind: "individual_tree",
  };
}

/* ── Country Registry Entry Builder ── */

export function buildCountryRegistryEntry(config: DatasetConfig) {
  return {
    country: config.countryName,
    slug: config.countrySlug,
    flag: config.flag,
    descriptor: config.descriptor,
    portalTitle: config.portalTitle,
    portalSubtitle: config.portalSubtitle,
    sourceLabel: config.sourceLabel,
    isoCode: config.countryCode,
    bbox: config.bbox,
    defaultMapFocus: {
      center: config.center,
      zoom: config.defaultZoom,
    },
    defaultFilters: {
      tags: ["heritage", "ancient"],
      researchLayer: "on" as const,
    },
    keySources: config.keySources ?? [
      { label: config.sourceOrg, url: config.sourceUrl },
    ],
    provenanceText: config.provenanceText ??
      `Research records drawn from the ${config.name}. Verification comes through presence.`,
  };
}

/* ── Registry JSON Entry Builder ── */

export function buildRegistryJsonEntry(config: DatasetConfig) {
  return {
    country_code: config.countryCode,
    name: config.countryName,
    slug: config.countrySlug,
    center: [config.center.lat, config.center.lng],
    bbox: config.bbox,
    enabled: true,
    priority: 10,
    sources_enabled: [config.key],
  };
}

/* ── Dataset Configs ── */

export const DATASET_CONFIGS: Record<string, DatasetConfig> = {
  "hk-ovt-register": {
    key: "hk-ovt-register",
    name: "Hong Kong Old and Valuable Trees Register",
    countryCode: "HK",
    countryName: "Hong Kong",
    countrySlug: "hong-kong",
    datasetType: "heritage_trees",
    sourceUrl: "https://www.greening.gov.hk/en/greening-activities/register-ovt.html",
    sourceOrg: "GLTMS / LCSD",
    dataFormat: "manual_curation",
    updateFrequency: "annual",
    bbox: [22.15, 113.83, 22.56, 114.43],
    center: { lat: 22.3193, lng: 114.1694 },
    defaultZoom: 11,
    flag: "🇭🇰",
    regionType: "territory",
    portalTitle: "Hong Kong — Living Walls & Heritage Trees",
    portalSubtitle: "Stone wall survivors, harbour sentinels & garden elders — a living map of Hong Kong's arboreal heritage.",
    descriptor: "Old & Valuable Trees / Stone Wall Trees",
    sourceLabel: "LCSD / GLTMS registers",
    circles: [
      { key: "stone-wall", label: "Stone Wall Circle", icon: "🧱", refPrefix: "OVT-SWT" },
      { key: "harbour", label: "Harbour Heritage", icon: "⚓", refPrefix: "OVT-HH" },
      { key: "garden", label: "Garden Elders", icon: "🌺", refPrefix: "OVT-GE" },
      { key: "threshold", label: "Threshold Trees", icon: "🚪", refPrefix: "OVT-TT" },
    ],
    keySources: [
      { label: "Old and Valuable Trees Register (GLTMS)", url: "https://www.greening.gov.hk/en/greening-activities/register-ovt.html" },
      { label: "Stone Wall Trees — LCSD", url: "https://www.lcsd.gov.hk/en/green/tree/index.html" },
    ],
  },
  "sg-heritage-trees": {
    key: "sg-heritage-trees",
    name: "Singapore Heritage Tree Register (NParks)",
    countryCode: "SG",
    countryName: "Singapore",
    countrySlug: "singapore",
    datasetType: "heritage_trees",
    sourceUrl: "https://www.nparks.gov.sg/gardens-parks-and-nature/heritage-trees",
    sourceOrg: "National Parks Board (NParks)",
    dataFormat: "manual_curation",
    updateFrequency: "annual",
    bbox: [1.15, 103.6, 1.47, 104.1],
    center: { lat: 1.3521, lng: 103.8198 },
    defaultZoom: 11,
    flag: "🇸🇬",
    regionType: "city-state",
    portalTitle: "Singapore — City in a Garden",
    portalSubtitle: "Heritage tembusu, rainforest dipterocarps & temple guardians — a living map of Singapore's extraordinary urban forest canopy.",
    descriptor: "Heritage Trees (NParks)",
    sourceLabel: "NParks Heritage Tree Register",
    circles: [
      { key: "botanic", label: "Botanic Garden Elders", icon: "🌿", refPrefix: "SG-BG" },
      { key: "temple", label: "Temple Guardians", icon: "🛕", refPrefix: "SG-TG" },
      { key: "rainforest", label: "Rainforest Giants", icon: "🌲", refPrefix: "SG-RG" },
      { key: "city", label: "City Canopy Trees", icon: "🏙️", refPrefix: "SG-CC" },
    ],
    keySources: [
      { label: "NParks Heritage Tree Register", url: "https://www.nparks.gov.sg/gardens-parks-and-nature/heritage-trees" },
      { label: "Singapore Botanic Gardens", url: "https://www.nparks.gov.sg/sbg" },
    ],
  },
};

/** Look up a dataset config by its key */
export const getDatasetConfig = (key: string): DatasetConfig | undefined =>
  DATASET_CONFIGS[key];

/** Get all dataset configs for a country slug */
export const getDatasetsByCountry = (countrySlug: string): DatasetConfig[] =>
  Object.values(DATASET_CONFIGS).filter(d => d.countrySlug === countrySlug);

/** Get all registered dataset keys */
export const getAllDatasetKeys = (): string[] =>
  Object.keys(DATASET_CONFIGS);

/**
 * Map Layer Group Configuration
 *
 * Defines the 6 semantic layer categories and 4 quick-preset modes.
 * Used by LeafletFallbackMap (to build visualSections) and AtlasFilter (for presets).
 */
import type { LayerKey } from "@/hooks/use-map-layer-state";

/* ── Group keys ── */
export type LayerGroupKey =
  | "trees"
  | "discovery"
  | "atlas"
  | "ecology"
  | "activity"
  | "atmosphere";

export interface LayerGroupMeta {
  key: LayerGroupKey;
  title: string;
  icon: string;
  accent: string; // HSL values without hsl() wrapper e.g. "42, 80%, 55%"
  description: string;
}

export const LAYER_GROUPS: LayerGroupMeta[] = [
  {
    key: "trees",
    title: "Ancient Friends",
    icon: "🌳",
    accent: "42, 80%, 55%",
    description: "Core tree markers, ancient highlights, and harvest signals.",
  },
  {
    key: "discovery",
    title: "Discovery",
    icon: "🧭",
    accent: "200, 55%, 55%",
    description: "Explore nearby trees, groves, and forest connections.",
  },
  {
    key: "atlas",
    title: "Atlas",
    icon: "🌐",
    accent: "35, 65%, 55%",
    description: "Geographic overlays — datasets, regions, archives, and rootstones.",
  },
  {
    key: "ecology",
    title: "Ecology",
    icon: "🍃",
    accent: "120, 50%, 50%",
    description: "Species hives, birdsong, mycelial networks, and seasonal lenses.",
  },
  {
    key: "activity",
    title: "Living Pulse",
    icon: "💠",
    accent: "260, 55%, 65%",
    description: "Community activity — visits, seeds, offerings, dreams, and whispers.",
  },
  {
    key: "atmosphere",
    title: "Visual",
    icon: "🎨",
    accent: "340, 55%, 65%",
    description: "Artistic overlays — blooming clock, constellation mode, forest pulse.",
  },
];

/* ── Which LayerKeys belong to each group ── */
export const GROUP_LAYER_KEYS: Record<LayerGroupKey, LayerKey[]> = {
  trees: [
    "ancientHighlight",
    "harvestLayer",
    "offeringGlow",
  ],
  discovery: [
    "groves",
    "rootThreads",
    "mycelialPathways",
    "seeds",
  ],
  atlas: [
    "researchLayer",
    "rootstones",
    "rootstoneTrees",
    "rootstoneGroves",
    "immutableLayer",
    "externalTrees",
    "churchyards",
    "heritage",
    "castles",
    "waterways",
    "footpaths",
    "watersCommons",
    "libraries",
    "bookshops",
    "botanicalGardens",
  ],
  ecology: [
    "hiveLayer",
    "birdsongHeat",
    "mycelialNetwork",
  ],
  activity: [
    "heartGlow",
    "bloomedSeeds",
    "recentVisits",
    "seedTraces",
    "seedTrail",
    "sharedTrees",
    "tribeActivity",
    "dreamTrees",
    "dreamOfferings",
  ],
  atmosphere: [
    "bloomingClock",
    "bloomConstellationMode",
    "forestPulse",
    "clearView",
  ],
};

/* ── Quick preset modes ── */
export interface QuickPreset {
  key: string;
  label: string;
  icon: string;
  accent: string;
  /** LayerKeys to enable — all others in managed groups are disabled */
  enable: LayerKey[];
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    key: "explore",
    label: "Explore",
    icon: "🧭",
    accent: "200, 55%, 55%",
    enable: ["ancientHighlight", "groves", "seeds", "rootThreads"],
  },
  {
    key: "ecology",
    label: "Ecology",
    icon: "🍃",
    accent: "120, 50%, 50%",
    enable: ["ancientHighlight", "hiveLayer", "birdsongHeat", "mycelialNetwork"],
  },
  {
    key: "atlas",
    label: "Atlas",
    icon: "🌐",
    accent: "35, 65%, 55%",
    enable: ["ancientHighlight", "researchLayer", "rootstones", "externalTrees"],
  },
  {
    key: "pulse",
    label: "Pulse",
    icon: "💠",
    accent: "260, 55%, 65%",
    enable: ["ancientHighlight", "heartGlow", "recentVisits", "bloomedSeeds", "seedTraces"],
  },
];

/** All managed LayerKeys across all groups (for bulk reset) */
export const ALL_MANAGED_KEYS: LayerKey[] = Object.values(GROUP_LAYER_KEYS).flat();

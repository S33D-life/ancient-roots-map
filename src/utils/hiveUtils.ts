/**
 * Species Hive utilities — maps tree species to botanical family "hives"
 * and provides hive metadata for UI rendering.
 */
import TREE_SPECIES, { getFamilyForSpecies, getAllFamilies, matchSpecies } from "@/data/treeSpecies";

export interface HiveInfo {
  /** Botanical family name, e.g. "Fagaceae" */
  family: string;
  /** URL-safe slug, e.g. "fagaceae" */
  slug: string;
  /** Human-friendly display name, e.g. "Oak Hive" */
  displayName: string;
  /** Short description */
  description: string;
  /** CSS accent color (HSL) */
  accentHsl: string;
  /** Emoji motif */
  icon: string;
  /** Representative species in this family */
  representativeSpecies: string[];
}

// Curated hive metadata for major families
const HIVE_META: Record<string, Omit<HiveInfo, "family" | "slug" | "representativeSpecies">> = {
  Fagaceae: { displayName: "Oak & Beech Hive", description: "The mighty oaks, beeches, and chestnuts — pillars of ancient woodlands.", accentHsl: "35 65% 45%", icon: "🌳" },
  Pinaceae: { displayName: "Pine & Conifer Hive", description: "Pines, spruces, firs, cedars, and larches — the evergreen sentinels.", accentHsl: "150 40% 35%", icon: "🌲" },
  Rosaceae: { displayName: "Cherry & Rose Hive", description: "Cherries, hawthorns, rowans, and apples — the blossoming lineage.", accentHsl: "340 60% 55%", icon: "🌸" },
  Betulaceae: { displayName: "Birch & Hazel Hive", description: "Birches, hazels, alders, and hornbeams — silver-barked pioneers.", accentHsl: "45 50% 60%", icon: "🍂" },
  Salicaceae: { displayName: "Willow & Poplar Hive", description: "Willows and poplars — guardians of waterways and riverbanks.", accentHsl: "170 45% 40%", icon: "🌿" },
  Cupressaceae: { displayName: "Cypress & Redwood Hive", description: "Cypresses, junipers, sugi cedars, and the towering redwoods — ancient giants.", accentHsl: "160 35% 30%", icon: "🏔️" },
  Sapindaceae: { displayName: "Maple & Sycamore Hive", description: "Maples, sycamores, and horse chestnuts — the autumn painters.", accentHsl: "15 70% 50%", icon: "🍁" },
  Oleaceae: { displayName: "Ash & Olive Hive", description: "Ashes, olives, and privets — wind-resistant and enduring.", accentHsl: "80 30% 40%", icon: "🫒" },
  Taxaceae: { displayName: "Yew Hive", description: "The ancient yews — guardians of sacred groves and churchyards.", accentHsl: "140 50% 25%", icon: "🌑" },
  Malvaceae: { displayName: "Lime & Baobab Hive", description: "Limes, lindens, kapoks, ceibas, and baobabs — heart-leaved giants.", accentHsl: "60 50% 45%", icon: "💛" },
  Ulmaceae: { displayName: "Elm & Zelkova Hive", description: "The enduring elms and zelkovas — cathedral-crowned survivors.", accentHsl: "90 35% 35%", icon: "🏛️" },
  Platanaceae: { displayName: "Plane Hive", description: "London planes and oriental planes — urban forest champions.", accentHsl: "40 40% 50%", icon: "🌆" },
  Moraceae: { displayName: "Fig & Banyan Hive", description: "Figs, mulberries, and sacred banyans — the sheltering kin.", accentHsl: "25 55% 40%", icon: "🕌" },
  Magnoliaceae: { displayName: "Magnolia Hive", description: "Magnolias and tulip trees — among the most ancient flowering lineages.", accentHsl: "300 40% 60%", icon: "🪷" },
  Araucariaceae: { displayName: "Monkey Puzzle Hive", description: "Araucarias and kauris — living fossils from Gondwana.", accentHsl: "200 30% 35%", icon: "🦕" },
  Juglandaceae: { displayName: "Walnut Hive", description: "Walnuts — noble nut-bearers of temperate forests.", accentHsl: "30 45% 35%", icon: "🥜" },
  Myrtaceae: { displayName: "Eucalyptus & Pohutukawa Hive", description: "Eucalyptus, pohutukawa — fragrant evergreens of the southern hemisphere.", accentHsl: "0 55% 50%", icon: "🔥" },
  Ginkgoaceae: { displayName: "Ginkgo Hive", description: "The sole surviving ginkgo — a living fossil spanning 270 million years.", accentHsl: "50 70% 50%", icon: "🍃" },
  Fabaceae: { displayName: "Legume Tree Hive", description: "Acacias, rain trees, msasa, and mopane — nitrogen-fixing woodland pillars.", accentHsl: "42 55% 45%", icon: "🌾" },
  Lauraceae: { displayName: "Camphor & Laurel Hive", description: "Camphor trees, bay laurels — aromatic sentinels of warm forests.", accentHsl: "130 35% 40%", icon: "🍃" },
  Arecaceae: { displayName: "Palm Hive", description: "Wax palms, moriche palms — towering tropical sentinels.", accentHsl: "110 50% 45%", icon: "🌴" },
  Bignoniaceae: { displayName: "Trumpet Tree Hive", description: "Jacarandas and trumpet trees — flowering spectacles of the tropics.", accentHsl: "270 50% 55%", icon: "🎺" },
  Meliaceae: { displayName: "Mahogany & Cedar Hive", description: "Mahoganies, neem, and tropical cedars — noble hardwoods.", accentHsl: "20 50% 35%", icon: "🪵" },
  Podocarpaceae: { displayName: "Yellowwood Hive", description: "Yellowwoods and totara — ancient southern conifers.", accentHsl: "55 40% 35%", icon: "🏞️" },
};

function slugify(family: string): string {
  return family.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function getSpeciesInFamily(family: string): string[] {
  return TREE_SPECIES
    .filter(sp => sp.family === family)
    .map(sp => sp.common);
}

/** Get HiveInfo for a botanical family */
export function getHiveInfo(family: string): HiveInfo {
  const meta = HIVE_META[family];
  const species = getSpeciesInFamily(family);
  if (meta) {
    return { family, slug: slugify(family), representativeSpecies: species, ...meta };
  }
  // Fallback for unlisted families
  return {
    family,
    slug: slugify(family),
    displayName: `${family} Hive`,
    description: `Trees of the ${family} family.`,
    accentHsl: "200 30% 45%",
    icon: "🌱",
    representativeSpecies: species,
  };
}

/** Get all hives with at least one known species */
export function getAllHives(): HiveInfo[] {
  return getAllFamilies().map(getHiveInfo);
}

/** Get the hive for a given tree species string */
export function getHiveForSpecies(speciesName: string): HiveInfo | null {
  const family = getFamilyForSpecies(speciesName);
  if (family) return getHiveInfo(family);
  // Try matching via matchSpecies
  const match = matchSpecies(speciesName);
  if (match) return getHiveInfo(match.family);
  return null;
}

/** Get hive by slug */
export function getHiveBySlug(slug: string): HiveInfo | null {
  const families = getAllFamilies();
  const family = families.find(f => slugify(f) === slug);
  return family ? getHiveInfo(family) : null;
}

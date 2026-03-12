/**
 * S33D Hearts Economy — Static configuration
 * Total supply: 777,777,777 hearts across 4 distribution channels.
 */

export const TOTAL_SUPPLY = 777_777_777;

export interface DistributionChannel {
  id: string;
  label: string;
  shortLabel: string;
  hearts: number;
  percentage: number;
  degrees: number;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
  details: string[];
  status: "active" | "upcoming" | "future";
}

export const CHANNELS: DistributionChannel[] = [
  {
    id: "igo",
    label: "Initial Garden Offering",
    shortLabel: "IGO",
    hearts: 111_111_111,
    percentage: 14.3,
    degrees: 51,
    color: "hsl(42, 85%, 55%)",
    glowColor: "hsl(42, 85%, 55%, 0.3)",
    icon: "☀️",
    description: "Seed the ecosystem and support the first growth of S33D.",
    details: [
      "Handcrafted Staff NFTs",
      "NFTree mints",
      "Early patron rounds",
      "Treasury & DAO funding",
      "Prototype game development",
    ],
    status: "active",
  },
  {
    id: "accelerator",
    label: "TEOTAG Accelerator",
    shortLabel: "Accelerator",
    hearts: 111_111_111,
    percentage: 14.3,
    degrees: 51,
    color: "hsl(280, 60%, 55%)",
    glowColor: "hsl(280, 60%, 55%, 0.3)",
    icon: "⚡",
    description: "Accelerate ecosystem growth through builders, creators, and explorers.",
    details: [
      "6 seasonal builder cycles (≈3 months each)",
      "Mapping ancient trees & verifying data",
      "Building Species Hive interfaces",
      "Writing lore & ecological research",
      "Contributing to the Council archive",
    ],
    status: "active",
  },
  {
    id: "loto",
    label: "PooH & Tr33 Loto",
    shortLabel: "Loto",
    hearts: 222_222_222,
    percentage: 28.6,
    degrees: 103,
    color: "hsl(330, 65%, 55%)",
    glowColor: "hsl(330, 65%, 55%, 0.3)",
    icon: "🌸",
    description: "Recirculation, celebration, and surprise — the playful heart of S33D.",
    details: [
      "Seasonal lotteries",
      "Staking rewards",
      "Quest jackpots",
      "Rare NFTree draws",
      "Aligned with Blooming Clock seasons",
    ],
    status: "upcoming",
  },
  {
    id: "proof-of-flow",
    label: "Proof of Flow / Life Exchange",
    shortLabel: "Proof of Flow",
    hearts: 333_333_333,
    percentage: 42.9,
    degrees: 154,
    color: "hsl(150, 55%, 45%)",
    glowColor: "hsl(150, 55%, 45%, 0.3)",
    icon: "🌿",
    description: "Reward real participation in the living ecosystem — the largest, longest-running channel.",
    details: [
      "Visiting & mapping ancient trees",
      "Adding offerings & documenting harvests",
      "Hosting councils & organizing pilgrimages",
      "Trading seeds, lore, and ecological data",
      "Long-term emission curve (60-year horizon)",
    ],
    status: "active",
  },
];

export interface EmissionEra {
  label: string;
  years: string;
  supplyPercent: number;
  description: string;
  color: string;
}

export const EMISSION_ERAS: EmissionEra[] = [
  {
    label: "Genesis Era",
    years: "Years 0–5",
    supplyPercent: 40,
    description: "Rapid seeding — hearts flow freely to bootstrap the ecosystem.",
    color: "hsl(42, 85%, 55%)",
  },
  {
    label: "Growth Era",
    years: "Years 5–15",
    supplyPercent: 35,
    description: "Steady expansion as the forest canopy thickens.",
    color: "hsl(120, 45%, 50%)",
  },
  {
    label: "Forest Era",
    years: "Years 15–30",
    supplyPercent: 20,
    description: "Mature ecosystem — hearts become rarer, more precious.",
    color: "hsl(200, 55%, 45%)",
  },
  {
    label: "Legacy Era",
    years: "Years 30–60",
    supplyPercent: 5,
    description: "Ancient stewardship — a slow drip like sap through heartwood.",
    color: "hsl(270, 40%, 45%)",
  },
];

/** Branches of the Value Tree where hearts flow */
export const VALUE_BRANCHES = [
  { id: "map", label: "Ancient Friends Map", icon: "🗺️", color: "hsl(120, 45%, 50%)" },
  { id: "hives", label: "Species Hives", icon: "🍯", color: "hsl(42, 85%, 55%)" },
  { id: "council", label: "Council of Life", icon: "🏛️", color: "hsl(280, 60%, 55%)" },
  { id: "harvest", label: "Harvest Exchange", icon: "🍎", color: "hsl(15, 70%, 50%)" },
  { id: "builders", label: "Builder Seasons", icon: "⚡", color: "hsl(200, 55%, 50%)" },
  { id: "seeds", label: "Seed Libraries", icon: "🌱", color: "hsl(150, 55%, 45%)" },
];

/**
 * S33D Hearts Economy — Canonical economic blueprint.
 * Total supply: 777,777,777 hearts across 4 distribution channels.
 *
 * This file defines the canonical model. Live circulation counters
 * reflect real activity already recorded in the ecosystem.
 */

export const TOTAL_SUPPLY = 777_777_777;

export interface ChannelDetail {
  purpose: string;
  source: string;
  howHeartsEnter: string;
  examples: string[];
  horizon: "short-term" | "mid-term" | "long-term";
  horizonLabel: string;
}

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
  detail: ChannelDetail;
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
    detail: {
      purpose: "Bootstrap the S33D ecosystem through founding patrons, minting events, and early infrastructure investment.",
      source: "Staff NFTs, NFTree mints, early patron rounds",
      howHeartsEnter: "Distributed through minting events, patron allocations, and treasury funding during the first two years.",
      examples: [
        "Handcrafted Staff NFT mints",
        "Treasury & DAO funding",
        "Early player airdrops",
        "Staff Room patrons",
        "Infrastructure & ecosystem tools",
      ],
      horizon: "short-term",
      horizonLabel: "First 2 years",
    },
    status: "active",
  },
  {
    id: "accelerator",
    label: "TEOTAG Accelerator",
    shortLabel: "TEOTAG Accelerator",
    hearts: 111_111_111,
    percentage: 14.3,
    degrees: 51,
    color: "hsl(280, 60%, 55%)",
    glowColor: "hsl(280, 60%, 55%, 0.3)",
    icon: "⚡",
    description: "Accelerate growth through builders, creators, and explorers guided by TEOTAG.",
    detail: {
      purpose: "Fund 6 seasonal builder cycles where developers, artists, botanists, and stewards earn hearts for verified contributions.",
      source: "Seasonal builder cycles (6 cycles × ≈3 months each)",
      howHeartsEnter: "Distributed through proposal → exploration → council review → reward cycles, curated by TEOTAG.",
      examples: [
        "Mapping & verifying ancient trees",
        "Building Species Hive interfaces",
        "Writing lore & ecological research",
        "Contributing to Council archives",
        "Developing ecosystem tools",
      ],
      horizon: "mid-term",
      horizonLabel: "18 months",
    },
    status: "active",
  },
  {
    id: "loto",
    label: "PooH & Tr33 Loto",
    shortLabel: "PooH & Tr33 Loto",
    hearts: 222_222_222,
    percentage: 28.6,
    degrees: 103,
    color: "hsl(330, 65%, 55%)",
    glowColor: "hsl(330, 65%, 55%, 0.3)",
    icon: "🌸",
    description: "Recirculation, celebration, and surprise — the playful heart of S33D.",
    detail: {
      purpose: "Fuel the cyclical, joyful rhythms of the ecosystem through seasonal games, staking, and surprise distributions.",
      source: "Lottery tickets, staking deposits, quest completions",
      howHeartsEnter: "Hearts consumed as lottery tickets are partially burned, partially redistributed, and partially returned to prize pools — aligned with Blooming Clock seasons.",
      examples: [
        "Seasonal lotteries",
        "Staking rewards",
        "Quest jackpots",
        "Rare NFTree draws",
        "Special seasonal games",
      ],
      horizon: "long-term",
      horizonLabel: "Ongoing, seasonal",
    },
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
    description: "The largest, longest-running channel — rewarding real participation in the living ecosystem.",
    detail: {
      purpose: "Reward verified acts of ecological stewardship through a long-term emission curve spanning 60 years.",
      source: "Continuous micro-releases based on verified participation",
      howHeartsEnter: "Small continuous releases — like sap moving through a tree — triggered by mapping, offerings, harvests, councils, and pilgrimages.",
      examples: [
        "Visiting & mapping ancient trees",
        "Adding offerings & documenting harvests",
        "Hosting councils & organizing pilgrimages",
        "Trading seeds, lore, and ecological data",
        "Planting saplings & long-term stewardship",
      ],
      horizon: "long-term",
      horizonLabel: "60-year horizon",
    },
    status: "active",
  },
];

export interface EmissionEra {
  label: string;
  years: string;
  yearRange: string;
  supplyPercent: number;
  description: string;
  color: string;
}

export const EMISSION_ERAS: EmissionEra[] = [
  {
    label: "Genesis Era",
    years: "Years 0–5",
    yearRange: "5 years",
    supplyPercent: 40,
    description: "Rapid seeding — hearts flow freely to bootstrap the living network.",
    color: "hsl(42, 85%, 55%)",
  },
  {
    label: "Growth Era",
    years: "Years 5–15",
    yearRange: "10 years",
    supplyPercent: 35,
    description: "Steady expansion as the forest canopy thickens and stewardship deepens.",
    color: "hsl(120, 45%, 50%)",
  },
  {
    label: "Forest Era",
    years: "Years 15–30",
    yearRange: "15 years",
    supplyPercent: 20,
    description: "A mature ecosystem — hearts become rarer, each one more precious.",
    color: "hsl(200, 55%, 45%)",
  },
  {
    label: "Legacy Era",
    years: "Years 30–60",
    yearRange: "30 years",
    supplyPercent: 5,
    description: "Ancient stewardship — a slow drip like sap through heartwood.",
    color: "hsl(270, 40%, 45%)",
  },
];

export interface ValueBranch {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  status: "live" | "partial" | "future";
  link: string;
}

/** Branches of the Value Tree where hearts flow */
export const VALUE_BRANCHES: ValueBranch[] = [
  {
    id: "map",
    label: "Ancient Friends Map",
    icon: "🗺️",
    color: "hsl(120, 45%, 50%)",
    description: "Heart rewards for mapping, visiting, and documenting ancient trees.",
    status: "live",
    link: "/map",
  },
  {
    id: "hives",
    label: "Species Hives",
    icon: "🍯",
    color: "hsl(42, 85%, 55%)",
    description: "Fractal Species Hearts routed to botanical communities.",
    status: "live",
    link: "/hives",
  },
  {
    id: "council",
    label: "Council of Life",
    icon: "🏛️",
    color: "hsl(280, 60%, 55%)",
    description: "Influence and hearts for governance participation.",
    status: "live",
    link: "/council-of-life",
  },
  {
    id: "harvest",
    label: "Harvest Exchange",
    icon: "🍎",
    color: "hsl(15, 70%, 50%)",
    description: "Hearts earned through harvest listings and seasonal trade.",
    status: "partial",
    link: "/harvest",
  },
  {
    id: "builders",
    label: "Builder Seasons",
    icon: "⚡",
    color: "hsl(200, 55%, 50%)",
    description: "Seasonal accelerator cycles for ecosystem developers.",
    status: "future",
    link: "/value-tree?tab=earn",
  },
  {
    id: "seeds",
    label: "Seed Libraries",
    icon: "🌱",
    color: "hsl(150, 55%, 45%)",
    description: "Hearts circulating through seed saving, sharing, and growing.",
    status: "future",
    link: "/map",
  },
];

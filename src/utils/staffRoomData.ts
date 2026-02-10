/**
 * Staff Room data derived from the on-chain contract configuration.
 * Single source of truth for species codes, images, circle structure, and grid layout.
 */
import {
  SPECIES_CODES,
  SPECIES_MAP,
  CIRCLES,
  getStaffImage,
  getBaseScanUrl,
  getOpenSeaUrl,
  getMetadataUrl,
  STAFF_CONTRACT_ADDRESS,
  type SpeciesCode,
} from "@/config/staffContract";

// ── Physical measurements for the 36 Origin Spiral staffs ────────
// These are real-world measurements that live outside the contract.
const SPIRAL_MEASUREMENTS: Record<string, { length: string; weight: string }> = {
  GOA:  { length: "119 cm", weight: "292 g" },
  PLUM: { length: "103 cm", weight: "505 g" },
  BEE:  { length: "128 cm", weight: "1,315 g" },
  RHOD: { length: "116 cm", weight: "560 g" },
  CHERRY: { length: "94 cm", weight: "433 g" },
  ROW:  { length: "138 cm", weight: "911 g" },
  PINE: { length: "159 cm", weight: "1,337 g" },
  BOX:  { length: "161 cm", weight: "1,332 g" },
  OAK:  { length: "119 cm", weight: "550 g" },
  PRIVET: { length: "104 cm", weight: "666 g" },
  WILLOW: { length: "118 cm", weight: "646 g" },
  SYC:  { length: "124 cm", weight: "613 g" },
  HAZ:  { length: "99 cm", weight: "734 g" },
  HORN: { length: "133 cm", weight: "990 g" },
  YEW:  { length: "161 cm", weight: "1,252 g" },
  ASH:  { length: "131 cm", weight: "816 g" },
  HOL:  { length: "157 cm", weight: "600 g" },
  SWE:  { length: "98 cm", weight: "1,210 g" },
  APP:  { length: "114 cm", weight: "1,000 g" },
  IVY:  { length: "94 cm", weight: "901 g" },
  ELD:  { length: "127 cm", weight: "505 g" },
  HAW:  { length: "102 cm", weight: "603 g" },
  PLA:  { length: "152 cm", weight: "1,844 g" },
  BUCK: { length: "161 cm", weight: "663 g" },
  BIR:  { length: "144 cm", weight: "888 g" },
  ROSE: { length: "122 cm", weight: "599 g" },
  BUD:  { length: "115 cm", weight: "393 g" },
  CRAB: { length: "119 cm", weight: "644 g" },
  DAWN: { length: "142 cm", weight: "500 g" },
  HORS: { length: "101 cm", weight: "1,333 g" },
  JAPA: { length: "103 cm", weight: "1,100 g" },
  MED:  { length: "109 cm", weight: "2,525 g" },
  PEAR: { length: "137 cm", weight: "848 g" },
  SLOE: { length: "177 cm", weight: "1,844 g" },
  WITC: { length: "84 cm", weight: "433 g" },
  ALD:  { length: "93 cm", weight: "955 g" },
};

// The spiral display order (how they appear in the golden spiral layout)
const SPIRAL_ORDER: SpeciesCode[] = [
  "YEW", "OAK", "HORN", "HOL", "HAW", "PLA", "ASH", "GOA", "ELD",
  "BEE", "APP", "ROSE", "CHERRY", "ROW", "ALD", "SYC", "BIR", "HAZ",
  "SWE", "IVY", "PLUM", "PINE", "RHOD", "PRIVET", "WILLOW", "BOX",
  "BUCK", "DAWN", "BUD", "CRAB", "WITC", "PEAR", "JAPA", "SLOE", "MED", "HORS",
];

// Short display codes used in the UI (matching existing image file names)
const DISPLAY_CODES: Partial<Record<SpeciesCode, string>> = {
  CHERRY: "CHER",
  PRIVET: "PRIV",
  WILLOW: "WIL",
};

export function getDisplayCode(code: SpeciesCode): string {
  return DISPLAY_CODES[code] || code;
}

export interface SpiralStaff {
  code: SpeciesCode;
  displayCode: string;
  species: string;
  image: string;
  length: string;
  weight: string;
}

/** Build the 36 spiral staffs array from contract config + measurements. */
export function getSpiralStaffs(): SpiralStaff[] {
  return SPIRAL_ORDER.map((code) => {
    const info = SPECIES_MAP[code];
    const measurements = SPIRAL_MEASUREMENTS[code] || { length: "—", weight: "—" };
    return {
      code,
      displayCode: getDisplayCode(code),
      species: info?.name || code,
      image: info?.image || "/images/staffs/oak.jpeg",
      length: measurements.length,
      weight: measurements.weight,
    };
  });
}

/** Calculate total staff count per species from CIRCLES config. */
export function getSpeciesStaffCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  // Every species has at least 1 (the Origin Spiral staff)
  for (const code of SPECIES_CODES) {
    counts[code] = 1;
  }
  // Add circle staffs
  for (const circle of CIRCLES) {
    if (circle.id === 0) continue; // Origin spiral already counted
    if (circle.speciesCode) {
      counts[circle.speciesCode] = (counts[circle.speciesCode] || 0) + circle.count;
    }
  }
  return counts;
}

/** Get circle description text for a species. */
export function getCircleDescription(code: string): string {
  const circles = CIRCLES.filter((c) => c.id > 0 && c.speciesCode === code);
  if (circles.length === 0) return "Original only";
  const totalCircleStaffs = circles.reduce((sum, c) => sum + c.count, 0);
  return `${circles.length} circle${circles.length > 1 ? "s" : ""} (${totalCircleStaffs} + original)`;
}

/** Get the circle start index in the 144 grid for a species (for scroll-to linking). */
export function getCircleStartIndex(code: string): number | undefined {
  // Origin spiral occupies indices 0-35
  // Circles follow in order: Yew C1-C3 (36-71), Oak C1-C3 (72-107), Ash (108-119), Beech (120-131), Holly (132-143)
  const circleStartMap: Record<string, number> = {
    YEW: 36,
    OAK: 72,
    ASH: 108,
    BEE: 120,
    HOL: 132,
  };
  return circleStartMap[code];
}

export interface GridStaff {
  code: string;
  img: string;
  speciesName: string;
  tokenId: number; // 1-indexed token ID
}

/** Build the full 144-item grid from contract config. */
export function getGridStaffs(): GridStaff[] {
  const grid: GridStaff[] = [];

  // 0-35: Origin Spiral (in spiral order)
  for (let i = 0; i < SPIRAL_ORDER.length; i++) {
    const code = SPIRAL_ORDER[i];
    const displayCode = getDisplayCode(code);
    grid.push({
      code: displayCode,
      img: SPECIES_MAP[code]?.image || "/images/staffs/oak.jpeg",
      speciesName: SPECIES_MAP[code]?.name || code,
      tokenId: i + 1,
    });
  }

  // Circle staffs — ordered by circle config
  const circleOrder: { speciesCode: SpeciesCode; circleNum: number; count: number }[] = [
    { speciesCode: "YEW", circleNum: 1, count: 12 },
    { speciesCode: "YEW", circleNum: 2, count: 12 },
    { speciesCode: "YEW", circleNum: 3, count: 12 },
    { speciesCode: "OAK", circleNum: 1, count: 12 },
    { speciesCode: "OAK", circleNum: 2, count: 12 },
    { speciesCode: "OAK", circleNum: 3, count: 12 },
    { speciesCode: "ASH", circleNum: 1, count: 12 },
    { speciesCode: "BEE", circleNum: 1, count: 12 },
    { speciesCode: "HOL", circleNum: 1, count: 12 },
  ];

  for (const circle of circleOrder) {
    const displayCode = getDisplayCode(circle.speciesCode);
    const lowerCode = displayCode.toLowerCase();
    for (let s = 1; s <= circle.count; s++) {
      grid.push({
        code: `${displayCode}-C${circle.circleNum}S${s}`,
        img: `/images/staffs/${lowerCode}-c${circle.circleNum}-s${s}.jpeg`,
        speciesName: SPECIES_MAP[circle.speciesCode]?.name || circle.speciesCode,
        tokenId: grid.length + 1,
      });
    }
  }

  return grid;
}

/** Check if the contract address is configured (not demo mode). */
export function isContractConfigured(): boolean {
  return !!STAFF_CONTRACT_ADDRESS;
}

export { getBaseScanUrl, getOpenSeaUrl, getMetadataUrl, STAFF_CONTRACT_ADDRESS };

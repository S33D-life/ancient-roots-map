/**
 * Borrowed Staff pool — 144 temporary staff identities arranged into
 * 12 circles of 12. Three circle archetypes: Yew, Oak, Mixed (4 each).
 *
 * This is a lightweight prototype identity pool. It is NOT the on-chain
 * Staff NFT roster — those live in `@/config/staffContract`. Borrowed
 * staffs are stable per-user once assigned, but duplicates across users
 * are allowed for now (these are archetypes a user *walks with*, not owns).
 */

export type CircleType = "Yew" | "Oak" | "Mixed";

export interface BorrowedStaffArchetype {
  staff_number: number;     // 1..144
  circle_number: number;    // 1..12
  circle_type: CircleType;
  archetype_species: string;
  temporary_name: string;
  blessing: string;
}

const CIRCLE_TYPES: CircleType[] = [
  "Yew", "Oak", "Mixed",
  "Yew", "Oak", "Mixed",
  "Yew", "Oak", "Mixed",
  "Yew", "Oak", "Mixed",
];

const SPECIES_BY_CIRCLE: Record<CircleType, string[]> = {
  Yew: ["Yew", "Holly", "Ivy", "Hazel", "Hawthorn", "Elder", "Rowan", "Birch", "Ash", "Willow", "Box", "Pine"],
  Oak: ["Oak", "Beech", "Hornbeam", "Sweet Chestnut", "Plane", "Sycamore", "Ash", "Wych Elm", "Lime", "Walnut", "Poplar", "Alder"],
  Mixed: ["Apple", "Cherry", "Pear", "Plum", "Quince", "Medlar", "Crab Apple", "Sloe", "Rose", "Elder", "Dogwood", "Spindle"],
};

const BLESSINGS: string[] = [
  "May your steps be quiet and your gaze wide.",
  "Walk slowly, listen long.",
  "What you carry now is borrowed light.",
  "The path remembers those who pause.",
  "Roots beneath, sky above, breath between.",
  "Your circle holds you, even in solitude.",
  "Each tree you meet is a small homecoming.",
  "Carry a question; let the wood answer.",
  "Be gentle with the green world today.",
  "The forest is older than the hurry.",
  "Lay down the noise and walk in.",
  "What you offer is enough.",
];

let CACHE: BorrowedStaffArchetype[] | null = null;

/** Build (and memoise) the full 144-staff pool. */
export function buildBorrowedStaffPool(): BorrowedStaffArchetype[] {
  if (CACHE) return CACHE;
  const pool: BorrowedStaffArchetype[] = [];
  for (let circle = 1; circle <= 12; circle++) {
    const circle_type = CIRCLE_TYPES[circle - 1];
    const species = SPECIES_BY_CIRCLE[circle_type];
    for (let seat = 1; seat <= 12; seat++) {
      const staff_number = (circle - 1) * 12 + seat;
      const sp = species[(seat - 1) % species.length];
      pool.push({
        staff_number,
        circle_number: circle,
        circle_type,
        archetype_species: sp,
        temporary_name: `${sp} Staff · ${staff_number}`,
        blessing: BLESSINGS[(staff_number - 1) % BLESSINGS.length],
      });
    }
  }
  CACHE = pool;
  return pool;
}

/** Return a deterministic-by-index lookup for one archetype. */
export function getBorrowedStaffArchetype(staff_number: number): BorrowedStaffArchetype | null {
  const pool = buildBorrowedStaffPool();
  return pool.find((s) => s.staff_number === staff_number) ?? null;
}

/** Pick a random staff_number 1..144. */
export function pickRandomStaffNumber(): number {
  return Math.floor(Math.random() * 144) + 1;
}

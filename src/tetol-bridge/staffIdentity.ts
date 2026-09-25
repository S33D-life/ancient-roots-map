/**
 * Staff identity — one resolver for the several Staff code spellings in use.
 *
 * Observed formats (audit, 25 Sep 2026):
 *   - Web route / Staff Room grid:  "YEW", "CHER", "YEW-C1S1"      (src/utils/staffRoomData.ts)
 *   - Notion Staff Library records: "YEW-C0S13", "Oak-C1S3", "Holy-C1S3"
 *   - staffs table comment:         "OAK-C1S03"                    (zero-padded)
 *   - formatStaffCode (on-chain):   species + GLOBAL circle id, so Yew circle 1 → "YEW-C4S1"
 *
 * Web and Notion both number circles per species, so that is the reading used
 * here. The on-chain spelling collides with Notion's Yew/Oak circle 4 and is
 * therefore never accepted as input — it is only reported as metadata.
 *
 * The canonical output is the web route code, because /staff/:code is the
 * public URL that both interfaces must agree on.
 *
 * EXPLORATORY ONLY: the canonical Staff code is an OPEN decision pending a
 * dedicated identity audit. Do not use this to normalise production identities.
 */
import { SPECIES_CODES, SPECIES_MAP, CIRCLES, type SpeciesCode } from "@/config/staffContract";
import { getDisplayCode, getGridStaffs } from "@/utils/staffRoomData";

/** Prefix spellings seen outside the app (Notion typos included) → species code. */
const PREFIX_ALIASES: Record<string, SpeciesCode> = {
  CHER: "CHERRY",
  PRIV: "PRIVET",
  WIL: "WILLOW",
  HOLY: "HOL",
  HOLLY: "HOL",
};

export interface ParsedStaffCode {
  species: SpeciesCode;
  /** Per-species circle number; 0 = Origin Spiral staff. */
  circle: number;
  /** Staff number within the circle; null for the Origin Spiral staff. */
  staff: number | null;
}

function resolveSpecies(prefix: string): SpeciesCode | null {
  const upper = prefix.toUpperCase();
  if ((SPECIES_CODES as readonly string[]).includes(upper)) return upper as SpeciesCode;
  return PREFIX_ALIASES[upper] ?? null;
}

/** Parse any known Staff spelling. Returns null when it cannot be read safely. */
export function parseStaffCode(input: string): ParsedStaffCode | null {
  const raw = input.trim();
  const circleMatch = /^([A-Za-z]+)-C(\d{1,2})S(\d{1,2})$/i.exec(raw);
  if (circleMatch) {
    const species = resolveSpecies(circleMatch[1]);
    if (!species) return null;
    const circle = Number(circleMatch[2]);
    const staff = Number(circleMatch[3]);
    // Notion records each Origin Spiral staff as C0S13 (the "13th" staff).
    if (circle === 0) return staff === 13 ? { species, circle: 0, staff: null } : null;
    if (staff < 1 || staff > 12) return null;
    return { species, circle, staff };
  }
  if (/^[A-Za-z]+$/.test(raw)) {
    const species = resolveSpecies(raw);
    return species ? { species, circle: 0, staff: null } : null;
  }
  return null;
}

/** Web route code for a parsed staff, e.g. "YEW-C1S1" or "CHER". */
export function toRouteCode(parsed: ParsedStaffCode): string {
  const display = getDisplayCode(parsed.species);
  return parsed.circle === 0 ? display : `${display}-C${parsed.circle}S${parsed.staff}`;
}

/**
 * Global circle id in the contract config (CIRCLES) for a per-species circle.
 * Informational only: contract token order has not been verified against the
 * app grid (Notion Staff Library review, 24 Sep 2026).
 */
export function contractCircleId(parsed: ParsedStaffCode): number | null {
  if (parsed.circle === 0) return 0;
  const speciesCircles = CIRCLES.filter((c) => c.speciesCode === parsed.species);
  return speciesCircles[parsed.circle - 1]?.id ?? null;
}

export interface StaffIdentity {
  routeCode: string;
  species: SpeciesCode;
  speciesName: string;
  circle: number;
  staff: number | null;
  isOriginSpiral: boolean;
  /** 1-based position in the app's 144 grid (not a verified on-chain token id). */
  gridTokenId: number;
  image: string;
  contractCircleId: number | null;
}

/**
 * Resolve a Staff that exists in the app's current registry. Staffs evidenced
 * in Notion but absent from the app (e.g. Yew/Oak circle 4) return null.
 */
export function resolveStaff(input: string): StaffIdentity | null {
  const parsed = parseStaffCode(input);
  if (!parsed) return null;
  const routeCode = toRouteCode(parsed);
  const grid = getGridStaffs();
  const index = grid.findIndex((s) => s.code === routeCode);
  if (index < 0) return null;
  const entry = grid[index];
  return {
    routeCode,
    species: parsed.species,
    speciesName: SPECIES_MAP[parsed.species]?.name ?? entry.speciesName,
    circle: parsed.circle,
    staff: parsed.staff,
    isOriginSpiral: parsed.circle === 0,
    gridTokenId: entry.tokenId,
    image: entry.img,
    contractCircleId: contractCircleId(parsed),
  };
}

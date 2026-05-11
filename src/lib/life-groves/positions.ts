/**
 * Life Grove — branch position geometry + assignment helpers.
 * Pure functions, no React, no Supabase. Used by EtherealOfferingTree
 * and by the invite page when inserting a new offering.
 *
 * Coordinate system: SVG viewBox 0..400 in both axes.
 */
import type { LifeGroveOffering } from "./types";

export interface OfferingPosition {
  branch: number;        // index into BRANCHES
  t: number;             // 0..1 along the branch path
  orbit: number;         // 0,1,2 — radial distance below branch
  side: "left" | "right"; // small lateral nudge along tangent
}

type Pt = readonly [number, number];

interface BranchDef {
  /** start (near trunk), control, end (tip) */
  s: Pt;
  c: Pt;
  e: Pt;
}

/** Five branches reaching from the trunk into the canopy. */
export const BRANCHES: ReadonlyArray<BranchDef> = [
  { s: [200, 260], c: [140, 210], e: [80, 130] },   // upper-left
  { s: [200, 260], c: [260, 210], e: [320, 130] },  // upper-right
  { s: [200, 250], c: [200, 170], e: [200, 70] },   // crown
  { s: [200, 295], c: [130, 270], e: [60, 230] },   // mid-left
  { s: [200, 295], c: [270, 270], e: [340, 230] },  // mid-right
];

export const TREE_VIEWBOX = 400;

function bezier(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

function tangent(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const x = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const y = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

/** SVG path string for a branch (used by the tree visual). */
export function branchPath(idx: number): string {
  const b = BRANCHES[idx] ?? BRANCHES[0];
  return `M ${b.s[0]} ${b.s[1]} Q ${b.c[0]} ${b.c[1]} ${b.e[0]} ${b.e[1]}`;
}

/** Resolve a stored OfferingPosition to an (x,y) point on the SVG canvas. */
export function pointFor(pos: OfferingPosition): { x: number; y: number } {
  const b = BRANCHES[pos.branch] ?? BRANCHES[0];
  const t = clamp01(pos.t);
  const [bx, by] = bezier(b.s, b.c, b.e, t);
  const [tx, ty] = tangent(b.s, b.c, b.e, t);

  // Perpendicular, biased downward so glyphs hang below the branch.
  let nx = -ty;
  let ny = tx;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }

  const radial = 10 + (pos.orbit % 3) * 7;
  const lateral = pos.side === "right" ? 4 : -4;

  return {
    x: bx + nx * radial + tx * lateral,
    y: by + ny * radial + ty * lateral,
  };
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

/** Type guard for stored memory_position_data. */
export function parsePosition(raw: unknown): OfferingPosition | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const branch = typeof r.branch === "number" ? r.branch : null;
  const t = typeof r.t === "number" ? r.t : null;
  if (branch === null || t === null) return null;
  if (branch < 0 || branch >= BRANCHES.length) return null;
  const orbit = typeof r.orbit === "number" ? r.orbit : 0;
  const side = r.side === "right" ? "right" : "left";
  return { branch, t: clamp01(t), orbit, side };
}

/**
 * Deterministically assign a position for a new offering, distributing
 * across branches and avoiding overlap with existing offerings.
 */
export function assignOfferingPosition(
  existing: LifeGroveOffering[],
): OfferingPosition {
  const counts = new Array(BRANCHES.length).fill(0);
  for (const o of existing) {
    const p = parsePosition(o.memory_position_data);
    if (p) counts[p.branch]++;
  }
  // pick the least populated branch (ties → lowest index for determinism)
  let branch = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < counts[branch]) branch = i;
  }
  const idx = counts[branch];
  // Stagger along the branch using a low-discrepancy step (golden ratio).
  const phi = 0.6180339887;
  const t = 0.22 + ((idx * phi) % 0.66);
  const side: "left" | "right" = idx % 2 === 0 ? "left" : "right";
  const orbit = Math.floor(idx / 2) % 3;
  return { branch, t, orbit, side };
}

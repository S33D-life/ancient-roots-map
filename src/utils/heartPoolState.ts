/**
 * Heart Pool State — single source of truth for heart collection eligibility.
 * 
 * Every heart is tree-bound. This module provides:
 * - Standardised state enum
 * - Pure eligibility function used everywhere
 * - No duplicated logic across views
 */

const GRACE_HOURS = 12;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;
const VISITS_KEY = "s33d-tree-visits";

// ── Canonical states ──
export type HeartPoolStatus =
  | "available_here_now"       // at tree, hearts present
  | "available_within_12h"     // within grace window, hearts present
  | "visible_not_collectable"  // hearts present but user not eligible
  | "no_hearts"                // eligible but pool is empty
  | "collected"                // just collected
  | "collecting"               // in progress
  | "expired"                  // grace window closed, was eligible before
  | "loading";

// ── Eligibility inputs ──
export interface HeartPoolContext {
  userId: string | null;
  treeId: string | undefined;
  poolHearts: number;          // total_hearts from tree_heart_pools
  isNearTree: boolean;         // proximity gate says user is within range
  isCheckedIn?: boolean;       // user has checked in at this tree
}

// ── Grace period helpers ──
export function getLastVisitTimestamp(treeId: string): number | null {
  try {
    const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || "{}");
    return visits[treeId] ?? null;
  } catch {
    return null;
  }
}

export function isWithinGracePeriod(treeId: string): boolean {
  const lastVisit = getLastVisitTimestamp(treeId);
  if (!lastVisit) return false;
  return (Date.now() - lastVisit) < GRACE_MS;
}

export function getGraceTimeRemaining(treeId: string): number {
  const lastVisit = getLastVisitTimestamp(treeId);
  if (!lastVisit) return 0;
  return Math.max(0, GRACE_MS - (Date.now() - lastVisit));
}

// ── The ONE function — used everywhere ──
export function deriveHeartPoolStatus(ctx: HeartPoolContext): HeartPoolStatus {
  if (!ctx.userId || !ctx.treeId) return "visible_not_collectable";

  const hasHearts = ctx.poolHearts > 0;
  const isHere = ctx.isNearTree || ctx.isCheckedIn === true;
  const inGrace = isWithinGracePeriod(ctx.treeId);

  if (isHere && hasHearts) return "available_here_now";
  if (inGrace && hasHearts) return "available_within_12h";
  if (hasHearts) return "visible_not_collectable";
  if (isHere || inGrace) return "no_hearts";
  return "visible_not_collectable";
}

/** Whether a given status allows collection */
export function canCollect(status: HeartPoolStatus): boolean {
  return status === "available_here_now" || status === "available_within_12h";
}

/** Human-readable guidance — single source of truth for all surfaces */
export function getHeartPoolGuidance(status: HeartPoolStatus, poolHearts: number): string {
  const p = poolHearts !== 1 ? "s" : "";
  switch (status) {
    case "available_here_now":
      return `${poolHearts} heart${p} waiting here`;
    case "available_within_12h":
      return `${poolHearts} heart${p} · collect within your window`;
    case "visible_not_collectable":
      return poolHearts > 0
        ? `${poolHearts} heart${p} · visit to collect`
        : "Hearts accumulate as wanderers visit";
    case "no_hearts":
      return "No hearts available right now";
    case "collected":
      return "Hearts gathered ✨";
    case "collecting":
      return "Gathering hearts…";
    case "expired":
      return "Visit again to collect hearts";
    default:
      return "";
  }
}

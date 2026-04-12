/**
 * Curator overrides — localStorage layer on top of base councilCycles.ts.
 *
 * Pattern: base data stays in code, curator drafts live in localStorage.
 * Future: swap localStorage for Supabase row per council.
 */

import type { CouncilSession } from "./councilCycles";
import { COUNCIL_CYCLES, getCurrentCouncil as getBaseCurrent, getNextCouncil as getBaseNext } from "./councilCycles";

const STORAGE_KEY = "s33d-council-overrides";

export type CouncilOverride = Partial<Omit<CouncilSession, "id" | "moonPhase" | "markerDate" | "gatheringDate">>;

/** Read all overrides from localStorage */
function readOverrides(): Record<string, CouncilOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist overrides to localStorage */
function writeOverrides(overrides: Record<string, CouncilOverride>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/** Deep-merge a single override onto a base council session */
function applyOverride(base: CouncilSession, override: CouncilOverride): CouncilSession {
  return {
    ...base,
    ...override,
    agenda: {
      ...base.agenda,
      ...(override.agenda ?? {}),
      focusAreas: override.agenda?.focusAreas ?? base.agenda.focusAreas,
    },
    highlights: {
      ...base.highlights,
      ...(override.highlights ?? {}),
    },
  };
}

/** Get a council session with any curator overrides applied */
export function getCouncilWithOverrides(id: string): CouncilSession | null {
  const base = COUNCIL_CYCLES.find((c) => c.id === id);
  if (!base) return null;
  const overrides = readOverrides();
  const override = overrides[id];
  return override ? applyOverride(base, override) : base;
}

/** getCurrentCouncil with overrides applied */
export function getCurrentCouncilWithOverrides(): CouncilSession {
  const base = getBaseCurrent();
  const overrides = readOverrides();
  const override = overrides[base.id];
  return override ? applyOverride(base, override) : base;
}

/** getNextCouncil with overrides applied */
export function getNextCouncilWithOverrides(): CouncilSession | null {
  const base = getBaseNext();
  if (!base) return null;
  const overrides = readOverrides();
  const override = overrides[base.id];
  return override ? applyOverride(base, override) : base;
}

/** Save a curator draft for a specific council */
export function saveCuratorOverride(id: string, override: CouncilOverride) {
  const overrides = readOverrides();
  overrides[id] = override;
  writeOverrides(overrides);
}

/** Remove curator override, reverting to base data */
export function resetCuratorOverride(id: string) {
  const overrides = readOverrides();
  delete overrides[id];
  writeOverrides(overrides);
}

/** Check if a council has active curator overrides */
export function hasCuratorOverride(id: string): boolean {
  const overrides = readOverrides();
  return id in overrides;
}

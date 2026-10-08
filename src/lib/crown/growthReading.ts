/**
 * Plain-word readings of a growth record for the Crown journey.
 * Maturity and engineering state are read separately and never merged.
 */
import { IMPLEMENTATION_LABEL, MATURITY_LABEL, type CrownGrowth, type GrowthSeam, type ImplementationState } from "@/data/crown/growths";

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Growing · touches 4 realms · a decision is waiting" — maturity only, no engineering words. */
export function growthLine(growth: CrownGrowth) {
  return `${MATURITY_LABEL[growth.maturity]} · touches ${plural(growth.realms.touched.length, "realm", "realms")}`
    + (growth.nextDecisions.length > 0 ? " · a decision is waiting" : "");
}

/** "9 recorded surfaces · 8 merged, 1 held": engineering state, named as such. */
export function restsOn(seams: readonly GrowthSeam[]) {
  const counts = new Map<ImplementationState, number>();
  for (const s of seams) counts.set(s.state, (counts.get(s.state) ?? 0) + 1);
  const tally = [...counts].map(([state, n]) => `${n} ${IMPLEMENTATION_LABEL[state].toLowerCase()}`).join(", ");
  return `${plural(seams.length, "recorded surface", "recorded surfaces")}${tally ? ` · ${tally}` : ""}`;
}

/** Public-safe open items, each with the seam it belongs to. */
export function openItems(growth: CrownGrowth) {
  return growth.seams.flatMap(seam => (seam.open ?? []).map(item => ({ seam, item })));
}

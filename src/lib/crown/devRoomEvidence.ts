/**
 * Dev Room evidence — what has actually been built, tested, merged or held.
 *
 * Derived from the growth record's references and the build serving this page.
 * It never decides maturity, and it never claims "live" without a match on
 * the recorded release line.
 */
import type { CrownGrowth, GrowthSeam } from "@/data/crown/growths";

declare const __BUILD_ID__: string | undefined;

export function servingBuild(): string | null {
  try {
    return typeof __BUILD_ID__ === "string" && __BUILD_ID__ ? __BUILD_ID__ : null;
  } catch {
    return null;
  }
}

const sameCommit = (a: string, b: string) => {
  const x = a.toLowerCase(), y = b.toLowerCase();
  return Math.min(x.length, y.length) >= 7 && (x.startsWith(y) || y.startsWith(x));
};

export type BuildPlacement =
  | { kind: "unknown" }
  | { kind: "placed"; index: number; label: string }
  | { kind: "elsewhere"; build: string };

/** Place a build on the release line (ancestry order, oldest first). */
export function placeBuild(build: string | null, line: CrownGrowth["releaseLine"]): BuildPlacement {
  if (!build) return { kind: "unknown" };
  const index = line.points.findIndex(p => sameCommit(p.sha, build));
  if (index < 0) return { kind: "elsewhere", build };
  return { kind: "placed", index, label: line.points[index].label };
}

/** Whether a seam's merge is contained in the build, when that can be known. */
export function seamInBuild(seam: GrowthSeam, placement: BuildPlacement, line: CrownGrowth["releaseLine"]): boolean | null {
  if (!seam.mergeSha || placement.kind !== "placed") return null;
  const mergeIndex = line.points.findIndex(p => sameCommit(p.sha, seam.mergeSha!));
  if (mergeIndex < 0) return null;
  return mergeIndex <= placement.index;
}

export interface StillOpen { seam: GrowthSeam; reason: string }

/** Seams that are candidate, held, or merged but not in the serving build. */
export function stillOpen(growth: CrownGrowth, placement: BuildPlacement): StillOpen[] {
  return growth.seams.flatMap<StillOpen>(seam => {
    if (seam.state === "testing" || seam.state === "branch" || seam.state === "proposed" || seam.state === "research") {
      return [{ seam, reason: "Candidate, not merged" }];
    }
    if (seam.state === "blocked") return [{ seam, reason: "Held" }];
    if (seam.state === "merged") {
      const inBuild = seamInBuild(seam, placement, growth.releaseLine);
      if (inBuild === false) return [{ seam, reason: "Merged, not in this build" }];
      if (inBuild === null) return [{ seam, reason: "Merged; deployment not shown here" }];
    }
    return [];
  });
}

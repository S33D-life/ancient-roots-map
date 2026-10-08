import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";
import {
  CROWN_GROWTHS, GROWTH_MATURITY, IMPLEMENTATION_STATES, ONE_CIRCLE_MANY_SURFACES as G, findGrowth,
} from "@/data/crown/growths";
import { taprootContext } from "@/lib/crown/taprootContext";
import { placeBuild, seamInBuild, stillOpen } from "@/lib/crown/devRoomEvidence";
import { ROADMAP_FEATURES } from "@/data/roadmap-forest";
import { ROUTES } from "@/lib/routes";

const repo = (p: string) => resolve(process.cwd(), p);

describe("Crown growth record", () => {
  it("holds One Circle · Many Surfaces at Growing, as set by TEOTAG", () => {
    expect(findGrowth("one-circle-many-surfaces")).toBe(G);
    expect(G.maturity).toBe("growing");
    expect(GROWTH_MATURITY).toContain(G.maturity);
    expect(ROUTES.CROWN_GROWTH(G.id)).toBe("/golden-dream/growth/one-circle-many-surfaces");
  });

  it("keeps maturity and implementation state in separate vocabularies", () => {
    for (const s of G.seams) expect(IMPLEMENTATION_STATES).toContain(s.state);
    const overlap = GROWTH_MATURITY.filter(m => (IMPLEMENTATION_STATES as readonly string[]).includes(m));
    expect(overlap).toEqual([]);
  });

  it("points to evidence that exists in this repository", () => {
    expect(existsSync(repo(G.sourceOfTruth.path))).toBe(true);
    for (const r of G.sourceOfTruth.readers) expect(existsSync(repo(r.path)), r.path).toBe(true);
    for (const s of G.seams) for (const e of s.evidence) {
      if (!e.onBranch) expect(existsSync(repo(e.path)), e.path).toBe(true);
    }
  });

  it("uses commit references, not prose, for engineering identity", () => {
    const hex = /^[0-9a-f]{7,40}$/;
    for (const p of G.releaseLine.points) expect(p.sha).toMatch(hex);
    for (const s of G.seams) {
      s.commits.forEach(c => expect(c).toMatch(hex));
      if (s.mergeSha) expect(s.mergeSha).toMatch(hex);
    }
  });

  it("relates the Current Circle instead of copying it", () => {
    const text = JSON.stringify(CROWN_GROWTHS);
    expect(text).not.toContain(CURRENT_CIRCLE.question);
    expect(text).not.toContain(CURRENT_CIRCLE.revision);
    expect(text).not.toContain(CURRENT_CIRCLE.openLine);
    expect(text).not.toContain(CURRENT_CIRCLE.safety);
  });

  it("ships only public-safe wording", () => {
    const text = JSON.stringify(CROWN_GROWTHS).toLowerCase();
    for (const word of ["credential", "secret", "password", "token", "vulnerab", "exploit", "rls", "service role", "private key"]) {
      expect(text, word).not.toContain(word);
    }
  });
});

describe("Taproot context", () => {
  it("derives source-of-truth facts from the imported Current Circle", () => {
    const t = taprootContext(G);
    expect(t.source.approved).toBe(CURRENT_CIRCLE.approval === "approved");
    expect(t.source.revision).toBe(CURRENT_CIRCLE.revision);
    expect(t.source.circleNumber).toBe(CURRENT_CIRCLE.number);
    expect(t.source.approvedDestinations).toBeGreaterThan(0);
  });

  it("follows a draft Circle rather than a stored value", () => {
    const t = taprootContext(G, { ...CURRENT_CIRCLE, approval: "draft", revision: "draft-x" });
    expect(t.source.approved).toBe(false);
    expect(t.source.revision).toBe("draft-x");
  });

  it("resolves the Living Roadmap feature the Agent Garden already links to", () => {
    const t = taprootContext(G);
    const feature = ROADMAP_FEATURES.find(f => f.id === G.roadmapFeatureId);
    expect(feature).toBeDefined();
    expect(t.feature?.name).toBe(feature?.name);
    expect(t.feature?.route).toBe(ROUTES.COUNCIL);
  });
});

describe("Dev Room evidence", () => {
  const line = G.releaseLine;

  it("treats an unknown build as unknown", () => {
    expect(placeBuild(null, line)).toEqual({ kind: "unknown" });
    const open = stillOpen(G, { kind: "unknown" });
    expect(open.find(o => o.seam.id === "website")?.reason).toBe("Merged; deployment not shown here");
  });

  it("places the last verified production build before every merge in this growth", () => {
    const p = placeBuild("ce9bab5", line);
    expect(p).toMatchObject({ kind: "placed", index: 0 });
    for (const s of G.seams.filter(s => s.mergeSha)) expect(seamInBuild(s, p, line)).toBe(false);
    expect(stillOpen(G, p).map(o => o.reason)).toContain("Merged, not in this build");
  });

  it("includes merges up to the serving point and no further", () => {
    const p = placeBuild("2d5393df", line);
    const deck = G.seams.find(s => s.id === "deck-doorway")!;
    const invitation = G.seams.find(s => s.id === "invitation")!;
    expect(seamInBuild(deck, p, line)).toBe(true);
    expect(seamInBuild(invitation, p, line)).toBe(false);
  });

  it("never claims a build that is not on the release line", () => {
    expect(placeBuild("abcdef1", line)).toEqual({ kind: "elsewhere", build: "abcdef1" });
    expect(placeBuild("abc", line)).toEqual({ kind: "elsewhere", build: "abc" });
  });

  it("always reports held seams as open, even at the reviewed release head", () => {
    const p = placeBuild("9055912a", line);
    const open = stillOpen(G, p);
    expect(open.map(o => o.seam.id)).toEqual(["growth-folio", "release-reconciliation", "telegram"]);
  });

  it("records corrected Folio, reconciliation and publication without promoting maturity or live verification", () => {
    expect(G.releaseLine.points.slice(-4).map(p => p.sha)).toEqual([
      "db3dfa7a51fb24412cd4e6bfa8630cf9908fef87", "4e3281de8854cef05c21ce115898ec002190fc83",
      "84716ebd7984cf4657b8d2ea8da9423f35f6c672", "da5209feae985426c86bcad9d27cd2a1c02ae815",
    ]);
    expect(G.seams.find(s => s.pr === 88)?.state).toBe("merged");
    expect(G.seams.find(s => s.pr === 89)?.state).toBe("merged");
    expect(G.maturity).toBe("growing");
    expect(G.seams.some(s => s.state === "verified")).toBe(false);
    expect(G.nextDecisions.join(" ")).not.toContain("Production still serves an earlier build");
    expect(seamInBuild(G.seams.find(s => s.pr === 88)!, placeBuild("84716ebd", line), line)).toBe(true);
  });

  it("places the #87 static 3D inheritance after #86 on the release line", () => {
    const p = placeBuild("9e478d18", line);
    const staticSeam = G.seams.find(s => s.id === "static-3d")!;
    expect(staticSeam.state).toBe("merged");
    expect(seamInBuild(staticSeam, p, line)).toBe(false);
    expect(seamInBuild(staticSeam, placeBuild("9055912a", line), line)).toBe(true);
  });
});

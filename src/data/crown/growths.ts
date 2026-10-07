/**
 * Crown growth records — repo-backed, static, read-only.
 *
 * A growth record says what is asking to grow and *points* to the evidence that
 * already lives elsewhere (Current Circle, git history, checked-in candidate
 * docs). It never re-types values owned by another source: Current Circle
 * fields are imported by `taprootContext`, the serving build comes from
 * `__BUILD_ID__`, and Agent Garden tasks are read live.
 *
 * Public-safe only: everything here ships in the client bundle. No private
 * notes, credentials, security findings or unreleased personal material.
 * UI gating is not privacy.
 */
import { ROUTES } from "@/lib/routes";

/** Public growth maturity (Crown lifecycle). Never derived from engineering state. */
export const GROWTH_MATURITY = ["ember", "thread", "seed", "growing", "ripening", "fruit"] as const;
export type GrowthMaturity = (typeof GROWTH_MATURITY)[number];

export const MATURITY_LABEL: Record<GrowthMaturity, string> = {
  ember: "Ember", thread: "Thread", seed: "Seed", growing: "Growing", ripening: "Ripening", fruit: "Fruit",
};

/** Implementation state (Dev Room). Kept separate from maturity. */
export const IMPLEMENTATION_STATES = [
  "research", "proposed", "branch", "testing", "blocked", "merged", "deployed", "verified",
] as const;
export type ImplementationState = (typeof IMPLEMENTATION_STATES)[number];

export const IMPLEMENTATION_LABEL: Record<ImplementationState, string> = {
  research: "Research", proposed: "Proposed", branch: "On a branch", testing: "Candidate · testing",
  blocked: "Held", merged: "Merged", deployed: "Deployed", verified: "Verified live",
};

export type GrowthRealm = "roots" | "heartwood" | "canopy" | "crown" | "taproot" | "embodied-tetol";

/** A repository path, optionally only present on a named branch. */
export interface EvidenceDoc { path: string; onBranch?: string }

export interface GrowthSeam {
  id: string;
  /** Step in the growth's lineage, in plain words. */
  surface: string;
  state: ImplementationState;
  branch?: string;
  commits: readonly string[];
  pr?: number;
  mergeSha?: string;
  /** Checked-in evidence documents. Related, not copied. */
  evidence: readonly EvidenceDoc[];
  /** What the evidence document records about testing, in one public line. */
  testsRecorded?: string;
  /** Public-safe open items for this seam. */
  open?: readonly string[];
}

export interface CrownGrowth {
  id: string;
  title: string;
  /** Why the title is provisional, when it is. */
  titleNote?: string;
  subtitle: string;
  maturity: GrowthMaturity;
  maturitySetBy: { by: string; date: string };
  origin: readonly string[];
  realms: {
    touched: readonly { realm: GrowthRealm; weight: "primary" | "secondary" | "light" | "pending"; where: string }[];
    notTouched: readonly string[];
  };
  /** Relationship key into `ROADMAP_FEATURES` and `agent_garden_tasks.roadmap_feature_slug`. */
  roadmapFeatureId: string;
  /** Files that read the shared source of truth (Taproot wiring). */
  sourceOfTruth: { path: string; readers: readonly { path: string; role: string }[] };
  /** Release line in ancestry order, oldest first. Verified by `npm run crown:growth:check`. */
  releaseLine: { branch: string; points: readonly { sha: string; label: string }[] };
  seams: readonly GrowthSeam[];
  /** Specialist work routed by hand until connected routing exists. */
  handoffs: readonly { lane: string; tended: string; returned: string }[];
  heartwood: { remembered: readonly { label: string; route: string }[]; notYet: string };
  nextDecisions: readonly string[];
}

export const ONE_CIRCLE_MANY_SURFACES: CrownGrowth = {
  id: "one-circle-many-surfaces",
  title: "One Circle · Many Surfaces",
  titleNote: "A working name for this example, not a canonical one.",
  subtitle: "Current Circle shared-state reconciliation",
  maturity: "growing",
  maturitySetBy: { by: "TEOTAG", date: "2026-10-07" },
  origin: [
    "Council of Life · Circle 235 opened as an open Circle that people step into from wherever they are.",
    "The same Circle details were being written separately into the website, the Telegram copy, the invitation and the 3D Council.",
    "This growth gathers them into one approved Current Circle that every surface reads, so each place tells the same truth.",
  ],
  realms: {
    touched: [
      { realm: "canopy", weight: "primary", where: "Council of Life page, Council Deck doorway, Telegram Council command" },
      { realm: "taproot", weight: "secondary", where: "Shared Current Circle module, publishing boundary, invitation freshness check" },
      { realm: "heartwood", weight: "light", where: "Checked-in invitation, regenerated from the Current Circle" },
      { realm: "embodied-tetol", weight: "light", where: "Static 3D Council labels, destinations and return path (geometry unchanged)" },
    ],
    notTouched: [
      "Ancient Friends tree records (the Holm Oak appears by name only)",
      "Heartwood memory records and Offering saving",
      "Hearts",
      "Sign-in and invitations",
      "Database schema",
      "Notion pages",
      "Telegram sending",
    ],
  },
  roadmapFeatureId: "council",
  sourceOfTruth: {
    path: "supabase/functions/_shared/currentCircle.ts",
    readers: [
      { path: "src/data/council/circle235Doorway.ts", role: "Website adapter" },
      { path: "src/components/council/NextCouncilCard.tsx", role: "2D Council card" },
      { path: "src/components/council/CouncilDeckDoorway.tsx", role: "Council Deck doorway" },
      { path: "src/lib/council/currentCircleShare.ts", role: "Invitation / share projection" },
      { path: "supabase/functions/_shared/councilPublishing.ts", role: "Telegram publishing boundary" },
      { path: "src/lib/council/staticCouncilAdapter.ts", role: "Static 3D Council adapter" },
    ],
  },
  releaseLine: {
    branch: "codex/circle-235-open-journey",
    points: [
      { sha: "ce9bab52935cbce2174bfa15454e6d907d7e8668", label: "Last verified production source" },
      { sha: "cc4b0148ab21", label: "#84 release base reconciled" },
      { sha: "c54971970131", label: "#80 Current Circle + Telegram path" },
      { sha: "2d5393df75b3", label: "#85 Council Deck doorway" },
      { sha: "9e478d18fb0143834e96a855d2b21a3026a65281", label: "#86 checked-in invitation" },
      { sha: "9055912a04acd83b21a3aad9abd37e6d92e37f46", label: "#87 static 3D Council inheritance · reviewed release head" },
    ],
  },
  seams: [
    {
      id: "current-circle", surface: "Current Circle", state: "merged",
      branch: "codex/current-circle-telegram", commits: ["10b83456cc9c", "21317863023d"], pr: 80, mergeSha: "c54971970131",
      evidence: [{ path: "docs/council/Current-Circle-Telegram-candidate.md" }],
      testsRecorded: "Full release-check recorded: 378 tests across 49 files.",
    },
    {
      id: "website", surface: "Website · Council of Life card", state: "merged",
      branch: "codex/current-circle-telegram", commits: ["10b83456cc9c"], pr: 80, mergeSha: "c54971970131",
      evidence: [{ path: "docs/council/Current-Circle-Telegram-candidate.md" }],
      testsRecorded: "Built desktop and phone checks recorded in the candidate doc.",
    },
    {
      id: "telegram", surface: "Telegram publishing path", state: "blocked",
      branch: "codex/current-circle-telegram", commits: ["dc39fac6a4e3", "0a90bf0c79d3"], pr: 80, mergeSha: "c54971970131",
      evidence: [{ path: "docs/council/Current-Circle-Telegram-candidate.md" }],
      testsRecorded: "Preview and private-publish boundary tests recorded (20 new).",
      open: ["Code is merged; sending stays held behind a server-side gate until an operational prerequisite is met and a send is explicitly approved."],
    },
    {
      id: "council-2d", surface: "2D Council", state: "merged",
      branch: "codex/current-circle-council-deck", commits: ["b069cef8f064"], pr: 85, mergeSha: "2d5393df75b3",
      evidence: [{ path: "docs/council/Current-Circle-Council-Deck-candidate.md" }],
      testsRecorded: "Full release-check recorded: 394 tests across 52 files.",
    },
    {
      id: "deck-doorway", surface: "Council Deck doorway", state: "merged",
      branch: "codex/current-circle-council-deck", commits: ["b069cef8f064"], pr: 85, mergeSha: "2d5393df75b3",
      evidence: [{ path: "docs/council/Current-Circle-Council-Deck-candidate.md" }],
      testsRecorded: "Six Deck doorway tests; phone viewport 390×844 recorded.",
    },
    {
      id: "invitation", surface: "Checked-in invitation", state: "merged",
      branch: "codex/current-circle-share-projection", commits: ["39cfba299886"], pr: 86, mergeSha: "9e478d18fb01",
      evidence: [{ path: "docs/council/Current-Circle-share-reconciliation.md" }, { path: "docs/council/Circle-235-Telegram-invitation.md" }],
      testsRecorded: "Share projection tests; invitation freshness checked in release-check.",
      open: ["The external share pack keeps its own manifest and is not yet wired to the Current Circle."],
    },
    {
      id: "static-3d", surface: "3D Council inheritance", state: "merged",
      branch: "codex/current-circle-static-council", commits: ["87a15a022c88", "234c96e6e6d3", "2bda8b834194"], pr: 87, mergeSha: "9055912a04ac",
      evidence: [{ path: "docs/council/Current-Circle-static-seam.md" }],
      testsRecorded: "Static adapter unit tests; bounded static Council browser regression at desktop and phone widths in CI. Full 3D renderer checked locally only.",
      open: ["Labels and destinations only; static companion names and learning threads remain duplicated by design."],
    },
  ],
  handoffs: [
    { lane: "Codex", tended: "Current Circle, Telegram path, Deck doorway, invitation, 3D seam", returned: "Branches, merged pull requests and candidate docs" },
    { lane: "Claude Code", tended: "Crown and Taproot integration audits", returned: "Audit documents in the project" },
    { lane: "Claude Design", tended: "Living Canopy and Growth Folio grammar", returned: "Design artifact" },
    { lane: "TEOTAG", tended: "Briefs, wording and maturity decisions", returned: "Approvals recorded with each pass" },
  ],
  heartwood: {
    remembered: [
      { label: "Council records", route: ROUTES.COUNCIL_RECORDS },
      { label: "Council of Life", route: ROUTES.COUNCIL },
    ],
    notYet: "This growth's decisions and learning are not yet kept as a Heartwood record. Engineering evidence stays in the repository and is related here, not copied.",
  },
  nextDecisions: [
    "Whether the release line is deployed. Production still serves an earlier build.",
    "When, if ever, Telegram may send. Code is ready; sending is held.",
    "Where Heartwood should remember this growth's decisions.",
  ],
};

export const CROWN_GROWTHS: readonly CrownGrowth[] = [ONE_CIRCLE_MANY_SURFACES];

export const findGrowth = (id: string | undefined) => CROWN_GROWTHS.find(g => g.id === id);

/**
 * Spark / Bug Bounty quest config.
 *
 * Spark is the contribution layer: ideas, bug reports, tests, fixes,
 * prompts, and little flashes that help S33D grow. Bug Bounty is a
 * structured Spark quest type — report, verify, or help fix bugs and
 * earn prepared heart-flow rewards.
 *
 * Pure config; no claiming logic. Reward statuses follow the safe
 * vocabulary defined in rewardTypes.ts.
 *
 * Garden language only:
 *   thorns · clearing paths · tending · verifying · strengthening the trail
 */
import type { QuestRewardFlow } from "./rewardTypes";

export type SparkQuestKind =
  | "report"          // submit a bug / improvement
  | "test"            // walk a sacred path
  | "improve"         // copy / label / empty state fix
  | "verify"          // confirm a fix
  | "triage";         // link to GitHub / technical triage

export interface SparkQuestSeed {
  id: string;
  kind: SparkQuestKind;
  title: string;
  /** Garden-flavoured description shown on the card */
  hint: string;
  goal: number;
  rewardFlow: QuestRewardFlow;
}

export const SPARK_QUESTS: SparkQuestSeed[] = [
  {
    id: "spark-first-thorn",
    kind: "report",
    title: "Find Your First Thorn",
    hint: "Report one bug or broken experience so the path becomes clearer for others.",
    goal: 1,
    rewardFlow: {
      baseHeartsLabel: "+11 for tending the trail",
      bonusHearts: 33,
      valueTreeBranch: "Spark Path / Builder Branch",
      verificationLevel: "Seed",
    },
  },
  {
    id: "spark-three-thorns",
    kind: "report",
    title: "Clear Three Thorns",
    hint: "Submit three useful bug reports with clear steps, screenshots, or route details.",
    goal: 3,
    rewardFlow: {
      baseHeartsLabel: "+11 per cleared thorn",
      bonusHearts: 99,
      valueTreeBranch: "Bug Garden / Curator Branch",
      verificationLevel: "Rooted",
    },
  },
  {
    id: "spark-sacred-path",
    kind: "test",
    title: "Test a Sacred Path",
    hint: "Walk a full journey: map a tree, leave an offering, send or collect a whisper, and return to Heartwood.",
    goal: 1,
    rewardFlow: {
      baseHeartsLabel: "+11 for a full circle",
      bonusHearts: 33,
      valueTreeBranch: "Quality / Pilgrim / Builder",
      verificationLevel: "Rooted",
    },
  },
  {
    id: "spark-trail-marker",
    kind: "improve",
    title: "Fix a Trail Marker",
    hint: "Improve unclear copy, labels, buttons, empty states, or route guidance.",
    goal: 1,
    rewardFlow: {
      baseHeartsLabel: "+11 for clearer wayfinding",
      bonusHearts: 33,
      valueTreeBranch: "Creator / Curator",
      verificationLevel: "Rooted",
    },
  },
  {
    id: "spark-verify-fix",
    kind: "verify",
    title: "Verify a Fix",
    hint: "Confirm that a reported bug has been resolved and the path is safe again.",
    goal: 1,
    rewardFlow: {
      baseHeartsLabel: "+11 for trusted witness",
      bonusHearts: 33,
      valueTreeBranch: "Trust / Curator",
      verificationLevel: "Council Verified",
    },
  },
  {
    id: "spark-grove-keeper",
    kind: "triage",
    title: "Open Source Grove Keeper",
    hint: "Help link Bug Garden reports with GitHub issues or development tasks.",
    goal: 1,
    rewardFlow: {
      baseHeartsLabel: "+33 for tending the source",
      bonusHearts: 99,
      valueTreeBranch: "Builder / Agentic Garden",
      verificationLevel: "Ancient",
    },
  },
];

/** Suggested fields for a quality bug report — visible quality ladder. */
export const BUG_REPORT_QUALITY_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  ladder: "Seed" | "Rooted" | "Ancient" | "Council Verified";
}> = [
  { key: "title",          label: "Bug title",                  ladder: "Seed" },
  { key: "route",          label: "Route / page affected",      ladder: "Seed" },
  { key: "what_happened",  label: "What happened",              ladder: "Seed" },
  { key: "expected",       label: "What should have happened",  ladder: "Rooted" },
  { key: "steps",          label: "Steps to reproduce",         ladder: "Rooted" },
  { key: "screenshot",     label: "Screenshot / recording",     ladder: "Rooted" },
  { key: "device",         label: "Device / browser",           ladder: "Rooted" },
  { key: "severity",       label: "Severity",                   ladder: "Rooted" },
  { key: "cause",          label: "Likely cause / component",   ladder: "Ancient" },
  { key: "github_issue",   label: "Linked GitHub issue",        ladder: "Ancient" },
  { key: "verified_by",    label: "Verified by",                ladder: "Council Verified" },
];

/** Whisper lines surfaced near the Spark / Bug Bounty card. */
export const SPARK_WHISPERS: ReadonlyArray<string> = [
  "Every cleared thorn makes the path easier for the next wanderer.",
  "Spark turns small improvements into visible care.",
  "Bug bounties feed the Builder Branch of the Value Tree.",
];

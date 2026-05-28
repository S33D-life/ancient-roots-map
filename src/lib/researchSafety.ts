/**
 * Research Safety Rules — enforced at write time for all agent-ingested content.
 *
 * These rules protect users from:
 *   - unsourced medical claims
 *   - folklore presented as ecological fact
 *   - speculative identification clues without confidence flagging
 *   - unattributed ceremonial / sacred knowledge
 *
 * Usage:
 *   import { validateStagingEntry, SAFETY_RULES } from "@/lib/researchSafety";
 *   const issues = validateStagingEntry(entry);
 *   if (issues.length > 0) { // block submission }
 */

import type { ResearchStagingEntryInsert } from "@/types/research";

// ─── Rule definitions ─────────────────────────────────────────────────────────

export interface SafetyRule {
  id: string;
  title: string;
  description: string;
  /** Blocks automatic promotion to production if violated */
  blocks_promotion: boolean;
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: "cite_sources",
    title: "Cite your sources",
    description:
      "Every content claim must be backed by at least one source URL or source_id. " +
      "Entries with zero sources receive confidence_score ≤ 0.3 automatically.",
    blocks_promotion: true,
  },
  {
    id: "medical_caution",
    title: "Medical / edible claims require a caution flag",
    description:
      "If medicinal_edible_notes is non-empty, contains_medical_claims must be true " +
      "AND medical_caution_added must be true. The UI renders a caution banner automatically.",
    blocks_promotion: true,
  },
  {
    id: "flag_uncertainty",
    title: "Flag uncertainty explicitly",
    description:
      "If confidence_score < 0.6, uncertainty_flagged must be true. " +
      "Use language like 'may', 'reportedly', 'traditionally believed' in notes.",
    blocks_promotion: false, // warning, not a blocker
  },
  {
    id: "separate_lore",
    title: "Keep mythic/ceremonial notes separate from ecological facts",
    description:
      "Folklore, ceremonial use, and mythic associations must go in folklore_mythic_notes " +
      "— never inline in ecology_notes or identification_clues. " +
      "lore_separated_from_fact must be true when both fields are present.",
    blocks_promotion: true,
  },
  {
    id: "no_unsourced_lore",
    title: "Never present unsourced lore as fact",
    description:
      "If folklore_mythic_notes is non-empty and source reliability tier is 3 (folklore), " +
      "unsourced_lore_present must be true and the entry cannot auto-approve.",
    blocks_promotion: true,
  },
  {
    id: "confidence_floor",
    title: "Minimum confidence for ID flow eligibility",
    description:
      "Entries targeting target_id_flow must have confidence_score ≥ 0.7. " +
      "Uncertain ID clues can mislead learners.",
    blocks_promotion: true,
  },
  {
    id: "ancient_friends_sensitivity",
    title: "Ancient Friends content must be ecologically grounded",
    description:
      "Entries targeting ancient_friends_visible must include ecology_notes or habitat_notes. " +
      "Ancient Friends encounters should connect to real tree behaviour.",
    blocks_promotion: false,
  },
];

// ─── Validation ───────────────────────────────────────────────────────────────

export interface SafetyViolation {
  rule_id: string;
  message: string;
  severity: "error" | "warning";
}

export function validateStagingEntry(
  entry: Partial<ResearchStagingEntryInsert>,
): SafetyViolation[] {
  const violations: SafetyViolation[] = [];

  // Rule: cite_sources
  const hasSources =
    (entry.source_ids && entry.source_ids.length > 0) ||
    (entry.source_urls && entry.source_urls.length > 0);
  if (!hasSources) {
    violations.push({
      rule_id: "cite_sources",
      message: "No sources provided. Add at least one source URL or source ID.",
      severity: "error",
    });
  }

  // Rule: medical_caution
  if (entry.medicinal_edible_notes && entry.medicinal_edible_notes.trim().length > 0) {
    if (!entry.contains_medical_claims) {
      violations.push({
        rule_id: "medical_caution",
        message: "medicinal_edible_notes is present but contains_medical_claims is not set.",
        severity: "error",
      });
    }
    if (!entry.medical_caution_added) {
      violations.push({
        rule_id: "medical_caution",
        message:
          "Medical/edible notes require medical_caution_added = true so the UI renders the safety banner.",
        severity: "error",
      });
    }
  }

  // Rule: flag_uncertainty
  const confidence = entry.confidence_score ?? 0.5;
  if (confidence < 0.6 && !entry.uncertainty_flagged) {
    violations.push({
      rule_id: "flag_uncertainty",
      message: `Confidence is ${confidence.toFixed(2)} (< 0.6) but uncertainty_flagged is not set.`,
      severity: "warning",
    });
  }

  // Rule: separate_lore
  const hasEcology = entry.ecology_notes && entry.ecology_notes.trim().length > 0;
  const hasLore = entry.folklore_mythic_notes && entry.folklore_mythic_notes.trim().length > 0;
  if (hasEcology && hasLore && !entry.lore_separated_from_fact) {
    violations.push({
      rule_id: "separate_lore",
      message:
        "Both ecology_notes and folklore_mythic_notes are present. Set lore_separated_from_fact = true to confirm they are intentionally separate.",
      severity: "error",
    });
  }

  // Rule: no_unsourced_lore — flag if lore present without high-tier sources
  // (Full check requires source records; here we check the flag state)
  if (hasLore && entry.unsourced_lore_present) {
    violations.push({
      rule_id: "no_unsourced_lore",
      message:
        "unsourced_lore_present is set — this entry cannot be auto-approved. Human review required.",
      severity: "warning",
    });
  }

  // Rule: confidence_floor for ID flow
  if (entry.target_id_flow && confidence < 0.7) {
    violations.push({
      rule_id: "confidence_floor",
      message: `ID flow entries require confidence ≥ 0.7. Current: ${confidence.toFixed(2)}.`,
      severity: "error",
    });
  }

  // Rule: ancient_friends_sensitivity
  if (entry.target_ancient_friends && !hasEcology && !entry.habitat_notes) {
    violations.push({
      rule_id: "ancient_friends_sensitivity",
      message:
        "Ancient Friends entries should include ecology_notes or habitat_notes to ground the encounter in real tree behaviour.",
      severity: "warning",
    });
  }

  return violations;
}

/** Returns true if any blocking violations exist (entry cannot be promoted) */
export function hasBlockingViolations(violations: SafetyViolation[]): boolean {
  return violations.some((v) => v.severity === "error");
}

// ─── UI copy helpers ──────────────────────────────────────────────────────────

export const CONFIDENCE_LABELS: Record<string, string> = {
  high:   "Well-sourced (≥ 0.8)",
  medium: "Plausible (0.5–0.79)",
  low:    "Speculative (< 0.5)",
};

export function confidenceLabel(score: number): keyof typeof CONFIDENCE_LABELS {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export const RELIABILITY_LABELS: Record<number, string> = {
  1: "Academic / Institutional",
  2: "Reputable / Herbarium",
  3: "Folklore / Oral tradition",
};

/** The medical disclaimer rendered below every medicinal_edible_notes block */
export const MEDICAL_DISCLAIMER =
  "This information is for educational purposes only and does not constitute medical or nutritional advice. " +
  "Always consult a qualified practitioner before consuming or applying any plant material. " +
  "Identification errors can be life-threatening.";

/** Rendered above folklore_mythic_notes in the UI */
export const LORE_DISCLAIMER =
  "The following notes draw on folkloric, mythic, and cultural memory. " +
  "They are kept separate from ecological fact and reflect traditional associations, not verified science.";

/** System prompt preamble injected into agent research requests */
export const AGENT_RESEARCH_SYSTEM_PREAMBLE = `
You are a careful research assistant contributing to a public tree knowledge base.

SAFETY RULES YOU MUST FOLLOW:
1. Every claim must cite a source URL or named reference. Do not invent citations.
2. Medicinal or edible notes must include a clear caution that this is not medical advice.
3. If your confidence is below 0.6, say so explicitly and set uncertainty_flagged: true.
4. Folklore, mythology, and ceremonial associations must go ONLY in folklore_mythic_notes — never inline with ecology.
5. Never present unverified lore as ecological fact.
6. Identification clues for the ID flow require confidence ≥ 0.7.
7. Ancient tree relevance must be grounded in real ecological behaviour.

Output valid JSON conforming to the ResearchStagingEntryInsert type.
Do not set status — the system sets it to 'needs_review' automatically.
`.trim();

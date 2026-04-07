/**
 * Whisper State — unified eligibility resolver and state system.
 * 
 * Single source of truth for whisper visibility and collectability.
 * Used across notification panel, map, tree preview, detail page, arrival panel.
 */
import type { TreeWhisper } from "@/hooks/use-whispers";

const GRACE_HOURS = 12;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;
const VISITS_KEY = "s33d-tree-visits";

// ── Canonical whisper states ──
export type WhisperVisibility =
  | "waiting_unseen"       // whisper exists, user hasn't seen the notification yet
  | "waiting_seen"         // user has seen the notification but hasn't collected
  | "available_here"       // user is at a valid tree and can collect now
  | "available_elsewhere"  // whisper exists but must be collected at a different tree/species
  | "nearby_eligible"      // a valid tree for this whisper is nearby
  | "read"                 // collected and read
  | "expired";             // past expiry

// ── Delivery condition descriptors ──
export interface WhisperDeliveryInfo {
  scope: "ANY_TREE" | "SPECIFIC_TREE" | "SPECIES_MATCH";
  treeName?: string;
  treeId?: string;
  speciesKey?: string;
  speciesLabel?: string;
}

// ── Eligibility context ──
export interface WhisperEligibilityContext {
  userId: string | null;
  whisper: TreeWhisper;
  currentTreeId?: string;
  currentTreeSpecies?: string;
  isNearTree?: boolean;
  isCheckedIn?: boolean;
}

// ── Grace period check ──
function isWithinGrace(treeId: string): boolean {
  try {
    const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || "{}");
    const lastVisit = visits[treeId];
    if (!lastVisit) return false;
    return (Date.now() - lastVisit) < GRACE_MS;
  } catch {
    return false;
  }
}

// ── The ONE eligibility function ──
export function resolveWhisperState(ctx: WhisperEligibilityContext): WhisperVisibility {
  const { whisper, currentTreeId, currentTreeSpecies, isNearTree, isCheckedIn } = ctx;

  // Already collected
  if (whisper.status === "collected" || whisper.collected_at) return "read";

  // Expired
  if (whisper.expires_at && new Date(whisper.expires_at) < new Date()) return "expired";

  // Not at a tree — determine if waiting elsewhere
  if (!currentTreeId) {
    return "waiting_seen";
  }

  // Check if this tree matches the delivery condition
  const matchesTree = canReceiveAtTree(whisper, currentTreeId, currentTreeSpecies || "");

  if (!matchesTree) {
    return "available_elsewhere";
  }

  // Tree matches — check presence
  const isPresent = isNearTree || isCheckedIn || isWithinGrace(currentTreeId);

  if (isPresent) {
    return "available_here";
  }

  // Right tree but not present yet
  return "nearby_eligible";
}

/** Check if a whisper can be received at a specific tree */
export function canReceiveAtTree(
  whisper: TreeWhisper,
  treeId: string,
  treeSpecies: string,
): boolean {
  if (whisper.delivery_scope === "ANY_TREE") return true;
  if (whisper.delivery_scope === "SPECIFIC_TREE") return whisper.delivery_tree_id === treeId;
  if (whisper.delivery_scope === "SPECIES_MATCH") {
    const speciesKey = treeSpecies?.toLowerCase().replace(/\s+/g, "_");
    return whisper.delivery_species_key === speciesKey;
  }
  return false;
}

/** Whether a whisper can be collected right now given full context */
export function canCollectWhisper(ctx: WhisperEligibilityContext): boolean {
  return resolveWhisperState(ctx) === "available_here";
}

/** Human-readable delivery condition */
export function getDeliveryDescription(info: WhisperDeliveryInfo): string {
  switch (info.scope) {
    case "SPECIFIC_TREE":
      return info.treeName
        ? `Waiting at ${info.treeName}`
        : "Waiting at a specific tree";
    case "SPECIES_MATCH":
      return info.speciesLabel
        ? `Receive at any ${info.speciesLabel}`
        : "Receive at a matching species";
    case "ANY_TREE":
      return "Receive at any tree";
    default:
      return "Waiting to be received";
  }
}

/** Guidance text for current state */
export function getWhisperGuidance(state: WhisperVisibility, deliveryInfo?: WhisperDeliveryInfo): string {
  switch (state) {
    case "available_here":
      return "A whisper waits here for you";
    case "available_elsewhere":
      return deliveryInfo ? getDeliveryDescription(deliveryInfo) : "Visit the right tree to receive";
    case "nearby_eligible":
      return "A whisper can be received at this tree";
    case "waiting_seen":
    case "waiting_unseen":
      return deliveryInfo ? getDeliveryDescription(deliveryInfo) : "A whisper is waiting";
    case "read":
      return "Whisper received";
    case "expired":
      return "This whisper has faded";
    default:
      return "";
  }
}

/** Count waiting whispers that can be received at a specific tree */
export function countWhispersAtTree(
  whispers: TreeWhisper[],
  treeId: string,
  treeSpecies: string,
): number {
  return whispers.filter(w => canReceiveAtTree(w, treeId, treeSpecies)).length;
}

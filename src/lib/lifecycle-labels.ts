/**
 * Shared lifecycle vocabulary for the contribution economy.
 * Single source of truth for status labels, icons, and colors.
 */

export const LIFECYCLE_LABELS = {
  // Validation statuses
  pending: { label: "Pending", emoji: "⏳", className: "text-muted-foreground" },
  accepted: { label: "Accepted", emoji: "✅", className: "text-primary" },
  validated: { label: "Accepted", emoji: "✅", className: "text-primary" },
  rejected: { label: "Rejected", emoji: "❌", className: "text-destructive" },

  // Reward statuses
  reward_pending: { label: "Pending", emoji: "⏳", className: "text-muted-foreground/60" },
  reward_ready: { label: "Reward Ready", emoji: "💚", className: "text-primary font-semibold" },
  reward_distributed: { label: "Distributed", emoji: "🎁", className: "text-muted-foreground" },

  // Pipeline stages
  candidate: { label: "Candidate", emoji: "🌱", className: "text-foreground/80" },
  research: { label: "Research Tree", emoji: "🔬", className: "text-primary/80" },
  verification: { label: "Verification", emoji: "📋", className: "text-accent-foreground" },
  ready: { label: "Ready for Promotion", emoji: "✨", className: "text-primary" },
  confirmed: { label: "Ancient Friend", emoji: "🌳", className: "text-primary font-medium" },

  // Normalization
  raw: { label: "Raw", emoji: "📥", className: "text-muted-foreground" },
  duplicate: { label: "Duplicate", emoji: "🔗", className: "text-muted-foreground/70" },
  promoted: { label: "Promoted", emoji: "⬆️", className: "text-primary" },
} as const;

export type LifecycleKey = keyof typeof LIFECYCLE_LABELS;

/** Contribution type labels (shared across all surfaces) */
export const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  candidate_promoted: "Candidate promoted",
  candidate_rejected: "Candidate rejected",
  duplicate_marked: "Duplicate marked",
  verification_tasks_generated: "Verification generated",
  verification_completed: "Verification completed",
  research_tree_promoted_to_af: "Promoted to Ancient Friend",
};

/** Get a lifecycle status display */
export function getLifecycleDisplay(key: string) {
  return LIFECYCLE_LABELS[key as LifecycleKey] || { label: key, emoji: "•", className: "text-muted-foreground" };
}

/** Time-ago helper reused across all surfaces */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Urgency class based on age in hours */
export function getAgingUrgency(createdAt: string): { label: string; className: string } {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hours < 24) return { label: "fresh", className: "text-primary/60" };
  if (hours < 72) return { label: "aging", className: "text-accent-foreground" };
  if (hours < 168) return { label: "stale", className: "text-destructive/70" };
  return { label: "overdue", className: "text-destructive font-medium" };
}

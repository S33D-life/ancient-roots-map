/**
 * Tree Relationship progression types.
 *
 * Four tiers derived from existing activity data:
 *   Explorer  → first visit
 *   Witness   → co-witnessed with another warden
 *   Steward   → 3+ visits with at least one offering/contribution
 *   Guardian  → 10+ visits, 3+ stewardship actions, 3+ months of activity
 */

export type RelationshipTier = "explorer" | "witness" | "steward" | "guardian";

export interface RelationshipProgress {
  /** Current tier */
  tier: RelationshipTier;
  /** Numeric index (0-3) for ordering */
  tierIndex: number;
  /** Activity counts driving the tier */
  stats: {
    totalVisits: number;
    offeringCount: number;
    stewardshipActions: number;
    coWitnessCount: number;
    firstVisitDate: string | null;
    latestVisitDate: string | null;
  };
  /** Progress toward next tier (0-100), null if already Guardian */
  nextProgress: number | null;
  /** What's needed for the next tier */
  nextRequirements: string[] | null;
}

export const TIER_CONFIG: Record<
  RelationshipTier,
  { label: string; emoji: string; description: string; color: string }
> = {
  explorer: {
    label: "Explorer",
    emoji: "🧭",
    description: "First encounter with this Ancient Friend",
    color: "text-muted-foreground",
  },
  witness: {
    label: "Witness",
    emoji: "👁️",
    description: "Confirmed presence alongside another warden",
    color: "text-blue-400",
  },
  steward: {
    label: "Steward",
    emoji: "🌿",
    description: "Recurring care and attention",
    color: "text-emerald-400",
  },
  guardian: {
    label: "Guardian",
    emoji: "🛡️",
    description: "Long-term caretaker and protector",
    color: "text-primary",
  },
};

export const TIER_ORDER: RelationshipTier[] = ["explorer", "witness", "steward", "guardian"];

/**
 * Compute the user's relationship tier from activity stats.
 */
export function computeRelationship(stats: {
  totalVisits: number;
  offeringCount: number;
  stewardshipActions: number;
  coWitnessCount: number;
  firstVisitDate: string | null;
  latestVisitDate: string | null;
}): RelationshipProgress {
  const { totalVisits, offeringCount, stewardshipActions, coWitnessCount, firstVisitDate } = stats;

  // Calculate months of activity
  let monthsActive = 0;
  if (firstVisitDate) {
    monthsActive = Math.floor(
      (Date.now() - new Date(firstVisitDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
  }

  // Guardian: 10+ visits, 3+ stewardship actions, 3+ months
  if (totalVisits >= 10 && stewardshipActions >= 3 && monthsActive >= 3) {
    return {
      tier: "guardian",
      tierIndex: 3,
      stats,
      nextProgress: null,
      nextRequirements: null,
    };
  }

  // Steward: 3+ visits, at least 1 offering or contribution
  if (totalVisits >= 3 && (offeringCount + stewardshipActions) >= 1) {
    // Progress toward Guardian
    const visitProg = Math.min(100, (totalVisits / 10) * 100);
    const stewProg = Math.min(100, (stewardshipActions / 3) * 100);
    const monthProg = Math.min(100, (monthsActive / 3) * 100);
    const avgProg = Math.round((visitProg + stewProg + monthProg) / 3);

    const reqs: string[] = [];
    if (totalVisits < 10) reqs.push(`${10 - totalVisits} more visits`);
    if (stewardshipActions < 3) reqs.push(`${3 - stewardshipActions} more stewardship actions`);
    if (monthsActive < 3) reqs.push(`${3 - monthsActive} more months of presence`);

    return { tier: "steward", tierIndex: 2, stats, nextProgress: avgProg, nextRequirements: reqs };
  }

  // Witness: at least 1 co-witness session
  if (coWitnessCount >= 1) {
    const visitProg = Math.min(100, (totalVisits / 3) * 100);
    const contribProg = Math.min(100, ((offeringCount + stewardshipActions) / 1) * 100);
    const avgProg = Math.round((visitProg + contribProg) / 2);

    const reqs: string[] = [];
    if (totalVisits < 3) reqs.push(`${3 - totalVisits} more visits`);
    if ((offeringCount + stewardshipActions) < 1) reqs.push("Make an offering or contribution");

    return { tier: "witness", tierIndex: 1, stats, nextProgress: avgProg, nextRequirements: reqs };
  }

  // Explorer: any visit
  const reqs: string[] = ["Co-witness scan with another warden"];
  const prog = coWitnessCount > 0 ? 100 : 0;

  return { tier: "explorer", tierIndex: 0, stats, nextProgress: prog, nextRequirements: reqs };
}

/**
 * Council participation state — localStorage layer.
 *
 * Tracks which councils a user has marked as "participated"
 * and the Hearts rewarded.  Keyed by council session id.
 *
 * Future: replace with Supabase council_participation_rewards table.
 */

const STORAGE_KEY = "s33d_council_participation";

export interface CouncilParticipation {
  sessionId: string;
  status: "participated" | "rewarded";
  heartsAmount: number;
  claimedAt: string; // ISO
}

/** Default Hearts per council participation */
export const COUNCIL_HEARTS_REWARD = 11;

function readAll(): Record<string, CouncilParticipation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, CouncilParticipation>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function hasParticipatedInCouncil(sessionId: string): boolean {
  return sessionId in readAll();
}

export function getCouncilParticipation(sessionId: string): CouncilParticipation | null {
  return readAll()[sessionId] ?? null;
}

export function getAllCouncilParticipation(): CouncilParticipation[] {
  return Object.values(readAll());
}

export function markCouncilParticipation(
  sessionId: string,
  amount: number = COUNCIL_HEARTS_REWARD,
): CouncilParticipation {
  const all = readAll();
  if (all[sessionId]) return all[sessionId]; // idempotent

  const record: CouncilParticipation = {
    sessionId,
    status: "rewarded",
    heartsAmount: amount,
    claimedAt: new Date().toISOString(),
  };
  all[sessionId] = record;
  writeAll(all);
  return record;
}

/** Summary stats from local participation data */
export function getParticipationSummary() {
  const all = getAllCouncilParticipation();
  return {
    totalGathered: all.length,
    totalHearts: all.reduce((sum, p) => sum + p.heartsAmount, 0),
  };
}

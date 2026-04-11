/**
 * Wanderer Pattern Memory — clustering, trends, and flaky detection.
 * Pure derived analytics from existing findings/runs data.
 */
import type { AgentFinding, AgentRun } from "./wanderer-types";
import type { JourneyHealth } from "@/hooks/use-wanderer";

/* ── Grouping Key ─────────────────────────────────── */

export function buildGroupingKey(finding: AgentFinding): string {
  const trace = finding.trace_json as Record<string, any> | null;
  const category = trace?.category || finding.type;
  const route = finding.route || "_";
  const target = (trace?.target as string)?.slice(0, 60) || "_";
  return `${category}::${route}::${target}`;
}

/* ── Recurring Pattern ────────────────────────────── */

export type PatternStatus = "new" | "known" | "watching" | "resolved_candidate";

export interface RecurringPattern {
  key: string;
  title: string;
  category: string;
  route: string | null;
  target: string | null;
  count: number;
  journeySlugs: string[];
  latestSeverity: string;
  latestSeen: string;
  findingIds: string[];
  isFlaky: boolean;
  /** UI-only status, stored in sessionStorage */
  status: PatternStatus;
}

export function clusterFindings(
  findings: AgentFinding[],
  runs: AgentRun[],
): RecurringPattern[] {
  const groups = new Map<string, AgentFinding[]>();

  for (const f of findings) {
    const key = buildGroupingKey(f);
    const arr = groups.get(key) || [];
    arr.push(f);
    groups.set(key, arr);
  }

  // Build run lookup for journey slugs
  const runMap = new Map<string, AgentRun>();
  for (const r of runs) runMap.set(r.id, r);

  // Load persisted statuses
  const stored = loadPatternStatuses();

  const patterns: RecurringPattern[] = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue; // only surface repeats

    const latest = group.reduce((a, b) => a.created_at > b.created_at ? a : b);
    const trace = latest.trace_json as Record<string, any> | null;

    // Collect journey slugs from runs
    const slugSet = new Set<string>();
    for (const f of group) {
      const run = runMap.get(f.run_id);
      const slug = (run?.agent_journeys as any)?.slug;
      if (slug) slugSet.add(slug);
    }

    // Detect flakiness: same grouping key but mixed pass/fail runs
    const runIds = [...new Set(group.map(f => f.run_id))];
    const relatedRuns = runIds.map(id => runMap.get(id)).filter(Boolean) as AgentRun[];
    const statuses = new Set(relatedRuns.map(r => r.status));
    const isFlaky = statuses.has("passed") && (statuses.has("failed") || statuses.has("needs_review"));

    patterns.push({
      key,
      title: latest.title,
      category: trace?.category || latest.type,
      route: latest.route,
      target: (trace?.target as string) || null,
      count: group.length,
      journeySlugs: [...slugSet],
      latestSeverity: latest.severity,
      latestSeen: latest.created_at,
      findingIds: group.map(f => f.id),
      isFlaky,
      status: stored[key] || "new",
    });
  }

  // Sort by count desc, then severity
  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  patterns.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (sevOrder[a.latestSeverity] ?? 3) - (sevOrder[b.latestSeverity] ?? 3);
  });

  return patterns;
}

/* ── Trend Signals ────────────────────────────────── */

export type TrendDirection = "improving" | "stable" | "worsening";

export function computeTrend(
  runs: AgentRun[],
  findings: AgentFinding[],
  journeyId: string,
): TrendDirection {
  const jRuns = runs
    .filter(r => r.journey_id === journeyId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  if (jRuns.length < 3) return "stable";

  // Compare first half (recent) vs second half (older)
  const mid = Math.floor(jRuns.length / 2);
  const recent = jRuns.slice(0, mid);
  const older = jRuns.slice(mid);

  const avgScore = (arr: AgentRun[]) => {
    const scores = arr.map(r => r.score ?? 50);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const avgFindings = (arr: AgentRun[]) => {
    const counts = arr.map(r => findings.filter(f => f.run_id === r.id).length);
    return counts.reduce((a, b) => a + b, 0) / counts.length;
  };

  const recentScore = avgScore(recent);
  const olderScore = avgScore(older);
  const recentFindings = avgFindings(recent);
  const olderFindings = avgFindings(older);

  // Score improving AND findings decreasing = improving
  if (recentScore > olderScore + 5 || recentFindings < olderFindings - 0.5) return "improving";
  if (recentScore < olderScore - 5 || recentFindings > olderFindings + 0.5) return "worsening";
  return "stable";
}

/* ── Flaky Journey Detection ──────────────────────── */

export function findFlakiestJourney(
  runs: AgentRun[],
  journeys: { id: string; slug: string; title: string }[],
): { slug: string; title: string; flakyRate: number } | null {
  let worst: { slug: string; title: string; flakyRate: number } | null = null;

  for (const j of journeys) {
    const jRuns = runs
      .filter(r => r.journey_id === j.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10);

    if (jRuns.length < 3) continue;

    const statuses = jRuns.map(r => r.status);
    let flips = 0;
    for (let i = 1; i < statuses.length; i++) {
      if (statuses[i] !== statuses[i - 1]) flips++;
    }
    const flakyRate = flips / (statuses.length - 1);

    if (flakyRate > 0.3 && (!worst || flakyRate > worst.flakyRate)) {
      worst = { slug: j.slug, title: j.title, flakyRate };
    }
  }

  return worst;
}

/* ── Most Common Failure Category ─────────────────── */

export function mostCommonCategory(findings: AgentFinding[]): string | null {
  const counts = new Map<string, number>();
  for (const f of findings) {
    const trace = f.trace_json as Record<string, any> | null;
    const cat = trace?.category || f.type;
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [cat, c] of counts) {
    if (c > bestCount) { best = cat; bestCount = c; }
  }
  return best;
}

/* ── Pattern Status Persistence (sessionStorage) ──── */

const STORAGE_KEY = "wanderer-pattern-statuses";

function loadPatternStatuses(): Record<string, PatternStatus> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePatternStatus(key: string, status: PatternStatus) {
  const all = loadPatternStatuses();
  all[key] = status;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

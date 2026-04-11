/**
 * First Wanderer — Evaluation layer (hardened).
 *
 * Distinguishes real bugs from fragile selectors, navigation failures,
 * and UX friction. Generates concise, actionable findings.
 */
import type { RunTrace, StepResult, FindingType, FindingSeverity } from "@/lib/wanderer-types";

export interface EvaluatedFinding {
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  route: string | null;
  trace_json: Record<string, unknown>;
}

export interface EvaluationResult {
  summary: string;
  score: number;
  findings: EvaluatedFinding[];
}

/** Classify a failed step into the right finding type */
function classifyFinding(step: StepResult): { type: FindingType; severity: FindingSeverity } {
  const action = step.step.action;
  const error = step.error || "";

  // Navigation failure — often infrastructure, not a real bug
  if (action === "goto") {
    return { type: "ux_friction", severity: "medium" };
  }

  // Timeout waiting for content — could be slow load or missing content
  if (action === "wait_for") {
    if (step.durationMs > 5000) return { type: "ux_friction", severity: "high" };
    return { type: "ux_friction", severity: "medium" };
  }

  // Assertion failures are more likely real bugs
  if (action === "assert_visible" || action === "assert_text") {
    // Distinguish "element exists but hidden" from "element not found at all"
    if (error.includes("zero dimensions") || error.includes("hidden")) {
      return { type: "bug", severity: "medium" };
    }
    // "not found" could be a fragile selector
    if (error.includes("not found") && isSelectorFragile(step.step.target)) {
      return { type: "insight", severity: "low" };
    }
    return { type: "bug", severity: "high" };
  }

  // Click target missing
  if (action === "click" && !step.passed) {
    if (isSelectorFragile(step.step.target)) {
      return { type: "insight", severity: "low" };
    }
    return { type: "bug", severity: "medium" };
  }

  return { type: "insight", severity: "low" };
}

/** Heuristic: selectors with deeply nested classes or pseudo-selectors are fragile */
function isSelectorFragile(target: string): boolean {
  if (target.split(".").length > 3) return true;
  if (target.includes(":nth") || target.includes(":last") || target.includes(":first")) return true;
  // data-testid, aria-label, role, and text-based targets are stable
  if (target.startsWith("[data-testid") || target.startsWith("[aria-label") || target.startsWith("[role")) return false;
  if (target.includes("has-text(")) return false;
  return false;
}

function buildTitle(step: StepResult): string {
  const action = step.step.action;
  const target = step.step.target.length > 50 ? step.step.target.slice(0, 50) + "…" : step.step.target;

  switch (action) {
    case "goto": return `Navigation failed → ${target}`;
    case "wait_for": return `Content not found: ${target}`;
    case "assert_visible": return `Missing element: ${target}`;
    case "assert_text": return `Wrong text in ${target}`;
    case "click": return `Click target missing: ${target}`;
    case "type": return `Input target missing: ${target}`;
    default: return `Step failed: ${action} on ${target}`;
  }
}

function buildDescription(step: StepResult): string {
  const parts: string[] = [];
  if (step.error) parts.push(step.error);
  if (step.urlBefore !== step.urlAfter) {
    parts.push(`Route changed: ${step.urlBefore} → ${step.urlAfter}`);
  }
  if (step.snapshot.headingText) {
    parts.push(`Page heading: "${step.snapshot.headingText}"`);
  }
  if (step.snapshot.resolvedSelector) {
    parts.push(`Resolved to: ${step.snapshot.resolvedSelector}`);
  }
  parts.push(`Duration: ${Math.round(step.durationMs)}ms`);
  if (step.consoleErrors.length > 0) {
    parts.push(`Console errors during step: ${step.consoleErrors.length}`);
  }
  return parts.join("\n");
}

export function evaluate(trace: RunTrace, journeyTitle: string): EvaluationResult {
  const failedSteps = trace.steps.filter(s => !s.passed);
  const slowSteps = trace.steps.filter(s => s.passed && s.durationMs > 3000);
  const totalSteps = trace.steps.length;
  const passedCount = totalSteps - failedSteps.length;

  // Weighted score: failed assertions count more than slow steps
  const failPenalty = failedSteps.reduce((sum, s) => {
    const { severity } = classifyFinding(s);
    return sum + (severity === "high" ? 3 : severity === "medium" ? 2 : 1);
  }, 0);
  const maxPenalty = totalSteps * 3;
  const score = maxPenalty > 0 ? Math.max(0, Math.round(((maxPenalty - failPenalty) / maxPenalty) * 100)) : 100;

  const findings: EvaluatedFinding[] = [];

  // Findings from failed steps
  for (const step of failedSteps) {
    const { type, severity } = classifyFinding(step);
    findings.push({
      type,
      severity,
      title: buildTitle(step),
      description: buildDescription(step),
      route: step.urlAfter || step.urlBefore || null,
      trace_json: {
        action: step.step.action,
        target: step.step.target,
        expected: step.step.expected,
        error: step.error,
        durationMs: step.durationMs,
        urlBefore: step.urlBefore,
        urlAfter: step.urlAfter,
        snapshot: step.snapshot,
        consoleErrors: step.consoleErrors,
        networkErrors: step.networkErrors,
      },
    });
  }

  // UX friction from slow-but-passing steps
  for (const step of slowSteps) {
    findings.push({
      type: "ux_friction",
      severity: step.durationMs > 6000 ? "high" : "medium",
      title: `Slow response: ${step.step.action} (${Math.round(step.durationMs)}ms)`,
      description: `Step "${step.step.action}" on "${step.step.target}" took ${Math.round(step.durationMs)}ms. Route: ${step.urlAfter}`,
      route: step.urlAfter || null,
      trace_json: {
        action: step.step.action,
        target: step.step.target,
        durationMs: step.durationMs,
        snapshot: step.snapshot,
      },
    });
  }

  // Console errors as a single aggregated finding (if any)
  if (trace.consoleErrorCount > 0) {
    const uniqueErrors = [...new Set(trace.consoleErrors)].slice(0, 10);
    findings.push({
      type: "bug",
      severity: trace.consoleErrorCount > 5 ? "high" : trace.consoleErrorCount > 2 ? "medium" : "low",
      title: `${trace.consoleErrorCount} console error(s) during "${journeyTitle}"`,
      description: `Errors captured:\n${uniqueErrors.map(e => `• ${e.slice(0, 150)}`).join("\n")}`,
      route: null,
      trace_json: {
        consoleErrorCount: trace.consoleErrorCount,
        uniqueErrors,
      },
    });
  }

  // Network errors
  if (trace.networkErrorCount > 0) {
    const uniqueNetErrors = [...new Set(trace.networkErrors)].slice(0, 10);
    findings.push({
      type: "bug",
      severity: trace.networkErrorCount > 3 ? "high" : "medium",
      title: `${trace.networkErrorCount} network error(s) during "${journeyTitle}"`,
      description: `Failed requests:\n${uniqueNetErrors.map(e => `• ${e.slice(0, 150)}`).join("\n")}`,
      route: null,
      trace_json: {
        networkErrorCount: trace.networkErrorCount,
        uniqueNetErrors,
      },
    });
  }

  const bugCount = findings.filter(f => f.type === "bug").length;
  const frictionCount = findings.filter(f => f.type === "ux_friction").length;
  const insightCount = findings.filter(f => f.type === "insight").length;
  const parts = [
    `${passedCount}/${totalSteps} steps passed`,
    bugCount > 0 ? `${bugCount} bug(s)` : null,
    frictionCount > 0 ? `${frictionCount} friction point(s)` : null,
    insightCount > 0 ? `${insightCount} insight(s)` : null,
    trace.consoleErrorCount > 0 ? `${trace.consoleErrorCount} console error(s)` : null,
    trace.networkErrorCount > 0 ? `${trace.networkErrorCount} network error(s)` : null,
  ].filter(Boolean);

  const summary = `"${journeyTitle}" — ${parts.join(", ")}. Score: ${score}/100.`;

  return { summary, score, findings };
}

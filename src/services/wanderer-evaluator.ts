/**
 * First Wanderer — Evaluation layer (calibrated).
 *
 * Distinguishes real bugs from stale selectors, route mismatches,
 * auth/state issues, and UX friction. Generates concise, actionable findings.
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

/** Classify a failed step into the right finding type with clear reasoning */
function classifyFinding(step: StepResult): { type: FindingType; severity: FindingSeverity; category: string } {
  const action = step.step.action;
  const error = step.error || "";
  const url = step.urlAfter || step.urlBefore || "";

  // Route mismatch — navigation didn't land where expected
  if (action === "goto" && error.includes("timed out")) {
    // Check if we ended up on auth
    if (url.includes("/auth") || url.includes("/login")) {
      return { type: "insight", severity: "low", category: "auth-redirect" };
    }
    return { type: "ux_friction", severity: "medium", category: "route-mismatch" };
  }

  // Stale selector — element not found, likely the selector needs updating
  if ((action === "wait_for" || action === "assert_visible" || action === "click") && error.includes("not found")) {
    if (isSelectorFragile(step.step.target)) {
      return { type: "insight", severity: "low", category: "stale-selector" };
    }
    // Semantic target not found — more likely a real issue
    if (isSemanticTarget(step.step.target)) {
      return { type: "bug", severity: "medium", category: "missing-element" };
    }
    return { type: "insight", severity: "low", category: "stale-selector" };
  }

  // Element hidden
  if (error.includes("zero dimensions") || error.includes("hidden")) {
    return { type: "bug", severity: "medium", category: "hidden-element" };
  }

  // Text assertion failure — real content bug
  if (action === "assert_text" && error.includes("Expected text")) {
    return { type: "bug", severity: "high", category: "wrong-content" };
  }

  // Slow step
  if (step.durationMs > 5000) {
    return { type: "ux_friction", severity: "high", category: "slow-response" };
  }

  // Wait timeout — could be loading issue
  if (action === "wait_for" && error.includes("Timed out")) {
    return { type: "ux_friction", severity: "medium", category: "load-timeout" };
  }

  return { type: "insight", severity: "low", category: "unknown" };
}

function isSemanticTarget(target: string): boolean {
  return target.startsWith("has-text(") || target.startsWith("[role") || target.startsWith("[aria-label") || target === "h1" || target === "main" || target === "header" || target === "nav" || target === "textarea";
}

/** Heuristic: selectors with deeply nested classes or pseudo-selectors are fragile */
function isSelectorFragile(target: string): boolean {
  if (target.split(".").length > 3) return true;
  if (target.includes(":nth") || target.includes(":last") || target.includes(":first")) return true;
  return false;
}

function buildTitle(step: StepResult, category: string): string {
  const target = step.step.target.length > 50 ? step.step.target.slice(0, 50) + "…" : step.step.target;

  switch (category) {
    case "route-mismatch": return `Route unreachable: ${target}`;
    case "auth-redirect": return `Auth redirect when navigating to ${target}`;
    case "stale-selector": return `Stale selector: ${target}`;
    case "missing-element": return `Missing element: ${target}`;
    case "hidden-element": return `Hidden element: ${target}`;
    case "wrong-content": return `Wrong text in ${target}`;
    case "slow-response": return `Slow response: ${step.step.action} (${Math.round(step.durationMs)}ms)`;
    case "load-timeout": return `Load timeout waiting for: ${target}`;
    default: return `Step failed: ${step.step.action} on ${target}`;
  }
}

function buildDescription(step: StepResult, category: string): string {
  const parts: string[] = [];

  // Category-specific guidance
  switch (category) {
    case "route-mismatch":
      parts.push(`Navigation to "${step.step.target}" did not complete. Ended at ${step.urlAfter}.`);
      parts.push("This may indicate a removed route or a redirect loop.");
      break;
    case "auth-redirect":
      parts.push(`Navigating to "${step.step.target}" redirected to an auth page.`);
      parts.push("This journey may require authentication to pass.");
      break;
    case "stale-selector":
      parts.push(`Selector "${step.step.target}" not found on the page.`);
      parts.push("The UI may have changed — consider updating this journey's target.");
      break;
    default:
      if (step.error) parts.push(step.error);
  }

  if (step.urlBefore !== step.urlAfter) {
    parts.push(`Route: ${step.urlBefore} → ${step.urlAfter}`);
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

  // Weighted score
  const failPenalty = failedSteps.reduce((sum, s) => {
    const { severity } = classifyFinding(s);
    return sum + (severity === "high" ? 3 : severity === "medium" ? 2 : 1);
  }, 0);
  const maxPenalty = totalSteps * 3;
  const score = maxPenalty > 0 ? Math.max(0, Math.round(((maxPenalty - failPenalty) / maxPenalty) * 100)) : 100;

  const findings: EvaluatedFinding[] = [];

  for (const step of failedSteps) {
    const { type, severity, category } = classifyFinding(step);
    findings.push({
      type, severity,
      title: buildTitle(step, category),
      description: buildDescription(step, category),
      route: step.urlAfter || step.urlBefore || null,
      trace_json: {
        action: step.step.action,
        target: step.step.target,
        expected: step.step.expected,
        error: step.error,
        category,
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
      trace_json: { action: step.step.action, target: step.step.target, durationMs: step.durationMs, category: "slow-response", snapshot: step.snapshot },
    });
  }

  // Console errors
  if (trace.consoleErrorCount > 0) {
    const uniqueErrors = [...new Set(trace.consoleErrors)].slice(0, 10);
    findings.push({
      type: "bug",
      severity: trace.consoleErrorCount > 5 ? "high" : trace.consoleErrorCount > 2 ? "medium" : "low",
      title: `${trace.consoleErrorCount} console error(s) during "${journeyTitle}"`,
      description: `Errors captured:\n${uniqueErrors.map(e => `• ${e.slice(0, 150)}`).join("\n")}`,
      route: null,
      trace_json: { consoleErrorCount: trace.consoleErrorCount, uniqueErrors, category: "console-errors" },
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
      trace_json: { networkErrorCount: trace.networkErrorCount, uniqueNetErrors, category: "network-errors" },
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

/**
 * First Wanderer — Evaluation layer.
 *
 * Takes a run trace and generates findings (bugs, UX friction, insights, sparks).
 * All findings are created as "pending" review.
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
  score: number; // 0–100
  findings: EvaluatedFinding[];
}

function assessSeverity(step: StepResult): FindingSeverity {
  if (step.step.action === "assert_visible" || step.step.action === "assert_text") return "high";
  if (step.step.action === "wait_for") return "medium";
  return "low";
}

function classifyFinding(step: StepResult): FindingType {
  if (step.step.action === "assert_visible" || step.step.action === "assert_text") return "bug";
  if (step.step.action === "wait_for" && step.durationMs > 3000) return "ux_friction";
  if (step.step.action === "click" && !step.passed) return "bug";
  return "insight";
}

export function evaluate(trace: RunTrace, journeyTitle: string): EvaluationResult {
  const failedSteps = trace.steps.filter(s => !s.passed);
  const slowSteps = trace.steps.filter(s => s.passed && s.durationMs > 2000);
  const totalSteps = trace.steps.length;
  const passedCount = totalSteps - failedSteps.length;
  const score = totalSteps > 0 ? Math.round((passedCount / totalSteps) * 100) : 100;

  const findings: EvaluatedFinding[] = [];

  // Generate findings for failed steps
  for (const step of failedSteps) {
    findings.push({
      type: classifyFinding(step),
      severity: assessSeverity(step),
      title: `${step.step.action} failed: ${step.step.target.slice(0, 60)}`,
      description: step.error || `Step "${step.step.action}" on "${step.step.target}" did not pass.`,
      route: step.url || null,
      trace_json: {
        step: step.step,
        error: step.error,
        durationMs: step.durationMs,
        url: step.url,
      },
    });
  }

  // Generate UX friction findings for slow steps
  for (const step of slowSteps) {
    findings.push({
      type: "ux_friction",
      severity: step.durationMs > 5000 ? "high" : "medium",
      title: `Slow step: ${step.step.action} on ${step.step.target.slice(0, 60)}`,
      description: `Step took ${Math.round(step.durationMs)}ms — may feel sluggish.`,
      route: step.url || null,
      trace_json: {
        step: step.step,
        durationMs: step.durationMs,
        url: step.url,
      },
    });
  }

  // Console error findings
  if (trace.consoleErrorCount > 0) {
    findings.push({
      type: "bug",
      severity: trace.consoleErrorCount > 5 ? "high" : "medium",
      title: `${trace.consoleErrorCount} console errors during journey`,
      description: `The "${journeyTitle}" journey produced ${trace.consoleErrorCount} console error(s).`,
      route: null,
      trace_json: { consoleErrorCount: trace.consoleErrorCount },
    });
  }

  const statusLabel = failedSteps.length === 0 ? "passed" : `${failedSteps.length} issue(s)`;
  const summary = `Journey "${journeyTitle}": ${passedCount}/${totalSteps} steps passed (${score}%). ${statusLabel}. ${findings.length} finding(s) generated.`;

  return { summary, score, findings };
}

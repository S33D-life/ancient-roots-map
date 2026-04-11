/**
 * First Wanderer — TypeScript types for the guided UI testing agent.
 */

export type JourneyStepAction =
  | "goto"
  | "click"
  | "type"
  | "wait_for"
  | "assert_text"
  | "assert_visible";

export interface JourneyStep {
  action: JourneyStepAction;
  target: string;
  expected?: string;
  value?: string;
}

export interface AgentJourney {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  entry_path: string;
  steps_json: JourneyStep[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export type RunStatus = "queued" | "running" | "passed" | "failed" | "needs_review";

export interface AgentRun {
  id: string;
  agent_id: string | null;
  journey_id: string;
  status: RunStatus;
  started_at: string | null;
  finished_at: string | null;
  summary: string | null;
  score: number | null;
  environment: string | null;
  build_id: string | null;
  created_at: string;
  agent_journeys?: AgentJourney;
}

export type FindingType = "bug" | "ux_friction" | "insight" | "spark";
export type FindingSeverity = "low" | "medium" | "high";

export interface AgentFinding {
  id: string;
  run_id: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  route: string | null;
  screenshot_url: string | null;
  trace_json: Record<string, unknown> | null;
  review_status: string;
  suggested_bug_garden_post_id: string | null;
  curator_notes: string | null;
  created_at: string;
}

/** Evidence snapshot captured at each step */
export interface StepSnapshot {
  url: string;
  pageTitle: string;
  headingText: string | null;
  landmarkCount: number;
  resolvedSelector: string | null;
  targetTagName: string | null;
  targetText: string | null;
  visibleText: string;
}

export interface StepResult {
  step: JourneyStep;
  passed: boolean;
  durationMs: number;
  error?: string;
  urlBefore: string;
  urlAfter: string;
  consoleErrors: string[];
  networkErrors: string[];
  snapshot: StepSnapshot;
}

export interface RunTrace {
  steps: StepResult[];
  totalDurationMs: number;
  consoleErrorCount: number;
  networkErrorCount: number;
  consoleErrors: string[];
  networkErrors: string[];
}

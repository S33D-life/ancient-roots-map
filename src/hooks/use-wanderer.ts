/**
 * useWanderer — React hook for the First Wanderer agent system.
 * Provides journeys, runs, findings, and the ability to trigger runs.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runJourney } from "@/services/wanderer-runner";
import { evaluate } from "@/services/wanderer-evaluator";
import type { AgentJourney, AgentRun, AgentFinding, JourneyStep } from "@/lib/wanderer-types";

export function useWanderer() {
  const [journeys, setJourneys] = useState<AgentJourney[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [jRes, rRes, fRes] = await Promise.all([
      supabase
        .from("agent_journeys")
        .select("*")
        .eq("is_active", true)
        .order("title"),
      supabase
        .from("agent_runs")
        .select("*, agent_journeys(title, slug)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("agent_findings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setJourneys((jRes.data as unknown as AgentJourney[]) || []);
    setRuns((rRes.data as unknown as AgentRun[]) || []);
    setFindings((fRes.data as unknown as AgentFinding[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Trigger a journey run (in-app simulated) */
  const startRun = useCallback(
    async (journey: AgentJourney) => {
      if (running) return;
      setRunning(true);

      try {
        // Create run record
        const { data: run, error: runErr } = await supabase
          .from("agent_runs")
          .insert({
            journey_id: journey.id,
            status: "running" as string,
            started_at: new Date().toISOString(),
            environment: navigator.userAgent.slice(0, 120),
          })
          .select()
          .single();

        if (runErr || !run) {
          console.error("Failed to create run:", runErr);
          setRunning(false);
          return;
        }

        // Execute the journey
        const steps = (journey.steps_json || []) as JourneyStep[];
        const trace = await runJourney(steps);

        // Evaluate
        const evaluation = evaluate(trace, journey.title);
        const status = evaluation.score === 100 ? "passed" : evaluation.findings.length > 0 ? "needs_review" : "failed";

        // Update run
        await supabase
          .from("agent_runs")
          .update({
            status,
            finished_at: new Date().toISOString(),
            summary: evaluation.summary,
            score: evaluation.score,
          })
          .eq("id", run.id);

        // Insert findings
        if (evaluation.findings.length > 0) {
          const findingRows = evaluation.findings.map(f => ({
            run_id: run.id,
            type: f.type as string,
            severity: f.severity as string,
            title: f.title,
            description: f.description,
            route: f.route,
            trace_json: f.trace_json as unknown as import("@/integrations/supabase/types").Json,
            review_status: "pending",
          }));
          await supabase.from("agent_findings").insert(findingRows);
        }

        await fetchAll();
      } finally {
        setRunning(false);
      }
    },
    [running, fetchAll]
  );

  /** Update a finding's review status */
  const reviewFinding = useCallback(
    async (findingId: string, reviewStatus: string, curatorNotes?: string) => {
      await supabase
        .from("agent_findings")
        .update({
          review_status: reviewStatus,
          ...(curatorNotes ? { curator_notes: curatorNotes } : {}),
        })
        .eq("id", findingId);
      await fetchAll();
    },
    [fetchAll]
  );

  /** Convert a finding to a Bug Garden draft */
  const convertToBugReport = useCallback(
    async (finding: AgentFinding) => {
      const { data: report } = await supabase
        .from("bug_reports")
        .insert({
          title: `[Wanderer] ${finding.title}`,
          steps: `Found during automated journey run.\n\nRoute: ${finding.route || "unknown"}\n\nDescription: ${finding.description}`,
          expected: "No errors or friction",
          actual: finding.description,
          severity: finding.severity === "high" ? "major" : finding.severity === "medium" ? "minor" : "cosmetic",
          feature_area: "automated-testing",
          status: "new",
          report_type: "bug",
        })
        .select("id")
        .single();

      if (report) {
        await supabase
          .from("agent_findings")
          .update({
            review_status: "approved_as_bug",
            suggested_bug_garden_post_id: report.id,
          })
          .eq("id", finding.id);
      }

      await fetchAll();
      return report?.id;
    },
    [fetchAll]
  );

  return {
    journeys,
    runs,
    findings,
    loading,
    running,
    startRun,
    reviewFinding,
    convertToBugReport,
    refetch: fetchAll,
  };
}

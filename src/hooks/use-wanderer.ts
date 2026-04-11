/**
 * useWanderer — React hook for the First Wanderer agent system.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runJourney } from "@/services/wanderer-runner";
import { evaluate } from "@/services/wanderer-evaluator";
import type { AgentJourney, AgentRun, AgentFinding, JourneyStep } from "@/lib/wanderer-types";
import type { Json } from "@/integrations/supabase/types";

const SMOKE_SUITE_SLUGS = ["map-load", "tree-detail-page", "tree-radio-open", "staff-room-open", "homepage-entry"];

export interface JourneyHealth {
  journeyId: string;
  lastStatus: string | null;
  passRate: number;       // 0–100 over last 5
  lastFindingCount: number;
  lastRunMs: number | null;
}

export function useWanderer() {
  const [journeys, setJourneys] = useState<AgentJourney[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [smokeRunning, setSmokeRunning] = useState(false);
  const [smokeProgress, setSmokeProgress] = useState<{ current: number; total: number; results: Array<{ slug: string; status: string }> } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [jRes, rRes, fRes] = await Promise.all([
      supabase.from("agent_journeys").select("*").eq("is_active", true).order("title"),
      supabase.from("agent_runs").select("*, agent_journeys(title, slug)").order("created_at", { ascending: false }).limit(50),
      supabase.from("agent_findings").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setJourneys((jRes.data as unknown as AgentJourney[]) || []);
    setRuns((rRes.data as unknown as AgentRun[]) || []);
    setFindings((fRes.data as unknown as AgentFinding[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Journey health signals
  const journeyHealth = useMemo((): Map<string, JourneyHealth> => {
    const map = new Map<string, JourneyHealth>();
    for (const j of journeys) {
      const jRuns = runs.filter(r => r.journey_id === j.id).slice(0, 5);
      const lastRun = jRuns[0];
      const passCount = jRuns.filter(r => r.status === "passed").length;
      const lastFindings = lastRun ? findings.filter(f => f.run_id === lastRun.id).length : 0;
      const lastRunMs = lastRun?.started_at && lastRun?.finished_at
        ? new Date(lastRun.finished_at).getTime() - new Date(lastRun.started_at).getTime()
        : null;

      map.set(j.id, {
        journeyId: j.id,
        lastStatus: lastRun?.status || null,
        passRate: jRuns.length > 0 ? Math.round((passCount / jRuns.length) * 100) : 0,
        lastFindingCount: lastFindings,
        lastRunMs,
      });
    }
    return map;
  }, [journeys, runs, findings]);

  const startRun = useCallback(async (journey: AgentJourney) => {
    if (running) return;
    setRunning(true);
    try {
      const { data: run, error: runErr } = await supabase
        .from("agent_runs")
        .insert({
          journey_id: journey.id,
          status: "running" as string,
          started_at: new Date().toISOString(),
          environment: `${navigator.userAgent.slice(0, 80)} | ${window.innerWidth}×${window.innerHeight}`,
        })
        .select().single();

      if (runErr || !run) { console.error("Run create failed:", runErr); return; }

      const steps = (journey.steps_json || []) as JourneyStep[];
      const trace = await runJourney(steps);
      const evaluation = evaluate(trace, journey.title);
      const status = evaluation.score === 100 ? "passed"
        : evaluation.findings.some(f => f.type === "bug") ? "needs_review"
        : evaluation.score >= 70 ? "passed" : "failed";

      await supabase.from("agent_runs").update({
        status,
        finished_at: new Date().toISOString(),
        summary: evaluation.summary,
        score: evaluation.score,
      }).eq("id", run.id);

      if (evaluation.findings.length > 0) {
        const rows = evaluation.findings.map(f => ({
          run_id: run.id,
          type: f.type as string,
          severity: f.severity as string,
          title: f.title,
          description: f.description,
          route: f.route,
          trace_json: f.trace_json as unknown as Json,
          review_status: "pending",
        }));
        await supabase.from("agent_findings").insert(rows);
      }
      await fetchAll();
      return status;
    } finally {
      setRunning(false);
    }
  }, [running, fetchAll]);

  // Smoke suite: run 5 core journeys in sequence
  const runSmokeSuite = useCallback(async () => {
    if (smokeRunning || running) return;
    setSmokeRunning(true);
    const suiteJourneys = journeys.filter(j => SMOKE_SUITE_SLUGS.includes(j.slug));
    const results: Array<{ slug: string; status: string }> = [];
    setSmokeProgress({ current: 0, total: suiteJourneys.length, results: [] });

    for (let i = 0; i < suiteJourneys.length; i++) {
      const j = suiteJourneys[i];
      setSmokeProgress({ current: i + 1, total: suiteJourneys.length, results: [...results] });
      const status = await startRun(j);
      results.push({ slug: j.slug, status: status || "failed" });
      // Brief pause between journeys
      await new Promise(r => setTimeout(r, 500));
    }
    setSmokeProgress({ current: suiteJourneys.length, total: suiteJourneys.length, results });
    setSmokeRunning(false);
    await fetchAll();
    return results;
  }, [smokeRunning, running, journeys, startRun, fetchAll]);

  const reviewFinding = useCallback(async (findingId: string, reviewStatus: string, curatorNotes?: string) => {
    await supabase.from("agent_findings").update({
      review_status: reviewStatus,
      ...(curatorNotes ? { curator_notes: curatorNotes } : {}),
    }).eq("id", findingId);
    await fetchAll();
  }, [fetchAll]);

  const convertToBugReport = useCallback(async (finding: AgentFinding) => {
    const trace = finding.trace_json as Record<string, any> | null;
    const { data: report } = await supabase.from("bug_reports").insert({
      title: `[Wanderer] ${finding.title}`,
      steps: [
        `Found during automated journey run.`,
        `Route: ${finding.route || "unknown"}`,
        trace?.action ? `Action: ${trace.action} on "${trace.target}"` : null,
        trace?.error ? `Error: ${trace.error}` : null,
        trace?.snapshot?.headingText ? `Page heading: "${trace.snapshot.headingText}"` : null,
        `\nDescription: ${finding.description}`,
      ].filter(Boolean).join("\n"),
      expected: "No errors or friction",
      actual: finding.description,
      severity: finding.severity === "high" ? "major" : finding.severity === "medium" ? "minor" : "cosmetic",
      feature_area: "automated-testing",
      status: "new",
      report_type: "bug",
    }).select("id").single();

    if (report) {
      await supabase.from("agent_findings").update({
        review_status: "approved_as_bug",
        suggested_bug_garden_post_id: report.id,
      }).eq("id", finding.id);
    }
    await fetchAll();
    return report?.id;
  }, [fetchAll]);

  return {
    journeys, runs, findings, loading, running,
    smokeRunning, smokeProgress, journeyHealth,
    startRun, runSmokeSuite, reviewFinding, convertToBugReport, refetch: fetchAll,
  };
}

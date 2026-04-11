/**
 * WandererDevPanel — Compact dev-mode overlay showing latest run info,
 * recurring pattern count, flakiest journey, and common failure category.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle, Terminal, Wifi, Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clusterFindings, findFlakiestJourney, mostCommonCategory } from "@/lib/wanderer-patterns";
import type { AgentRun, AgentFinding } from "@/lib/wanderer-types";

interface LatestRunInfo {
  id: string;
  status: string;
  summary: string | null;
  score: number | null;
  created_at: string;
  journey_title: string;
  findings_count: number;
  bug_count: number;
  console_error_count: number;
  network_error_count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  "route-mismatch": "🗺️ Route", "auth-redirect": "🔐 Auth", "stale-selector": "🔧 Stale",
  "missing-element": "❌ Missing", "console-errors": "🖥️ Console", "network-errors": "📡 Network",
  bug: "🐛 Bug", ux_friction: "🐢 Friction", insight: "💡 Insight",
};

export function WandererDevPanel() {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState<LatestRunInfo | null>(null);
  const [allRuns, setAllRuns] = useState<AgentRun[]>([]);
  const [allFindings, setAllFindings] = useState<AgentFinding[]>([]);
  const [allJourneys, setAllJourneys] = useState<{ id: string; slug: string; title: string }[]>([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    Promise.all([
      supabase.from("agent_runs").select("*, agent_journeys(title, slug)").order("created_at", { ascending: false }).limit(50),
      supabase.from("agent_findings").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("agent_journeys").select("id, slug, title").eq("is_active", true),
    ]).then(async ([runsRes, findingsRes, journeysRes]) => {
      const runs = (runsRes.data || []) as unknown as AgentRun[];
      const findings = (findingsRes.data || []) as unknown as AgentFinding[];
      const journeys = (journeysRes.data || []) as { id: string; slug: string; title: string }[];

      setAllRuns(runs);
      setAllFindings(findings);
      setAllJourneys(journeys);

      const latestRun = runs[0];
      if (!latestRun) return;

      const runFindings = findings.filter(f => f.run_id === latestRun.id);
      let consoleErrs = 0, networkErrs = 0;
      for (const f of runFindings) {
        const t = f.trace_json as Record<string, any> | null;
        consoleErrs += (t?.consoleErrors as any[])?.length || (t?.consoleErrorCount as number) || 0;
        networkErrs += (t?.networkErrors as any[])?.length || (t?.networkErrorCount as number) || 0;
      }

      setLatest({
        ...latestRun,
        journey_title: (latestRun.agent_journeys as any)?.title || "Unknown",
        findings_count: runFindings.length,
        bug_count: runFindings.filter(f => f.type === "bug").length,
        console_error_count: consoleErrs,
        network_error_count: networkErrs,
      });
    });
  }, []);

  const patterns = useMemo(() => clusterFindings(allFindings, allRuns), [allFindings, allRuns]);
  const flakiest = useMemo(() => findFlakiestJourney(allRuns, allJourneys), [allRuns, allJourneys]);
  const topCat = useMemo(() => mostCommonCategory(allFindings), [allFindings]);

  if (!import.meta.env.DEV || !latest) return null;

  const statusIcon = {
    passed: <CheckCircle2 className="w-3 h-3 text-green-500" />,
    failed: <XCircle className="w-3 h-3 text-red-500" />,
    needs_review: <AlertTriangle className="w-3 h-3 text-amber-500" />,
  }[latest.status] || <Footprints className="w-3 h-3 text-muted-foreground" />;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-serif bg-card/90 backdrop-blur border border-border/30 shadow-lg hover:bg-accent/10 transition-colors"
      >
        <Footprints className="w-3 h-3 text-primary" />
        <span className="text-foreground">Wanderer</span>
        {statusIcon}
        {latest.findings_count > 0 && <span className="bg-primary/10 text-primary px-1 rounded-full">{latest.findings_count}</span>}
        {patterns.length > 0 && <span className="bg-amber-500/10 text-amber-500 px-1 rounded-full">⟳{patterns.length}</span>}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-card/95 backdrop-blur border border-border/30 shadow-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-serif text-primary/60 uppercase tracking-wider">Latest Run</p>
              <span className="text-[9px] font-serif text-muted-foreground">{new Date(latest.created_at).toLocaleString()}</span>
            </div>

            <p className="text-xs font-serif text-foreground font-medium">{latest.journey_title}</p>

            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="text-xs font-serif text-foreground capitalize">{latest.status.replace("_", " ")}</span>
              <span className="text-[10px] font-serif text-muted-foreground ml-auto">Score: {latest.score ?? "—"}/100</span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { icon: <Eye className="w-3 h-3" />, value: latest.findings_count, label: "Findings" },
                { icon: <XCircle className="w-3 h-3" />, value: latest.bug_count, label: "Bugs" },
                { icon: <Terminal className="w-3 h-3" />, value: latest.console_error_count, label: "Console" },
                { icon: <Wifi className="w-3 h-3" />, value: latest.network_error_count, label: "Network" },
              ].map((m) => (
                <div key={m.label} className="p-1.5 rounded bg-muted/30">
                  <div className="flex justify-center text-muted-foreground mb-0.5">{m.icon}</div>
                  <p className={`text-xs font-serif font-bold ${m.value > 0 ? "text-red-500" : "text-foreground"}`}>{m.value}</p>
                  <p className="text-[8px] font-serif text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Pattern memory signals */}
            {(patterns.length > 0 || flakiest || topCat) && (
              <div className="space-y-1 pt-1 border-t border-border/10">
                <p className="text-[9px] font-serif text-primary/60 uppercase tracking-wider">Pattern Memory</p>
                {patterns.length > 0 && (
                  <p className="text-[10px] font-serif text-muted-foreground">
                    <RotateCcw className="w-2.5 h-2.5 inline mr-1" />
                    <strong className="text-foreground">{patterns.length}</strong> recurring pattern{patterns.length > 1 ? "s" : ""}
                  </p>
                )}
                {topCat && (
                  <p className="text-[10px] font-serif text-muted-foreground">
                    Most common: <strong className="text-foreground">{CATEGORY_LABELS[topCat] || topCat}</strong>
                  </p>
                )}
                {flakiest && (
                  <p className="text-[10px] font-serif text-muted-foreground">
                    ⚡ Flakiest: <strong className="text-foreground">{flakiest.title}</strong>
                    <span className="text-[9px] ml-1">({Math.round(flakiest.flakyRate * 100)}%)</span>
                  </p>
                )}
              </div>
            )}

            {latest.summary && <p className="text-[9px] font-serif text-muted-foreground leading-relaxed">{latest.summary}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

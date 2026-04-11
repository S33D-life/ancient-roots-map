/**
 * WandererDevPanel — Compact dev-mode overlay showing latest run info
 * with journey title, error counts, and finding breakdown.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle, Terminal, Wifi, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export function WandererDevPanel() {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState<LatestRunInfo | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    supabase
      .from("agent_runs")
      .select("id, status, summary, score, created_at, agent_journeys(title)")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: findingsData } = await supabase
          .from("agent_findings")
          .select("type, trace_json")
          .eq("run_id", data.id);

        const findings = findingsData || [];
        let consoleErrs = 0;
        let networkErrs = 0;
        for (const f of findings) {
          const t = f.trace_json as Record<string, any> | null;
          consoleErrs += (t?.consoleErrors as any[])?.length || (t?.consoleErrorCount as number) || 0;
          networkErrs += (t?.networkErrors as any[])?.length || (t?.networkErrorCount as number) || 0;
        }

        setLatest({
          ...data,
          journey_title: (data.agent_journeys as any)?.title || "Unknown",
          findings_count: findings.length,
          bug_count: findings.filter(f => f.type === "bug").length,
          console_error_count: consoleErrs,
          network_error_count: networkErrs,
        });
      });
  }, []);

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
        {latest.findings_count > 0 && (
          <span className="bg-primary/10 text-primary px-1 rounded-full">{latest.findings_count}</span>
        )}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-card/95 backdrop-blur border border-border/30 shadow-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-serif text-primary/60 uppercase tracking-wider">Latest Run</p>
              <span className="text-[9px] font-serif text-muted-foreground">
                {new Date(latest.created_at).toLocaleString()}
              </span>
            </div>

            <p className="text-xs font-serif text-foreground font-medium">{latest.journey_title}</p>

            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="text-xs font-serif text-foreground capitalize">{latest.status.replace("_", " ")}</span>
              <span className="text-[10px] font-serif text-muted-foreground ml-auto">
                Score: {latest.score ?? "—"}/100
              </span>
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

            {latest.summary && (
              <p className="text-[9px] font-serif text-muted-foreground leading-relaxed">{latest.summary}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

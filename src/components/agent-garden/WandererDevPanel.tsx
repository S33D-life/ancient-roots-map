/**
 * WandererDevPanel — Compact dev-mode overlay showing latest run info.
 * Only renders when import.meta.env.DEV is true.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LatestRunInfo {
  id: string;
  status: string;
  summary: string | null;
  score: number | null;
  created_at: string;
  findings_count: number;
}

export function WandererDevPanel() {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState<LatestRunInfo | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    supabase
      .from("agent_runs")
      .select("id, status, summary, score, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { count } = await supabase
          .from("agent_findings")
          .select("id", { count: "exact", head: true })
          .eq("run_id", data.id);
        setLatest({ ...data, findings_count: count || 0 });
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
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-card/95 backdrop-blur border border-border/30 shadow-xl p-3 space-y-2"
          >
            <p className="text-[10px] font-serif text-primary/60 uppercase tracking-wider">Latest Run</p>
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="text-xs font-serif text-foreground capitalize">{latest.status.replace("_", " ")}</span>
              <span className="text-[10px] font-serif text-muted-foreground ml-auto">
                Score: {latest.score ?? "—"}
              </span>
            </div>
            {latest.summary && (
              <p className="text-[10px] font-serif text-muted-foreground leading-relaxed">{latest.summary}</p>
            )}
            <div className="flex items-center justify-between text-[10px] font-serif text-muted-foreground">
              <span>{latest.findings_count} finding(s)</span>
              <span>{new Date(latest.created_at).toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

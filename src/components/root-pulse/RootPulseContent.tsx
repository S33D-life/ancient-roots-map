/**
 * RootPulseContent — The unfurled root layer: pulse metrics + recent traces
 * as one connected living system.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalHeartTotal } from "@/repositories/hearts";
import { getGlobalOfferingCount } from "@/repositories/offerings";
import { formatDistanceToNow } from "date-fns";
import { TreeDeciduous, Heart, Music, Users, Hexagon } from "lucide-react";

interface Metrics {
  trees: number;
  offerings: number;
  hearts: number;
  hives: number;
  councils: number;
}

interface TraceEvent {
  id: string;
  type: "tree" | "offering" | "heart" | "council";
  label: string;
  timestamp: string;
}

const TRACE_ICONS: Record<TraceEvent["type"], React.ReactNode> = {
  tree: <TreeDeciduous className="w-3 h-3" />,
  offering: <Music className="w-3 h-3" />,
  heart: <Heart className="w-3 h-3" />,
  council: <Users className="w-3 h-3" />,
};

interface Props {
  prefersReduced: boolean;
}

export default function RootPulseContent({ prefersReduced }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    try {
      const [
        { count: trees },
        offerings,
        hearts,
        { data: hiveData },
        { count: councils },
      ] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }),
        getGlobalOfferingCount(),
        getGlobalHeartTotal(),
        supabase.from("species_hives").select("id", { count: "exact", head: false }).limit(200),
        supabase.from("council_participation_rewards").select("*", { count: "exact", head: true }),
      ]);
      setMetrics({
        trees: trees || 0,
        offerings,
        hearts,
        hives: hiveData?.length || 0,
        councils: councils || 0,
      });

      // Recent traces
      const results: TraceEvent[] = [];
      const { data: recentTrees } = await supabase
        .from("trees").select("id, name, created_at")
        .order("created_at", { ascending: false }).limit(3);
      (recentTrees || []).forEach(t =>
        results.push({ id: `t-${t.id}`, type: "tree", label: t.name || "A new tree", timestamp: t.created_at })
      );
      const { data: recentOfferings } = await supabase
        .from("offerings").select("id, type, created_at")
        .order("created_at", { ascending: false }).limit(3);
      (recentOfferings || []).forEach(o =>
        results.push({ id: `o-${o.id}`, type: "offering", label: `${o.type || "Offering"} left`, timestamp: o.created_at })
      );
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTraces(results.slice(0, 5));
    } catch {
      // Silently degrade — pulse is non-critical
    }
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    load();
  }, [load]);

  const pulseItems = metrics ? [
    { icon: <TreeDeciduous className="w-3.5 h-3.5" />, value: metrics.trees, label: "rooted" },
    { icon: <Music className="w-3.5 h-3.5" />, value: metrics.offerings, label: "offered" },
    { icon: <Heart className="w-3.5 h-3.5" />, value: metrics.hearts, label: "hearts" },
    { icon: <Hexagon className="w-3.5 h-3.5" />, value: metrics.hives, label: "hives" },
    { icon: <Users className="w-3.5 h-3.5" />, value: metrics.councils, label: "gathered" },
  ] : [];

  const stagger = prefersReduced ? 0 : 0.07;

  return (
    <div className="pt-5 pb-3 space-y-5">
      {/* Mycelium connector */}
      <div className="flex justify-center" aria-hidden>
        <motion.div
          className="w-px h-7"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.04))" }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.15, duration: prefersReduced ? 0.1 : 0.5 }}
        />
      </div>

      {/* ── A. Pulse — current root-state ── */}
      {metrics ? (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5">
          {pulseItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * stagger, duration: 0.35 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-primary/40">{item.icon}</span>
              <span className="text-sm font-serif font-semibold tabular-nums text-foreground/65">
                {item.value.toLocaleString()}
              </span>
              <span className="text-[10px] font-serif text-muted-foreground/40">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Gentle loading shimmer */
        <div className="flex justify-center gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 w-16 rounded-full bg-muted/20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Organic divider — wave, not line */}
      <div className="flex justify-center" aria-hidden>
        <svg viewBox="0 0 120 8" className="w-16 h-2 opacity-[0.1]">
          <path d="M0 4 Q30 1, 60 4 T120 4" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── B. Traces — recent movement through the grove ── */}
      {traces.length > 0 ? (
        <div className="space-y-2 max-w-xs mx-auto">
          {traces.map((trace, i) => (
            <motion.div
              key={trace.id}
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * (prefersReduced ? 0 : 0.09), duration: 0.35 }}
              className="flex items-center gap-2 text-muted-foreground/50"
            >
              <span className="text-primary/25 shrink-0">{TRACE_ICONS[trace.type]}</span>
              <span className="text-[11px] font-serif truncate flex-1 text-muted-foreground/55">
                {trace.label}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/25 shrink-0 tabular-nums">
                {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: false })}
              </span>
            </motion.div>
          ))}
        </div>
      ) : loaded ? null : (
        <div className="space-y-2 max-w-xs mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-3 rounded-full bg-muted/15 animate-pulse" style={{ width: `${60 + i * 12}%` }} />
          ))}
        </div>
      )}

      {/* Settling tendril */}
      <div className="flex justify-center" aria-hidden>
        <motion.div
          className="w-px h-5"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.06), transparent)" }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: prefersReduced ? 0 : 0.7, duration: 0.3 }}
        />
      </div>
    </div>
  );
}

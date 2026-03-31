/**
 * RootPulse — A living root-layer that reveals ecosystem pulse + recent activity
 * as one organic unfolding experience beneath the surface of /s33d.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalHeartTotal } from "@/repositories/hearts";
import { getGlobalOfferingCount } from "@/repositories/offerings";
import { formatDistanceToNow } from "date-fns";
import { TreeDeciduous, Heart, Music, Users, Hexagon } from "lucide-react";

/* ── Types ── */
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

/* ── Root glyph SVG ── */
const RootGlyph = ({ pulsing }: { pulsing: boolean }) => (
  <svg viewBox="0 0 64 80" className="w-8 h-10" aria-hidden>
    {/* Subtle glow */}
    {pulsing && (
      <motion.circle
        cx="32" cy="24" r="14"
        fill="hsl(var(--primary) / 0.06)"
        animate={{ r: [14, 18, 14], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    )}
    {/* Central seed */}
    <circle cx="32" cy="24" r="3" fill="hsl(var(--primary) / 0.35)" />
    {/* Root tendrils */}
    <path
      d="M32 27 Q28 42, 18 60 M32 27 Q32 45, 32 65 M32 27 Q36 42, 46 60"
      fill="none"
      stroke="hsl(var(--primary) / 0.18)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Tiny root hairs */}
    <path
      d="M22 50 Q18 54, 14 56 M42 50 Q46 54, 50 56 M28 55 Q24 60, 20 65 M36 55 Q40 60, 44 65"
      fill="none"
      stroke="hsl(var(--primary) / 0.10)"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
  </svg>
);

/* ── Component ── */
export default function RootPulse() {
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
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

    // Recent activity traces
    const results: TraceEvent[] = [];
    const { data: recentTrees } = await supabase
      .from("trees").select("id, name, created_at")
      .order("created_at", { ascending: false }).limit(3);
    (recentTrees || []).forEach(t =>
      results.push({ id: `t-${t.id}`, type: "tree", label: t.name || "A new tree", timestamp: t.created_at })
    );
    const { data: recentOfferings } = await supabase
      .from("offerings").select("id, offering_type, created_at")
      .order("created_at", { ascending: false }).limit(3);
    (recentOfferings || []).forEach(o =>
      results.push({ id: `o-${o.id}`, type: "offering", label: `${o.offering_type || "Offering"} left`, timestamp: o.created_at })
    );
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setTraces(results.slice(0, 5));
    setLoaded(true);
  }, [loaded]);

  const toggle = useCallback(() => {
    if (!open) load();
    setOpen(prev => !prev);
  }, [open, load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-root-pulse]")) setOpen(false);
    };
    document.addEventListener("click", handler, { passive: true });
    return () => document.removeEventListener("click", handler);
  }, [open]);

  const pulseItems = metrics ? [
    { icon: <TreeDeciduous className="w-3.5 h-3.5" />, value: metrics.trees, label: "trees mapped" },
    { icon: <Music className="w-3.5 h-3.5" />, value: metrics.offerings, label: "offerings" },
    { icon: <Heart className="w-3.5 h-3.5" />, value: metrics.hearts, label: "hearts" },
    { icon: <Hexagon className="w-3.5 h-3.5" />, value: metrics.hives, label: "hives" },
    { icon: <Users className="w-3.5 h-3.5" />, value: metrics.councils, label: "gatherings" },
  ] : [];

  return (
    <div data-root-pulse className="relative max-w-2xl mx-auto px-4 py-12">
      {/* ── Entry point: root glyph ── */}
      <motion.button
        onClick={toggle}
        className="mx-auto flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none outline-none"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Sense the roots"
      >
        <RootGlyph pulsing={!open} />
        <motion.span
          className="text-[10px] font-serif text-muted-foreground/40 tracking-widest uppercase"
          animate={{ opacity: open ? 0 : [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          beneath the surface
        </motion.span>
      </motion.button>

      {/* ── Unfurled root layer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6 pb-2 space-y-8">
              {/* Mycelium connector line */}
              <div className="flex justify-center" aria-hidden>
                <motion.div
                  className="w-px h-8"
                  style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))" }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                />
              </div>

              {/* ── A. Current state of the roots (pulse metrics) ── */}
              {metrics && (
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {pulseItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-1.5 text-foreground/70"
                    >
                      <span className="text-primary/50">{item.icon}</span>
                      <span className="text-sm font-serif font-semibold tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-serif text-muted-foreground/50">
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Soft divider */}
              <div className="flex justify-center" aria-hidden>
                <svg viewBox="0 0 120 8" className="w-20 h-2 opacity-[0.12]">
                  <path d="M0 4 Q30 0, 60 4 T120 4" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.6" />
                </svg>
              </div>

              {/* ── B. What flows through them (recent traces) ── */}
              {traces.length > 0 && (
                <div className="space-y-2.5 max-w-sm mx-auto">
                  {traces.map((trace, i) => (
                    <motion.div
                      key={trace.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      className="flex items-center gap-2.5 text-muted-foreground/60"
                    >
                      <span className="text-primary/30 shrink-0">{TRACE_ICONS[trace.type]}</span>
                      <span className="text-xs font-serif truncate flex-1">{trace.label}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/30 shrink-0 tabular-nums">
                        {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: false })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Settling line */}
              <div className="flex justify-center" aria-hidden>
                <motion.div
                  className="w-px h-6"
                  style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.08), transparent)" }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

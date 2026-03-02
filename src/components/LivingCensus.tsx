/**
 * LivingCensus — real-time global counter that updates live when
 * new trees are mapped anywhere in the world.
 * "X Ancient Friends mapped by Y Wanderers across Z countries."
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CensusStats {
  trees: number;
  wanderers: number;
  countries: number;
}

const useLivingCensus = () => {
  const [stats, setStats] = useState<CensusStats>({ trees: 0, wanderers: 0, countries: 0 });
  const [pulse, setPulse] = useState(false);

  const fetchStats = useCallback(async () => {
    const [treesRes, creatorsRes] = await Promise.all([
      supabase.from("trees").select("id", { count: "exact", head: true }),
      supabase.from("trees").select("created_by, nation"),
    ]);

    const treeCount = treesRes.count || 0;
    const data = creatorsRes.data || [];
    const wanderers = new Set(data.map(t => t.created_by).filter(Boolean)).size;
    const countries = new Set(data.map(t => t.nation).filter(Boolean)).size;

    setStats({ trees: treeCount, wanderers, countries });
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime inserts on trees table
    const channel = supabase
      .channel("living-census")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trees" },
        () => {
          // Trigger pulse animation
          setPulse(true);
          setTimeout(() => setPulse(false), 1200);
          // Increment optimistically, then reconcile
          setStats(prev => ({ ...prev, trees: prev.trees + 1 }));
          // Refetch for accurate wanderer/country counts
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, pulse };
};

/** Animated number that counts up on mount and pulses on live updates */
const LiveNumber = ({ value, pulse }: { value: number; pulse: boolean }) => {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Initial count-up animation
  useEffect(() => {
    if (value === 0 || hasAnimated.current) {
      // After initial animation, just update directly
      if (hasAnimated.current) setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span
      ref={ref}
      className={`tabular-nums transition-all duration-300 ${pulse ? "text-accent scale-110" : ""}`}
      style={{ display: "inline-block" }}
    >
      {display.toLocaleString()}
    </span>
  );
};

const LivingCensus = () => {
  const { stats, pulse } = useLivingCensus();

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Pulse ring on live update */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.08 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              border: "2px solid hsl(var(--accent) / 0.5)",
              boxShadow: "0 0 20px hsl(var(--accent) / 0.2)",
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="rounded-2xl px-6 py-5 backdrop-blur-md border text-center"
        style={{
          background: "hsl(var(--card) / 0.5)",
          borderColor: pulse ? "hsl(var(--accent) / 0.4)" : "hsl(var(--border) / 0.3)",
          transition: "border-color 0.5s ease",
        }}
      >
        {/* Sentence-style counter */}
        <p className="font-serif text-sm md:text-base leading-relaxed text-foreground/90">
          <LiveNumber value={stats.trees} pulse={pulse} />{" "}
          <span className="text-muted-foreground">Ancient Friends mapped by</span>{" "}
          <LiveNumber value={stats.wanderers} pulse={pulse} />{" "}
          <span className="text-muted-foreground">Wanderers across</span>{" "}
          <LiveNumber value={stats.countries} pulse={pulse} />{" "}
          <span className="text-muted-foreground">countries</span>
        </p>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span
            className="w-1.5 h-1.5 rounded-full pulse-live"
            style={{ background: "hsl(var(--accent))" }}
          />
          <span className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase">
            Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default LivingCensus;

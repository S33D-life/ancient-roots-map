/**
 * LivingCensus — real-time global counter that updates live when
 * new trees are mapped anywhere in the world.
 * "X Ancient Friends mapped by Y Wanderers across Z countries."
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CensusStats {
  trees: number;
  wanderers: number;
  countries: number;
}

const useLivingCensus = () => {
  const [stats, setStats] = useState<CensusStats>({ trees: 0, wanderers: 0, countries: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pulse, setPulse] = useState(false);

  const fetchStats = useCallback(async () => {
    const [treesRes, creatorsRes] = await Promise.all([
      supabase.from("trees").select("id", { count: "exact", head: true }),
      supabase.from("trees").select("created_by, nation"),
    ]);

    if (treesRes.error || creatorsRes.error) { setStatus("error"); return; }
    setStatus("ready");
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

  return { stats, pulse, status };
};

/** Animated number that counts up on mount and pulses on live updates */
const LiveNumber = ({ value, pulse }: { value: number; pulse: boolean }) => (
  <span className={pulse ? "text-primary" : undefined}>{value.toLocaleString()}</span>
);

const LivingCensus = () => {
  const { stats, pulse, status } = useLivingCensus();

  if (status !== "ready") return <p role="status" className="font-serif text-center">{status === "loading" ? "Gathering the grove’s living record…" : "The living count is resting. Explore the Atlas to meet its trees."}</p>;
  return (
    <div className="relative w-full max-w-2xl mx-auto" data-census>
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

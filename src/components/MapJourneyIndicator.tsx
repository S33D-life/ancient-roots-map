import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TreeDeciduous, Sprout, Flame } from "lucide-react";

/**
 * MapJourneyIndicator — a floating, compact widget showing
 * the user's journey stats overlaid on the map. Collapses to a
 * glowing orb when idle, expands on tap. Links to Hearth.
 */
const MapJourneyIndicator = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ trees: 0, hearts: 0, seeds: 0 });
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchStats(session.user.id);
      }
    });
  }, []);

  const fetchStats = async (uid: string) => {
    const [treesRes, heartsRes, seedsRes] = await Promise.all([
      supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", uid),
      supabase.from("heart_transactions").select("amount").eq("user_id", uid),
      supabase.from("planted_seeds").select("*", { count: "exact", head: true }).eq("planter_id", uid),
    ]);

    const heartTotal = (heartsRes.data || []).reduce((sum: number, h: any) => sum + (h.amount || 0), 0);
    const newStats = {
      trees: treesRes.count || 0,
      hearts: heartTotal,
      seeds: seedsRes.count || 0,
    };

    // Pulse if there's activity
    if (newStats.hearts > 0 || newStats.seeds > 0) {
      setPulse(true);
      setTimeout(() => setPulse(false), 3000);
    }

    setStats(newStats);
  };

  if (!userId) return null;

  const total = stats.trees + stats.hearts + stats.seeds;
  if (total === 0) return null;

  return (
    <div className="absolute top-20 right-3 z-[1001]">
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="orb"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setExpanded(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "hsla(30, 30%, 12%, 0.92)",
              border: "1px solid hsla(42, 40%, 30%, 0.5)",
              boxShadow: pulse
                ? "0 0 16px hsla(42, 90%, 55%, 0.5), 0 0 4px hsla(42, 90%, 55%, 0.3)"
                : "0 2px 10px rgba(0,0,0,0.3)",
              backdropFilter: "blur(6px)",
            }}
            title="Your journey"
          >
            <Flame className="w-4 h-4" style={{ color: "hsl(42, 80%, 55%)" }} />
            {pulse && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid hsla(42, 90%, 55%, 0.4)" }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ scale: 0.9, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -4 }}
            className="rounded-xl overflow-hidden"
            style={{
              background: "hsla(30, 20%, 8%, 0.96)",
              border: "1px solid hsla(42, 40%, 30%, 0.4)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              minWidth: "140px",
            }}
          >
            <button
              onClick={() => setExpanded(false)}
              className="w-full px-3 py-2 flex items-center gap-2 border-b text-left"
              style={{
                borderColor: "hsla(42, 40%, 30%, 0.2)",
                color: "hsl(42, 60%, 55%)",
              }}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] font-serif tracking-wider">Your Journey</span>
            </button>

            <div className="px-3 py-2.5 flex flex-col gap-2">
              {[
                { icon: TreeDeciduous, value: stats.trees, label: "Trees", color: "hsl(120, 45%, 55%)" },
                { icon: Heart, value: stats.hearts, label: "Hearts", color: "hsl(42, 80%, 55%)" },
                { icon: Sprout, value: stats.seeds, label: "Seeds", color: "hsl(80, 50%, 55%)" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  <span className="text-xs font-serif" style={{ color: "hsl(45, 70%, 70%)" }}>
                    {s.value}
                  </span>
                  <span className="text-[9px] font-serif" style={{ color: "hsl(42, 30%, 45%)" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/dashboard"
              className="block px-3 py-2 text-center text-[10px] font-serif tracking-wider transition-colors border-t"
              style={{
                borderColor: "hsla(42, 40%, 30%, 0.2)",
                color: "hsl(42, 70%, 55%)",
              }}
            >
              Open Hearth →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapJourneyIndicator;

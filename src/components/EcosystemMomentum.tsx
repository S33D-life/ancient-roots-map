/**
 * EcosystemMomentum — Calm weekly activity signals that show the ecosystem is alive.
 * Displays recent-week counts and a gentle discovery invitation.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOfferingCountSince } from "@/repositories/offerings";
import { TreeDeciduous, Music, Heart, Users, Compass } from "lucide-react";
import { motion } from "framer-motion";

interface WeeklyPulse {
  treesThisWeek: number;
  offeringsThisWeek: number;
  heartsThisWeek: number;
  councilsThisWeek: number;
}

interface Props {
  /** Show discovery invitation below pulse */
  showDiscovery?: boolean;
  /** Compact single-line layout */
  compact?: boolean;
}

export default function EcosystemMomentum({ showDiscovery = false, compact = false }: Props) {
  const [pulse, setPulse] = useState<WeeklyPulse | null>(null);
  const [discoveryTree, setDiscoveryTree] = useState<{ id: string; name: string; species: string | null } | null>(null);

  useEffect(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const fetchPulse = async () => {
      const [
        { count: treesThisWeek },
        offeringsThisWeek,
        { data: heartData },
        { count: councilsThisWeek },
      ] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
        getOfferingCountSince(oneWeekAgo),
        supabase.from("heart_transactions").select("amount").gte("created_at", oneWeekAgo),
        supabase.from("council_participation_rewards").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      ]);

      const heartsThisWeek = (heartData || []).reduce((s, r) => s + (r.amount || 0), 0);

      setPulse({
        treesThisWeek: treesThisWeek || 0,
        offeringsThisWeek,
        heartsThisWeek: heartsThisWeek,
        councilsThisWeek: councilsThisWeek || 0,
      });
    };

    fetchPulse();

    // Fetch a tree with few offerings for discovery invitation
    if (showDiscovery) {
      supabase
        .from("trees")
        .select("id, name, species")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(async ({ data: recentTrees }) => {
          if (!recentTrees?.length) return;
          // Find one with no offerings
          for (const tree of recentTrees.slice(0, 10)) {
            const { count } = await supabase
              .from("offerings")
              .select("*", { count: "exact", head: true })
              .eq("tree_id", tree.id);
            if ((count || 0) === 0) {
              setDiscoveryTree(tree);
              break;
            }
          }
        });
    }
  }, [showDiscovery]);

  if (!pulse) return null;

  const signals = [
    { icon: <TreeDeciduous className="w-3.5 h-3.5" />, count: pulse.treesThisWeek, text: "trees mapped this week", color: "text-emerald-400" },
    { icon: <Music className="w-3.5 h-3.5" />, count: pulse.offeringsThisWeek, text: "new offerings", color: "text-primary" },
    { icon: <Heart className="w-3.5 h-3.5" />, count: pulse.heartsThisWeek, text: "hearts earned", color: "text-red-400" },
    { icon: <Users className="w-3.5 h-3.5" />, count: pulse.councilsThisWeek, text: "council gatherings", color: "text-amber-400" },
  ].filter(s => s.count > 0);

  if (signals.length === 0 && !discoveryTree) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap text-[10px] font-serif text-muted-foreground/70">
        {signals.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className={s.color}>{s.icon}</span>
            <span className="text-foreground/60 font-medium">{s.count}</span>
            {s.text}
          </span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-4"
    >
      <h4 className="text-[10px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-3">
        This Week in the Forest
      </h4>
      <div className="space-y-2">
        {signals.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-2 text-[11px] font-serif"
          >
            <span className={s.color}>{s.icon}</span>
            <span className="text-foreground/80">
              <span className="font-medium">{s.count}</span>{" "}
              <span className="text-muted-foreground/70">{s.text}</span>
            </span>
          </motion.div>
        ))}
      </div>

      {/* Discovery invitation */}
      {showDiscovery && discoveryTree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 pt-3 border-t border-border/15"
        >
          <Link
            to={`/tree/${discoveryTree.id}`}
            className="flex items-start gap-2 text-[11px] font-serif text-muted-foreground/70 hover:text-foreground/80 transition-colors group"
          >
            <Compass className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary mt-0.5 shrink-0" />
            <span>
              <span className="text-foreground/60 font-medium">{discoveryTree.name}</span>{" "}
              {discoveryTree.species && <span className="italic">({discoveryTree.species})</span>}{" "}
              has no offerings yet. Would you like to visit?
            </span>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

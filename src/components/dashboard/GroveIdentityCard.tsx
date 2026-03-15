import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TreeDeciduous, Heart, Sparkles, Sprout, Map, BookOpen, ChevronRight, Hexagon, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserOfferingCount } from "@/repositories/offerings";

interface GroveIdentityCardProps {
  userId: string;
  userName?: string | null;
}

interface GroveStats {
  treesLogged: number;
  treesVisited: number;
  offeringsMade: number;
  heartsBalance: number;
  speciesHearts: number;
  influenceTokens: number;
  seedsPlanted: number;
  daysSinceFirst: number | null;
}

const GroveIdentityCard = ({ userId, userName }: GroveIdentityCardProps) => {
  const [stats, setStats] = useState<GroveStats>({
    treesLogged: 0,
    treesVisited: 0,
    offeringsMade: 0,
    heartsBalance: 0,
    speciesHearts: 0,
    influenceTokens: 0,
    seedsPlanted: 0,
    daysSinceFirst: null,
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [treesRes, checkinsRes, offeringsMade, heartsRes, plantsRes] = await Promise.all([
        supabase.from("trees").select("id, created_at", { count: "exact", head: false }).eq("created_by", userId).order("created_at", { ascending: true }).limit(1),
        supabase.from("tree_checkins").select("tree_id", { count: "exact" }).eq("user_id", userId),
        getUserOfferingCount(userId),
        supabase.from("user_heart_balances").select("s33d_hearts, species_hearts, influence_tokens").eq("user_id", userId).maybeSingle(),
        supabase.from("greenhouse_plants").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const firstTreeDate = treesRes.data?.[0]?.created_at;
      const daysSinceFirst = firstTreeDate
        ? Math.floor((Date.now() - new Date(firstTreeDate).getTime()) / 86400000)
        : null;

      const uniqueVisited = new Set((checkinsRes.data || []).map(c => c.tree_id)).size;

      setStats({
        treesLogged: treesRes.count ?? 0,
        treesVisited: uniqueVisited,
        offeringsMade,
        heartsBalance: heartsRes.data?.s33d_hearts ?? 0,
        speciesHearts: heartsRes.data?.species_hearts ?? 0,
        influenceTokens: heartsRes.data?.influence_tokens ?? 0,
        seedsPlanted: plantsRes.count ?? 0,
        daysSinceFirst,
      });
    };
    fetchAll();
  }, [userId]);

  const nextAction = useMemo(() => {
    if (stats.treesLogged === 0) return { label: "Map your first Ancient Friend", to: "/map", icon: Map };
    if (stats.offeringsMade === 0) return { label: "Leave your first offering", to: "/library", icon: BookOpen };
    if (stats.treesVisited <= 1) return { label: "Visit another tree", to: "/map", icon: TreeDeciduous };
    if (stats.seedsPlanted === 0) return { label: "Plant a seed pod", to: "/map", icon: Sprout };
    return { label: "Explore the Atlas", to: "/atlas", icon: Map };
  }, [stats]);

  const statPills = [
    { label: "Trees", value: stats.treesLogged, icon: TreeDeciduous },
    { label: "Visits", value: stats.treesVisited, icon: Map },
    { label: "Hearts", value: stats.heartsBalance, icon: Heart },
    { label: "Species", value: stats.speciesHearts, icon: Hexagon },
    { label: "Influence", value: stats.influenceTokens, icon: Zap },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border border-primary/25 bg-gradient-to-br from-card/80 via-card/60 to-primary/[0.04] backdrop-blur-sm overflow-hidden"
    >
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-primary tracking-wide">
            {userName ? `${userName}'s Grove` : "Your Grove"}
          </h2>
          {stats.daysSinceFirst !== null && (
            <p className="text-[11px] text-muted-foreground/60 font-serif mt-0.5">
              {stats.daysSinceFirst === 0 ? "Joined today" : `${stats.daysSinceFirst} day${stats.daysSinceFirst !== 1 ? "s" : ""} walking`}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <TreeDeciduous className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-1 px-4 pb-4">
        {statPills.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center py-2.5 rounded-xl bg-background/40 border border-border/20"
          >
            <s.icon className="w-3.5 h-3.5 text-primary/60 mb-1" />
            <span className="text-base font-serif font-bold text-foreground">{s.value}</span>
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Next action */}
      <Link
        to={nextAction.to}
        className="flex items-center gap-2.5 mx-4 mb-4 px-3.5 py-2.5 rounded-xl bg-primary/8 border border-primary/15 hover:bg-primary/12 hover:border-primary/25 transition-colors group"
      >
        <nextAction.icon className="w-4 h-4 text-primary/70" />
        <span className="flex-1 text-xs font-serif text-primary/80">{nextAction.label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary/70 transition-colors" />
      </Link>
    </motion.div>
  );
};

export default GroveIdentityCard;

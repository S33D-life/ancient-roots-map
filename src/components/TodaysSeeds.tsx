/**
 * TodaysSeeds — shows where the user planted seeds today.
 * A gentle history panel reinforcing participation.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TodaysSeedsProps {
  userId: string;
}

const TodaysSeeds = ({ userId }: TodaysSeedsProps) => {
  const { allSeeds, seedsRemaining, seedsUsedToday } = useSeedEconomy(userId);

  // Get today's planted seeds
  const todaysPlanted = useMemo(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return allSeeds
      .filter((s) => s.planter_id === userId && new Date(s.planted_at) >= midnight)
      .sort((a, b) => new Date(b.planted_at).getTime() - new Date(a.planted_at).getTime());
  }, [allSeeds, userId]);

  // Fetch tree names for today's seeds
  const treeIds = useMemo(() => [...new Set(todaysPlanted.map((s) => s.tree_id))], [todaysPlanted]);

  const { data: treeNames = {} } = useQuery({
    queryKey: ["seed-tree-names", treeIds.join(",")],
    queryFn: async () => {
      if (treeIds.length === 0) return {};
      const { data } = await supabase
        .from("trees")
        .select("id, name, species, nation")
        .in("id", treeIds);
      const map: Record<string, { name: string; species: string | null; nation: string | null }> = {};
      (data || []).forEach((t) => {
        map[t.id] = { name: t.name, species: t.species, nation: t.nation };
      });
      return map;
    },
    enabled: treeIds.length > 0,
    staleTime: 5 * 60_000,
  });

  if (seedsUsedToday === 0) return null;

  // Group by tree
  const byTree = todaysPlanted.reduce(
    (acc, s) => {
      if (!acc[s.tree_id]) acc[s.tree_id] = [];
      acc[s.tree_id].push(s);
      return acc;
    },
    {} as Record<string, typeof todaysPlanted>,
  );

  return (
    <Card className="border-primary/15 bg-card/50 backdrop-blur overflow-hidden">
      {/* Ambient top bar */}
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }}
      />
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.1)" }}
            >
              <Sprout className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-serif text-foreground tracking-wide">Today's Seeds</h3>
              <p className="text-[10px] text-muted-foreground/60 font-serif">
                {seedsUsedToday} planted · {seedsRemaining} remaining
              </p>
            </div>
          </div>
          <span className="text-lg font-serif text-primary/70 tabular-nums">
            {seedsUsedToday}<span className="text-muted-foreground/30">/33</span>
          </span>
        </div>

        {/* Seed trail */}
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {Object.entries(byTree).map(([treeId, seeds]) => {
            const tree = treeNames[treeId];
            const name = tree?.name || "Ancient Friend";
            const detail = [tree?.species, tree?.nation].filter(Boolean).join(" · ");

            return (
              <motion.a
                key={treeId}
                href={`/tree/${treeId}`}
                variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-1">
                  {seeds.map((_, i) => (
                    <span key={i} className="text-xs">🌱</span>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate group-hover:text-primary transition-colors">
                    {name}
                  </p>
                  {detail && (
                    <p className="text-[10px] text-muted-foreground/50 font-serif flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      {detail}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
                  {new Date(seeds[0].planted_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "hsl(var(--primary) / 0.5)" }}
            initial={{ width: 0 }}
            animate={{ width: `${(seedsUsedToday / 33) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysSeeds;

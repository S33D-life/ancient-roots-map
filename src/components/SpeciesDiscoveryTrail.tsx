/**
 * Species Discovery Trail — quest system that rewards users for
 * encountering diverse botanical families. Derives progress from
 * the user's mapped trees.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TreeDeciduous, Trophy, Leaf, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TREE_SPECIES from "@/data/treeSpecies";

// Milestone thresholds for families discovered
const MILESTONES = [
  { families: 3, title: "Seedling Explorer", emoji: "🌱" },
  { families: 6, title: "Grove Wanderer", emoji: "🌿" },
  { families: 10, title: "Forest Keeper", emoji: "🌳" },
  { families: 15, title: "Woodland Sage", emoji: "🍂" },
  { families: 20, title: "Ancient Guardian", emoji: "🏔️" },
  { families: 30, title: "Living Census Elder", emoji: "🌍" },
];

// Build a species→family lookup from the species database
const SPECIES_FAMILY_MAP = new Map<string, string>();
(TREE_SPECIES as any[]).forEach((s: any) => {
  SPECIES_FAMILY_MAP.set(s.common.toLowerCase(), s.family);
  if (s.aliases) {
    (s.aliases as string[]).forEach(a => SPECIES_FAMILY_MAP.set(a.toLowerCase(), s.family));
  }
});

function resolveFamily(species: string): string | null {
  const lower = species.toLowerCase();
  if (SPECIES_FAMILY_MAP.has(lower)) return SPECIES_FAMILY_MAP.get(lower)!;
  // Partial match
  for (const [key, family] of SPECIES_FAMILY_MAP) {
    if (lower.includes(key) || key.includes(lower)) return family;
  }
  return null;
}

interface Props {
  userId: string;
  compact?: boolean;
}

const SpeciesDiscoveryTrail = ({ userId, compact = false }: Props) => {
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecies = async () => {
      const { data } = await supabase
        .from("trees")
        .select("species")
        .eq("created_by", userId);

      if (data) {
        const unique = [...new Set(data.map(t => t.species).filter(Boolean))];
        setSpeciesList(unique);
      }
      setLoading(false);
    };
    fetchSpecies();
  }, [userId]);

  const familiesDiscovered = useMemo(() => {
    const families = new Set<string>();
    speciesList.forEach(s => {
      const f = resolveFamily(s);
      if (f) families.add(f);
    });
    return Array.from(families).sort();
  }, [speciesList]);

  const currentMilestone = useMemo(() => {
    return MILESTONES.filter(m => familiesDiscovered.length >= m.families).pop();
  }, [familiesDiscovered]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => familiesDiscovered.length < m.families);
  }, [familiesDiscovered]);

  const progressPct = nextMilestone
    ? Math.round((familiesDiscovered.length / nextMilestone.families) * 100)
    : 100;

  if (loading) return null;

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center border border-accent/25">
            <Leaf className="w-4 h-4 text-accent" />
          </div>
          <div>
            <CardTitle className="font-serif text-sm tracking-wide">
              Species Discovery Trail
            </CardTitle>
            {currentMilestone && (
              <p className="text-[10px] text-muted-foreground font-serif">
                {currentMilestone.emoji} {currentMilestone.title}
              </p>
            )}
          </div>
          <Badge variant="outline" className="ml-auto text-xs font-serif tabular-nums">
            {familiesDiscovered.length} families
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-serif">
              <span>Next: {nextMilestone.emoji} {nextMilestone.title}</span>
              <span>{familiesDiscovered.length}/{nextMilestone.families}</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {!nextMilestone && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20">
            <Trophy className="w-4 h-4 text-accent" />
            <p className="text-xs font-serif text-accent">All milestones achieved! 🌍</p>
          </div>
        )}

        {/* Discovered families grid */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <AnimatePresence>
              {familiesDiscovered.map((family) => (
                <motion.div
                  key={family}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-2 py-1 rounded-full text-[10px] font-serif bg-primary/10 text-primary border border-primary/20"
                >
                  {family}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Species count */}
        <p className="text-[10px] text-muted-foreground font-serif text-center pt-1">
          {speciesList.length} species mapped across {familiesDiscovered.length} botanical {familiesDiscovered.length === 1 ? "family" : "families"}
        </p>
      </CardContent>
    </Card>
  );
};

export default SpeciesDiscoveryTrail;

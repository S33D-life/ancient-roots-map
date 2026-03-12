/**
 * HiveContributionCTA — contribution action panel for Species Hive pages.
 * Encourages: mapping, offerings, harvest docs, research, seasonal observation.
 */
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Camera, Apple, BookOpen, Eye } from "lucide-react";
import type { HiveInfo } from "@/utils/hiveUtils";

interface Props {
  hive: HiveInfo;
  onMapTrees: () => void;
  treeCount?: number;
}

const ACTIONS = [
  { icon: MapPin, label: "Map a tree", desc: "Add a new Ancient Friend to the atlas", key: "map" },
  { icon: Camera, label: "Add an offering", desc: "Share a story, photo, or poem", key: "offering" },
  { icon: Apple, label: "Document a harvest", desc: "Record seasonal abundance", key: "harvest" },
  { icon: BookOpen, label: "Share research", desc: "Add knowledge to the library", key: "research" },
  { icon: Eye, label: "Seasonal observation", desc: "Note what's happening right now", key: "season" },
] as const;

const HiveContributionCTA = ({ hive, onMapTrees, treeCount }: Props) => {
  const showInvitation = typeof treeCount === "number" && treeCount < 5;
  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      <div
        className="h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, hsl(${hive.accentHsl}), transparent)` }}
      />
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-serif text-foreground tracking-wide">
          Help the {hive.displayName} grow
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={a.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  if (a.key === "map") onMapTrees();
                }}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-border/30 text-left transition-all hover:border-primary/30"
                style={{ background: "hsl(var(--card) / 0.4)" }}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: `hsl(${hive.accentHsl})` }} />
                <div className="min-w-0">
                  <p className="text-xs font-serif text-foreground leading-tight">{a.label}</p>
                  <p className="text-[9px] text-muted-foreground font-serif mt-0.5">{a.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default HiveContributionCTA;

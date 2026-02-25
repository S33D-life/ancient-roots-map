/**
 * DashboardCanopyKeeper — "Trees You Sit Beneath" section.
 * Shows user's tree visit history, seasonal coverage, and badges.
 */
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Loader2, TreeDeciduous, Award, Calendar, MapPin } from "lucide-react";
import { useUserCanopyTrees } from "@/hooks/use-tree-checkins";

const SEASON_ICONS: Record<string, string> = {
  bud: "🌱", leaf: "🍃", blossom: "🌸", fruit: "🍎", bare: "🪵",
};
const ALL_SEASONS = ["bud", "leaf", "blossom", "fruit", "bare"];

interface Props {
  userId: string;
}

export default function DashboardCanopyKeeper({ userId }: Props) {
  const { trees, loading } = useUserCanopyTrees(userId);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (trees.length === 0) {
    return (
      <div className="text-center py-8">
        <TreeDeciduous className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-serif text-sm text-muted-foreground">
          You haven't sat beneath any canopies yet.
        </p>
        <p className="font-serif text-xs text-muted-foreground/60 mt-1">
          Visit a tree you've mapped and check in to begin.
        </p>
      </div>
    );
  }

  // Compute badges
  const fullWitness = trees.filter(t => t.seasonsCovered.length === ALL_SEASONS.length);
  const totalVisits = trees.reduce((sum, t) => sum + t.totalVisits, 0);

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="font-serif text-xs gap-1 border-primary/30">
          <TreeDeciduous className="w-3 h-3" /> {trees.length} tree{trees.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="font-serif text-xs gap-1 border-primary/30">
          <Calendar className="w-3 h-3" /> {totalVisits} total visit{totalVisits !== 1 ? "s" : ""}
        </Badge>
        {fullWitness.length > 0 && (
          <Badge variant="outline" className="font-serif text-xs gap-1 border-primary/50 text-primary">
            <Award className="w-3 h-3" /> {fullWitness.length} Four Seasons Witness
          </Badge>
        )}
        {totalVisits >= 10 && (
          <Badge variant="outline" className="font-serif text-xs gap-1 border-accent/50 text-accent">
            <Award className="w-3 h-3" /> Canopy Keeper
          </Badge>
        )}
      </div>

      {/* Tree list */}
      <div className="space-y-2">
        {trees.map((tree) => {
          const coverage = Math.round((tree.seasonsCovered.length / ALL_SEASONS.length) * 100);
          return (
            <Link
              key={tree.tree_id}
              to={`/tree/${tree.tree_id}`}
              className="block p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <TreeDeciduous className="w-5 h-5 text-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-serif text-sm text-foreground truncate">{tree.tree_name}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-serif italic truncate">
                      {tree.tree_species}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-serif">
                    <span>{tree.totalVisits} visit{tree.totalVisits !== 1 ? "s" : ""}</span>
                    <span>First: {new Date(tree.firstVisit).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                    <span>Last: {new Date(tree.lastVisit).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                  </div>
                  {/* Season bar */}
                  <div className="flex gap-1 mt-1.5">
                    {ALL_SEASONS.map((s) => (
                      <div
                        key={s}
                        className={`h-4 flex-1 rounded text-[10px] flex items-center justify-center ${
                          tree.seasonsCovered.includes(s)
                            ? "bg-primary/15 border border-primary/25"
                            : "bg-secondary/20 border border-border/10 opacity-30"
                        }`}
                      >
                        {SEASON_ICONS[s]}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-primary">{coverage}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

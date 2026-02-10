import { Heart, TreeDeciduous, Sprout, Star, BookOpen, Award, Crown, Flame, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface RewardsProps {
  treeCount: number;
  wishlistCount: number;
  plantCount: number;
  offeringCount: number;
}

interface Milestone {
  label: string;
  description: string;
  threshold: number;
  icon: React.ElementType;
  hearts: number;
  category: "trees" | "offerings" | "seeds" | "wishlist";
}

const MILESTONES: Milestone[] = [
  { label: "First Roots", description: "Map your first ancient tree", threshold: 1, icon: TreeDeciduous, hearts: 10, category: "trees" },
  { label: "Grove Keeper", description: "Map 5 ancient trees", threshold: 5, icon: TreeDeciduous, hearts: 25, category: "trees" },
  { label: "Forest Walker", description: "Map 10 ancient trees", threshold: 10, icon: TreeDeciduous, hearts: 50, category: "trees" },
  { label: "Ancient Cartographer", description: "Map 25 ancient trees", threshold: 25, icon: Crown, hearts: 100, category: "trees" },
  { label: "World Tree Mapper", description: "Map 50 ancient trees", threshold: 50, icon: Sparkles, hearts: 200, category: "trees" },
  { label: "First Offering", description: "Leave your first offering", threshold: 1, icon: Flame, hearts: 5, category: "offerings" },
  { label: "Generous Spirit", description: "Leave 10 offerings", threshold: 10, icon: Flame, hearts: 30, category: "offerings" },
  { label: "Seed Sower", description: "Plant your first seed pod", threshold: 1, icon: Sprout, hearts: 5, category: "seeds" },
  { label: "Greenhouse Keeper", description: "Grow 5 seed pods", threshold: 5, icon: Sprout, hearts: 20, category: "seeds" },
  { label: "Wishing Well", description: "Add 3 wishes to the Wishing Tree", threshold: 3, icon: Star, hearts: 15, category: "wishlist" },
];

const getCategoryCount = (milestone: Milestone, props: RewardsProps) => {
  switch (milestone.category) {
    case "trees": return props.treeCount;
    case "offerings": return props.offeringCount;
    case "seeds": return props.plantCount;
    case "wishlist": return props.wishlistCount;
  }
};

const DashboardRewards = (props: RewardsProps) => {
  const earnedMilestones = MILESTONES.filter(m => getCategoryCount(m, props) >= m.threshold);
  const nextMilestones = MILESTONES.filter(m => getCategoryCount(m, props) < m.threshold);

  // Base hearts: 10 per tree mapped
  const baseHearts = props.treeCount * 10;
  const bonusHearts = earnedMilestones.reduce((sum, m) => sum + m.hearts, 0);
  const totalHearts = baseHearts + bonusHearts;

  // Next milestone to unlock
  const nextMilestone = nextMilestones[0];
  const nextProgress = nextMilestone
    ? Math.min(100, (getCategoryCount(nextMilestone, props) / nextMilestone.threshold) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Hearts Counter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <CardContent className="py-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30">
                  <Heart className="w-7 h-7 text-primary fill-primary/40" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-serif">S33D Hearts</p>
                  <p className="text-3xl md:text-4xl font-serif font-bold text-primary">{totalHearts}</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground font-serif">
                  {props.treeCount} tree{props.treeCount !== 1 ? "s" : ""} × 10 = {baseHearts} base
                </p>
                <p className="text-xs text-muted-foreground font-serif">
                  + {bonusHearts} milestone bonus
                </p>
              </div>
            </div>

            {/* Next milestone progress */}
            {nextMilestone && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-serif text-muted-foreground">
                    Next: <span className="text-foreground">{nextMilestone.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-serif">
                    {getCategoryCount(nextMilestone, props)}/{nextMilestone.threshold} · +{nextMilestone.hearts} 💚
                  </p>
                </div>
                <Progress value={nextProgress} className="h-2 bg-muted/50" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Earned Badges */}
      {earnedMilestones.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-serif flex items-center gap-2">
            <Award className="w-4 h-4" /> Earned Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earnedMilestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
              >
                <Card className="border-primary/30 bg-card/60 backdrop-blur hover:border-primary/50 transition-colors">
                  <CardContent className="flex flex-col items-center py-4 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center border border-primary/25">
                      <m.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-serif font-semibold text-foreground text-center leading-tight">{m.label}</span>
                    <span className="text-[10px] text-primary font-serif">+{m.hearts} 💚</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {nextMilestones.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-serif">Upcoming</h3>
          <div className="space-y-2">
            {nextMilestones.slice(0, 3).map((m) => {
              const current = getCategoryCount(m, props);
              const pct = Math.min(100, (current / m.threshold) * 100);
              return (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/30 backdrop-blur">
                  <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center opacity-50">
                    <m.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-serif text-muted-foreground">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{current}/{m.threshold}</p>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-1 bg-muted/30" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-serif whitespace-nowrap">+{m.hearts} 💚</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardRewards;

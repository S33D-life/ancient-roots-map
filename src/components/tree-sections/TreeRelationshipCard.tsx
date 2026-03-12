/**
 * TreeRelationshipCard — shows the user's relationship journey
 * with a specific Ancient Friend: Explorer → Witness → Steward → Guardian.
 */
import { motion } from "framer-motion";
import { Compass, Eye, Sprout, Shield, ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIER_CONFIG, TIER_ORDER, type RelationshipProgress, type RelationshipTier } from "@/lib/relationship-types";

interface TreeRelationshipCardProps {
  progress: RelationshipProgress;
  treeName: string;
  onCoWitness?: () => void;
  onMakeOffering?: () => void;
}

const tierIcons: Record<RelationshipTier, React.ReactNode> = {
  explorer: <Compass className="w-4 h-4" />,
  witness: <Eye className="w-4 h-4" />,
  steward: <Sprout className="w-4 h-4" />,
  guardian: <Shield className="w-4 h-4" />,
};

export default function TreeRelationshipCard({
  progress,
  treeName,
  onCoWitness,
  onMakeOffering,
}: TreeRelationshipCardProps) {
  const config = TIER_CONFIG[progress.tier];
  const isGuardian = progress.tier === "guardian";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.emoji}</span>
            <h3 className="text-sm font-serif tracking-wide text-foreground">
              Your Relationship
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-serif tracking-wider gap-1 border-border/30 ${config.color}`}
          >
            {tierIcons[progress.tier]}
            {config.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Tier progression rail */}
      <div className="px-4 py-3 border-t border-border/10">
        <div className="flex items-center gap-1">
          {TIER_ORDER.map((tier, i) => {
            const isActive = i <= progress.tierIndex;
            const isCurrent = tier === progress.tier;
            return (
              <div key={tier} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] transition-all duration-500 ${
                    isCurrent
                      ? "bg-primary/20 ring-1 ring-primary/40 text-primary"
                      : isActive
                        ? "bg-primary/10 text-primary/60"
                        : "bg-muted/20 text-muted-foreground/30"
                  }`}
                  title={TIER_CONFIG[tier].label}
                >
                  {TIER_CONFIG[tier].emoji}
                </div>
                {i < TIER_ORDER.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 transition-colors duration-500 ${
                      i < progress.tierIndex ? "bg-primary/30" : "bg-border/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 py-2.5 border-t border-border/10 grid grid-cols-4 gap-2">
        <StatCell label="Visits" value={progress.stats.totalVisits} />
        <StatCell label="Offerings" value={progress.stats.offeringCount} />
        <StatCell label="Care" value={progress.stats.stewardshipActions} />
        <StatCell label="Witnessed" value={progress.stats.coWitnessCount} />
      </div>

      {/* Next tier progress */}
      {!isGuardian && progress.nextProgress != null && (
        <div className="px-4 py-3 border-t border-border/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-serif text-muted-foreground">
              Next: {TIER_CONFIG[TIER_ORDER[progress.tierIndex + 1]].emoji}{" "}
              {TIER_CONFIG[TIER_ORDER[progress.tierIndex + 1]].label}
            </span>
            <span className="text-[10px] font-serif text-primary/60">
              {progress.nextProgress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden bg-muted/20">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${progress.nextProgress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          {/* Requirements */}
          {progress.nextRequirements && progress.nextRequirements.length > 0 && (
            <div className="space-y-1 pt-1">
              {progress.nextRequirements.map((req, i) => (
                <button
                  key={i}
                  className="flex items-center gap-1.5 text-[10px] font-serif text-muted-foreground hover:text-primary/70 transition-colors w-full text-left"
                  onClick={() => {
                    if (req.includes("Co-witness") && onCoWitness) onCoWitness();
                    else if (req.includes("offering") && onMakeOffering) onMakeOffering();
                  }}
                >
                  <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                  {req}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guardian celebration */}
      {isGuardian && (
        <div className="px-4 py-3 border-t border-border/10">
          <p className="text-[10px] font-serif text-primary/60 text-center">
            🛡️ You are a Guardian of {treeName}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-serif text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground font-serif">{label}</p>
    </div>
  );
}

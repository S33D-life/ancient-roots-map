/**
 * SeedTrailPanel — Shows where the user planted seeds today and recently.
 * Each entry links to its tree. Visual style: golden pollen trail.
 */
import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, MapPin, ChevronRight, Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSeedTrail, groupByDay, type SeedTrailEntry } from "@/hooks/use-seed-trail";

interface SeedTrailPanelProps {
  userId: string;
  /** Compact single-entry mode */
  compact?: boolean;
}

const SeedEntry = memo(({ seed, index }: { seed: SeedTrailEntry; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04, duration: 0.3 }}
  >
    <Link
      to={`/tree/${seed.treeId}`}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/[0.04] transition-colors"
    >
      {/* Sprout icon with glow */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: seed.isBloomed
            ? "radial-gradient(circle, hsl(120 60% 55% / 0.2), transparent)"
            : "radial-gradient(circle, hsl(42 80% 60% / 0.15), transparent)",
        }}
      >
        <span className="text-sm">{seed.isBloomed ? "💚" : "🌱"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-serif text-foreground truncate group-hover:text-primary transition-colors">
          {seed.treeName}
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-serif flex items-center gap-1 truncate">
          {seed.treeSpecies && <span>{seed.treeSpecies}</span>}
          {seed.treeSpecies && seed.treeNation && <span>·</span>}
          {seed.treeNation && (
            <>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span>{seed.treeNation}</span>
            </>
          )}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <span className="text-[10px] text-muted-foreground/40 font-mono">
          {new Date(seed.plantedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {seed.isBloomed && !seed.isCollected && (
          <p className="text-[9px] font-serif text-green-500/70">bloomed</p>
        )}
      </div>

      <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary/40 transition-colors flex-shrink-0" />
    </Link>
  </motion.div>
));
SeedEntry.displayName = "SeedEntry";

const SeedTrailPanel = ({ userId, compact = false }: SeedTrailPanelProps) => {
  const [range, setRange] = useState<1 | 7>(1);
  const { data: trail, isLoading } = useSeedTrail(userId, range);

  if (isLoading) {
    return (
      <Card className="border-primary/10 bg-card/40 backdrop-blur">
        <CardContent className="py-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 items-center">
              <div className="w-7 h-7 rounded-full bg-muted/20" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted/15 rounded w-3/5" />
                <div className="h-2 bg-muted/10 rounded w-2/5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!trail || trail.length === 0) {
    if (compact) return null;
    return (
      <Card className="border-primary/10 bg-card/40 backdrop-blur">
        <CardContent className="py-6 text-center">
          <Sprout className="w-6 h-6 text-primary/30 mx-auto mb-2" />
          <p className="text-xs font-serif text-muted-foreground/60">
            No seeds planted {range === 1 ? "today" : "this week"} yet
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/40 mt-1">
            Visit a tree and plant a seed to start your trail
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compact: single featured entry
  if (compact) {
    const latest = trail[0];
    return (
      <Link
        to={`/tree/${latest.treeId}`}
        className="group flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/10 border border-border/20 hover:border-primary/20 hover:bg-primary/5 transition-all"
      >
        <Footprints className="w-4 h-4 text-primary/30 flex-shrink-0 group-hover:text-primary/50 transition-colors" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-serif text-foreground/70 truncate group-hover:text-foreground/90 transition-colors">
            🌱 {latest.treeName}
          </p>
          <p className="text-[9px] font-serif text-muted-foreground/40">
            {latest.treeSpecies} · {latest.relativeTime}
          </p>
        </div>
      </Link>
    );
  }

  const days = groupByDay(trail);
  const todayCount = days[0]?.seeds.length || 0;

  return (
    <Card className="border-primary/15 bg-card/50 backdrop-blur overflow-hidden">
      {/* Ambient golden bar */}
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, transparent, hsl(42 80% 60% / 0.5), hsl(var(--primary) / 0.3), transparent)" }}
      />

      <CardContent className="py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "hsl(42 80% 60% / 0.12)" }}
            >
              <Footprints className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-serif text-foreground tracking-wide">Seed Trail</h3>
              <p className="text-[10px] text-muted-foreground/60 font-serif">
                {trail.length} seed{trail.length !== 1 ? "s" : ""} · {range === 1 ? "today" : "7 days"}
              </p>
            </div>
          </div>

          {/* Range toggle */}
          <div className="flex gap-1">
            <Button
              variant={range === 1 ? "default" : "ghost"}
              size="sm"
              className="h-6 text-[10px] px-2 font-serif"
              onClick={() => setRange(1)}
            >
              Today
            </Button>
            <Button
              variant={range === 7 ? "default" : "ghost"}
              size="sm"
              className="h-6 text-[10px] px-2 font-serif"
              onClick={() => setRange(7)}
            >
              7 Days
            </Button>
          </div>
        </div>

        {/* Progress bar (today only) */}
        {range === 1 && (
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(42 80% 55% / 0.6), hsl(var(--primary) / 0.5))" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todayCount / 33) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Trail entries grouped by day */}
        <AnimatePresence mode="popLayout">
          {days.map((day) => (
            <div key={day.date}>
              {range === 7 && (
                <p className="text-[10px] font-serif text-muted-foreground/40 px-3 pt-2 pb-1">
                  {new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  <span className="text-muted-foreground/25 ml-1">
                    · {day.seeds.length} seed{day.seeds.length !== 1 ? "s" : ""}
                  </span>
                </p>
              )}
              <div className="space-y-0.5">
                {day.seeds.map((seed, i) => (
                  <SeedEntry key={seed.id} seed={seed} index={i} />
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SeedTrailPanel;

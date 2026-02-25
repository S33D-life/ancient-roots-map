/**
 * ChurchyardCanopyCollective — National metrics dashboard for UK churchyard tree mapping.
 * Displays progress toward mapping at least one Ancient Friend in every UK churchyard.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  TreeDeciduous, MapPin, ChevronDown, Church, Crown,
  Users, Calendar, Plus, Leaf, Award, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

/* ─── Estimated total churchyards per region (baseline) ─── */
const ESTIMATED_TOTALS: Record<string, number> = {
  "England": 8000,
  "Wales": 1200,
  "Scotland": 1800,
  "Northern Ireland": 500,
};
const TOTAL_ESTIMATED = Object.values(ESTIMATED_TOTALS).reduce((a, b) => a + b, 0);

/* ─── Milestones ─── */
const MILESTONES = [
  { pct: 10, title: "Rooted Parish", icon: "🌱" },
  { pct: 25, title: "Canopy Quarter", icon: "🌿" },
  { pct: 50, title: "Half the Kingdom", icon: "🌳" },
  { pct: 75, title: "Green Cathedral", icon: "⛪" },
  { pct: 100, title: "The Living Cloister", icon: "✨" },
];

interface RegionData {
  region: string;
  totalChurchyards: number;
  mappedChurchyards: number;
  totalTreesMapped: number;
  oldestEstimate: number | null;
  pct: number;
}

interface ChurchyardRow {
  id: string;
  region: string;
  trees_mapped_count: number;
  oldest_tree_estimate: number | null;
  last_mapped_at: string | null;
}

export default function ChurchyardCanopyCollective() {
  const [churchyards, setChurchyards] = useState<ChurchyardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("uk_churchyards")
      .select("id, region, trees_mapped_count, oldest_tree_estimate, last_mapped_at")
      .then(({ data }) => {
        setChurchyards((data as ChurchyardRow[]) || []);
        setLoading(false);
      });
  }, []);

  /* Compute metrics */
  const metrics = useMemo(() => {
    const mapped = churchyards.filter(c => c.trees_mapped_count > 0).length;
    const totalTreesMapped = churchyards.reduce((s, c) => s + c.trees_mapped_count, 0);
    const oldest = churchyards
      .map(c => c.oldest_tree_estimate)
      .filter((v): v is number => v != null)
      .sort((a, b) => b - a)[0] || null;
    const lastMapped = churchyards
      .map(c => c.last_mapped_at)
      .filter((v): v is string => v != null)
      .sort()
      .reverse()[0] || null;

    const pct = TOTAL_ESTIMATED > 0 ? Math.round((mapped / TOTAL_ESTIMATED) * 100) : 0;

    // Region breakdown
    const regions: RegionData[] = Object.entries(ESTIMATED_TOTALS).map(([region, est]) => {
      const regionRows = churchyards.filter(c => c.region === region);
      const regionMapped = regionRows.filter(c => c.trees_mapped_count > 0).length;
      const regionTrees = regionRows.reduce((s, c) => s + c.trees_mapped_count, 0);
      const regionOldest = regionRows
        .map(c => c.oldest_tree_estimate)
        .filter((v): v is number => v != null)
        .sort((a, b) => b - a)[0] || null;
      return {
        region,
        totalChurchyards: est,
        mappedChurchyards: regionMapped,
        totalTreesMapped: regionTrees,
        oldestEstimate: regionOldest,
        pct: est > 0 ? Math.round((regionMapped / est) * 100) : 0,
      };
    });

    // Most active region
    const mostActive = [...regions].sort((a, b) => b.mappedChurchyards - a.mappedChurchyards)[0];

    // Current milestone
    const currentMilestone = [...MILESTONES].reverse().find(m => pct >= m.pct) || null;
    const nextMilestone = MILESTONES.find(m => pct < m.pct) || null;

    return {
      totalChurchyards: TOTAL_ESTIMATED,
      mappedChurchyards: mapped,
      totalTreesMapped,
      oldest,
      lastMapped,
      pct,
      regions,
      mostActive,
      currentMilestone,
      nextMilestone,
    };
  }, [churchyards]);

  // Time since last mapping
  const timeSinceLastMapped = useMemo(() => {
    if (!metrics.lastMapped) return null;
    const diff = Date.now() - new Date(metrics.lastMapped).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Less than an hour ago";
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }, [metrics.lastMapped]);

  if (loading) return null;

  return (
    <section className="px-4 max-w-3xl mx-auto mb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card className="relative overflow-hidden border-[hsl(120_20%_25%/0.4)] bg-gradient-to-br from-card via-card to-[hsl(120_15%_10%)]">
          {/* Moss-stone accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(120 30% 35%), hsl(42 60% 40%), hsl(120 30% 35%), transparent)",
            }}
          />

          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(120 25% 18%), hsl(120 20% 12%))",
                  border: "2px solid hsl(120 30% 30% / 0.5)",
                  boxShadow: `0 0 ${Math.max(5, metrics.pct * 0.3)}px hsl(120 40% 35% / ${Math.min(0.4, metrics.pct * 0.004)})`,
                }}
              >
                <Church className="w-6 h-6 text-[hsl(120_40%_55%)]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(120_40%_55%/0.7)] font-medium mb-0.5">
                  Community Initiative
                </p>
                <CardTitle className="text-lg font-serif text-foreground">
                  Churchyard Canopy Collective
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Philosophy line */}
            <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
              Restoring the memory between land, faith, and living canopy — one churchyard at a time.
            </p>

            {/* ─── National Progress ─── */}
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-serif font-bold text-foreground">
                    {metrics.pct}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of UK churchyards witnessed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-serif font-bold text-foreground">
                    {metrics.mappedChurchyards.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    of ~{metrics.totalChurchyards.toLocaleString()} churchyards
                  </p>
                </div>
              </div>

              {/* Progress bar with golden glow */}
              <div className="relative">
                <Progress value={metrics.pct} className="h-3 bg-[hsl(120_10%_15%)]" />
                {metrics.pct > 0 && (
                  <div
                    className="absolute top-0 left-0 h-3 rounded-full pointer-events-none"
                    style={{
                      width: `${Math.min(100, metrics.pct)}%`,
                      background: "linear-gradient(90deg, hsl(120 40% 30%), hsl(42 70% 45%))",
                      boxShadow: "0 0 12px hsl(42 80% 50% / 0.3)",
                    }}
                  />
                )}
              </div>

              {/* Milestone indicator */}
              <div className="flex items-center justify-between text-[10px]">
                {metrics.currentMilestone && (
                  <span className="text-[hsl(42_80%_55%)] font-serif">
                    {metrics.currentMilestone.icon} {metrics.currentMilestone.title}
                  </span>
                )}
                {metrics.nextMilestone && (
                  <span className="text-muted-foreground/50 font-serif">
                    Next: {metrics.nextMilestone.title} ({metrics.nextMilestone.pct}%)
                  </span>
                )}
              </div>
            </div>

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard
                label="Trees Mapped"
                value={metrics.totalTreesMapped.toLocaleString()}
                icon={TreeDeciduous}
              />
              <StatCard
                label="Oldest Estimate"
                value={metrics.oldest ? `${metrics.oldest} yrs` : "—"}
                icon={Crown}
              />
              <StatCard
                label="Most Active"
                value={metrics.mostActive?.region || "—"}
                icon={BarChart3}
              />
              <StatCard
                label="Last Mapped"
                value={timeSinceLastMapped || "Awaiting first witness"}
                icon={Calendar}
                small
              />
            </div>

            {/* ─── Regional Breakdown ─── */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">
                Regional Progress
              </h4>
              {metrics.regions.map((r) => (
                <Collapsible
                  key={r.region}
                  open={expandedRegion === r.region}
                  onOpenChange={(open) => setExpandedRegion(open ? r.region : null)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-serif text-foreground">{r.region}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/20">
                            {r.pct}%
                          </Badge>
                        </div>
                        <div className="w-full h-1.5 bg-[hsl(120_10%_15%)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(r.pct, r.mappedChurchyards > 0 ? 1 : 0)}%`,
                              background: "linear-gradient(90deg, hsl(120 35% 30%), hsl(42 60% 40%))",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          {r.mappedChurchyards}/{r.totalChurchyards.toLocaleString()}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform ${
                          expandedRegion === r.region ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 space-y-1 text-xs text-muted-foreground border-x border-b border-border/20 rounded-b-lg bg-card/20">
                      <p>
                        <TreeDeciduous className="w-3 h-3 inline mr-1" />
                        {r.totalTreesMapped} tree{r.totalTreesMapped !== 1 ? "s" : ""} mapped in churchyards
                      </p>
                      {r.oldestEstimate && (
                        <p>
                          <Crown className="w-3 h-3 inline mr-1" />
                          Oldest estimate: ~{r.oldestEstimate} years
                        </p>
                      )}
                      {r.mappedChurchyards === 0 && (
                        <p className="italic text-muted-foreground/50 font-serif">
                          No churchyards witnessed yet in {r.region}. Be the first steward.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* ─── CTA ─── */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="font-serif text-xs gap-1.5 border-[hsl(120_30%_30%/0.4)] hover:border-[hsl(120_30%_30%/0.7)] hover:bg-[hsl(120_20%_15%/0.3)] text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/map?research=on&lat=52.5&lng=-1.5&zoom=7">
                  <MapPin className="h-3.5 w-3.5" />
                  View Churchyard Map
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-serif text-xs gap-1.5 border-[hsl(120_30%_30%/0.4)] hover:border-[hsl(120_30%_30%/0.7)] hover:bg-[hsl(120_20%_15%/0.3)] text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/map">
                  <Plus className="h-3.5 w-3.5" />
                  Map a Churchyard Tree
                </Link>
              </Button>
            </div>

            {/* Milestone badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {MILESTONES.map((m) => (
                <Badge
                  key={m.pct}
                  variant="outline"
                  className={`text-[9px] font-serif gap-1 ${
                    metrics.pct >= m.pct
                      ? "border-[hsl(42_70%_45%/0.5)] text-[hsl(42_80%_55%)]"
                      : "border-border/20 text-muted-foreground/30"
                  }`}
                >
                  <span>{m.icon}</span> {m.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

/* ─── Stat Card helper ─── */
function StatCard({ label, value, icon: Icon, small }: {
  label: string; value: string; icon: React.ElementType; small?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-[hsl(120_10%_12%/0.5)] border border-border/20 text-center">
      <Icon className="w-3.5 h-3.5 text-[hsl(120_35%_45%)] mx-auto mb-1" />
      <p className={`font-serif font-bold text-foreground ${small ? "text-xs" : "text-sm"}`}>
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

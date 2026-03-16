/**
 * Atlas Discovery Panel
 *
 * Highlights active, growing, and notable regions in the atlas.
 */

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreeDeciduous, TrendingUp, Sparkles, Network } from "lucide-react";
import type { DatasetConfig } from "@/config/datasetIntegration";

interface RegionStat {
  country: string;
  slug: string;
  flag: string;
  treeCount: number;
  groveCount: number;
  status: "active" | "growing" | "proposed";
  pulseLevel?: string;
  datasets: DatasetConfig[];
}

interface Props {
  stats: RegionStat[];
}

export default function AtlasDiscoveryPanel({ stats }: Props) {
  const active = stats.filter(s => s.status === "active").sort((a, b) => b.treeCount - a.treeCount);
  const growing = stats.filter(s => s.status === "growing");
  const withGroves = stats.filter(s => s.groveCount > 0).sort((a, b) => b.groveCount - a.groveCount);
  const pulsing = stats.filter(s => s.pulseLevel && s.pulseLevel !== "quiet");

  const sections = [
    { title: "Largest Forests", icon: TreeDeciduous, items: active.slice(0, 4), badge: (s: RegionStat) => `${s.treeCount} trees` },
    { title: "Active Groves", icon: Network, items: withGroves.slice(0, 3), badge: (s: RegionStat) => `${s.groveCount} groves` },
    { title: "Growing Regions", icon: TrendingUp, items: growing.slice(0, 3), badge: () => "Growing" },
    { title: "Pulse Active", icon: Sparkles, items: pulsing.slice(0, 3), badge: (s: RegionStat) => s.pulseLevel || "" },
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {sections.map(section => (
        <Card key={section.title} className="border-primary/8 bg-card/40">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <section.icon className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </span>
            </div>
            {section.items.map(item => (
              <Link
                key={item.slug}
                to={item.status !== "proposed" ? `/atlas/${item.slug}` : "#"}
                className="flex items-center gap-2 py-1 hover:bg-primary/5 rounded px-1 -mx-1 transition-colors"
              >
                <span className="text-sm">{item.flag}</span>
                <span className="text-xs font-serif text-foreground flex-1 truncate">{item.country}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 text-muted-foreground border-border/30">
                  {section.badge(item)}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

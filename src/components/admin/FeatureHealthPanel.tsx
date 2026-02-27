import { useAdminFeatureHealth } from "@/hooks/use-admin-analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FeatureStat {
  name: string;
  last7d: number;
  last30d: number;
}

function healthScore(w: number, m: number): number {
  if (m === 0) return 0;
  // Momentum: ratio of weekly to monthly (higher = more recent activity)
  const momentum = m > 0 ? (w / m) * 100 : 0;
  // Scale: raw volume contributes
  const volumeScore = Math.min(m, 100);
  return Math.round((momentum * 0.6 + volumeScore * 0.4));
}

function healthLabel(score: number): { text: string; color: string; icon: typeof TrendingUp } {
  if (score >= 60) return { text: "High Momentum", color: "text-green-500", icon: TrendingUp };
  if (score >= 25) return { text: "Steady", color: "text-yellow-500", icon: Minus };
  if (score > 0) return { text: "Needs Attention", color: "text-orange-500", icon: TrendingDown };
  return { text: "Dormant", color: "text-muted-foreground", icon: Minus };
}

export default function FeatureHealthPanel() {
  const { data, isLoading } = useAdminFeatureHealth();

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const features: FeatureStat[] = [
    { name: "Offerings", last7d: data.offerings_7d, last30d: data.offerings_30d },
    { name: "Check-ins", last7d: data.checkins_7d, last30d: data.checkins_30d },
    { name: "Whispers", last7d: data.whispers_7d, last30d: data.whispers_30d },
    { name: "Seed Planting", last7d: data.seeds_planted_7d, last30d: data.seeds_planted_30d },
    { name: "Seed Collection", last7d: data.seeds_collected_7d, last30d: data.seeds_collected_30d },
    { name: "Meetings", last7d: data.meetings_7d, last30d: data.meetings_30d },
    { name: "Referrals", last7d: data.referrals_7d, last30d: data.referrals_30d },
    { name: "Bookshelf", last7d: data.bookshelf_7d, last30d: data.bookshelf_30d },
    { name: "Market Stakes", last7d: data.market_stakes_7d, last30d: data.market_stakes_30d },
    { name: "Bug Reports", last7d: data.bug_reports_7d, last30d: data.bug_reports_30d },
    { name: "Birdsong", last7d: data.birdsong_7d, last30d: data.birdsong_30d },
    { name: "Time Tree", last7d: data.time_tree_7d, last30d: data.time_tree_30d },
  ].sort((a, b) => healthScore(b.last7d, b.last30d) - healthScore(a.last7d, a.last30d));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-serif">
        Ranked by momentum (weekly-to-monthly ratio × volume). Higher = more active recently.
      </p>
      {features.map((f) => {
        const score = healthScore(f.last7d, f.last30d);
        const h = healthLabel(score);
        const Icon = h.icon;
        return (
          <Card key={f.name} className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm text-foreground">{f.name}</h3>
                  <span className={`text-[10px] font-serif flex items-center gap-1 ${h.color}`}>
                    <Icon className="w-3 h-3" />
                    {h.text}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">{score}/100</span>
              </div>
              <Progress value={Math.min(score, 100)} className="h-1.5 mb-2" />
              <div className="flex gap-6 text-[11px] text-muted-foreground font-serif">
                <span>7d: <strong className="text-foreground">{f.last7d}</strong></span>
                <span>30d: <strong className="text-foreground">{f.last30d}</strong></span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

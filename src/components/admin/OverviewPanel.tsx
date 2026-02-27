import { useAdminOverview } from "@/hooks/use-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, TreePine, Gift, Heart, MapPin, Sprout } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, sub }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; sub?: string }) => (
  <Card className="bg-card/60 backdrop-blur border-border/40">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-serif">{label}</p>
          <p className="text-2xl font-serif font-bold text-foreground tabular-nums mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground/70 font-serif mt-0.5">{sub}</p>}
        </div>
        <Icon className="w-5 h-5 text-primary/60" />
      </div>
    </CardContent>
  </Card>
);

export default function OverviewPanel() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const metrics = [
    { label: "Wanderers", value: data.total_wanderers, icon: Users, sub: `+${data.new_wanderers_7d} this week · +${data.new_wanderers_30d} this month` },
    { label: "Ancient Friends", value: data.total_trees, icon: TreePine, sub: `+${data.new_trees_7d} this week · +${data.new_trees_30d} this month` },
    { label: "Species Mapped", value: data.total_species, icon: Sprout },
    { label: "Nations Reached", value: data.total_nations, icon: MapPin },
    { label: "Offerings", value: data.total_offerings, icon: Gift, sub: `Avg ${data.avg_offerings_per_tree} per tree` },
    { label: "Hearts Minted", value: data.total_hearts_minted, icon: Heart, sub: `+${data.hearts_minted_7d} this week` },
    { label: "Check-ins", value: data.total_checkins, icon: MapPin },
    { label: "Referrals", value: data.total_referrals, icon: Users },
    { label: "Active (7d)", value: data.active_wanderers_7d, icon: Users, sub: `${data.active_wanderers_30d} in 30d` },
    { label: "Zero-Offering Trees", value: data.trees_zero_offerings, icon: TreePine, sub: "Need attention" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <StatCard key={m.label} {...m} />
      ))}
    </div>
  );
}

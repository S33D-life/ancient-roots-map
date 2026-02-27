import { useMemo, useState } from "react";
import { useAdminDailySignups, useAdminDailyTrees } from "@/hooks/use-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";

export default function GrowthPanel() {
  const [daysBack, setDaysBack] = useState(30);
  const { data: signups, isLoading: l1 } = useAdminDailySignups(daysBack);
  const { data: treesData, isLoading: l2 } = useAdminDailyTrees(daysBack);

  const merged = useMemo(() => {
    if (!signups || !treesData) return [];
    const treeMap: Record<string, number> = {};
    treesData.forEach((d) => { treeMap[d.day] = Number(d.trees_mapped); });
    return signups.map((d) => ({
      day: d.day,
      label: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
      signups: Number(d.signups),
      trees: treeMap[d.day] || 0,
    }));
  }, [signups, treesData]);

  const totalSignups = merged.reduce((s, d) => s + d.signups, 0);
  const totalTrees = merged.reduce((s, d) => s + d.trees, 0);

  if (l1 || l2) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            variant={daysBack === d ? "default" : "outline"}
            size="sm"
            className="font-serif text-xs"
            onClick={() => setDaysBack(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2">
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-serif">New Wanderers ({daysBack}d)</p>
            <p className="text-3xl font-serif font-bold text-foreground tabular-nums">{totalSignups}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-serif">Trees Mapped ({daysBack}d)</p>
            <p className="text-3xl font-serif font-bold text-foreground tabular-nums">{totalTrees}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Growth Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            signups: { label: "Wanderers", color: "hsl(var(--primary))" },
            trees: { label: "Trees", color: "hsl(var(--accent))" },
          }} className="h-[280px] w-full">
            <AreaChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={Math.max(Math.floor(merged.length / 8), 0)}
              />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="trees" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

import { useAdminSpeciesCoverage, useAdminGeoCoverage } from "@/hooks/use-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function CoveragePanel() {
  const { data: species, isLoading: l1 } = useAdminSpeciesCoverage();
  const { data: geo, isLoading: l2 } = useAdminGeoCoverage();

  if (l1 || l2) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const topSpecies = (species || []).slice(0, 15);
  const topGeo = (geo || []).slice(0, 15);

  // Species with zero engagement
  const dormantSpecies = (species || []).filter((s) => s.offering_count === 0 && s.checkin_count === 0);

  return (
    <div className="space-y-6">
      {/* Geographic coverage */}
      <Card className="bg-card/60 backdrop-blur border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Geographic Coverage — Top Nations</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            tree_count: { label: "Trees", color: "hsl(var(--primary))" },
            offering_count: { label: "Offerings", color: "hsl(var(--accent))" },
          }} className="h-[300px] w-full">
            <BarChart data={topGeo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="nation" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="tree_count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="offering_count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Species coverage */}
      <Card className="bg-card/60 backdrop-blur border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Species Coverage — Top 15</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-serif">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left py-2 pr-4">Species</th>
                  <th className="text-right py-2 px-2">Trees</th>
                  <th className="text-right py-2 px-2">Offerings</th>
                  <th className="text-right py-2 px-2">Check-ins</th>
                  <th className="text-right py-2 px-2">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {topSpecies.map((s) => (
                  <tr key={s.species} className="border-b border-border/10">
                    <td className="py-2 pr-4 text-foreground">{s.species}</td>
                    <td className="text-right py-2 px-2 tabular-nums">{s.tree_count}</td>
                    <td className="text-right py-2 px-2 tabular-nums">{s.offering_count}</td>
                    <td className="text-right py-2 px-2 tabular-nums">{s.checkin_count}</td>
                    <td className="text-right py-2 px-2 tabular-nums">{s.unique_visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dormant species alert */}
      {dormantSpecies.length > 0 && (
        <Card className="bg-card/60 backdrop-blur border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif text-destructive">
            🌱 Dormant Species ({dormantSpecies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground font-serif mb-3">
            These species have trees mapped but zero offerings or check-ins.
          </p>
          <div className="flex flex-wrap gap-2">
            {dormantSpecies.slice(0, 20).map((s) => (
              <span key={s.species} className="text-[10px] font-serif bg-destructive/10 text-destructive rounded-full px-2 py-0.5 border border-destructive/20">
                {s.species} ({s.tree_count})
              </span>
            ))}
            {dormantSpecies.length > 20 && (
              <span className="text-[10px] font-serif text-muted-foreground">+{dormantSpecies.length - 20} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

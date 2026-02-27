import { useAdminEconomyHealth } from "@/hooks/use-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, Shield, Coins } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(42, 80%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(30, 80%, 50%)",
];

export default function EconomyPanel() {
  const { data, isLoading } = useAdminEconomyHealth();

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const heartsByType = (data.hearts_by_type || []).map((h, i) => ({
    ...h,
    fill: COLORS[i % COLORS.length],
  }));

  const dailyHearts = (data.daily_hearts_7d || []).map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString("en", { weekday: "short" }),
  }));

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Hearts", value: data.total_hearts, icon: Heart },
          { label: "Species Hearts", value: data.total_species_hearts, icon: Coins },
          { label: "Influence Tokens", value: data.total_influence, icon: Shield },
          { label: "Avg Hearts/User", value: data.avg_hearts_per_user, icon: Heart },
        ].map((m) => (
          <Card key={m.label} className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-serif">{m.label}</p>
                  <p className="text-2xl font-serif font-bold text-foreground tabular-nums mt-1">
                    {Number(m.value).toLocaleString()}
                  </p>
                </div>
                <m.icon className="w-5 h-5 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hearts by type pie */}
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif">Hearts by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={heartsByType}
                  dataKey="total"
                  nameKey="heart_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ heart_type, total }) => `${heart_type}: ${Number(total).toLocaleString()}`}
                  labelLine={false}
                >
                  {heartsByType.map((entry, i) => (
                    <Cell key={entry.heart_type} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Daily hearts bar */}
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif">Hearts Minted (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ hearts: { label: "Hearts", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <BarChart data={dailyHearts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hearts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top holders */}
      <Card className="bg-card/60 backdrop-blur border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Top Heart Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(data.top_heart_holders || []).map((h, i) => (
              <div key={h.user_id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}.</span>
                  <span className="text-sm font-serif text-foreground">{h.name}</span>
                </div>
                <span className="text-sm font-serif font-bold text-primary tabular-nums">
                  {Number(h.s33d_hearts).toLocaleString()} 💛
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

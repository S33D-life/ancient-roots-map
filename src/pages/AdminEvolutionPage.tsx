import { useHasRole } from "@/hooks/use-role";
import Header from "@/components/Header";
import { Shield, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Heart, TreePine, Globe, Activity } from "lucide-react";
import OverviewPanel from "@/components/admin/OverviewPanel";
import FeatureHealthPanel from "@/components/admin/FeatureHealthPanel";
import EconomyPanel from "@/components/admin/EconomyPanel";
import CoveragePanel from "@/components/admin/CoveragePanel";
import GrowthPanel from "@/components/admin/GrowthPanel";

export default function AdminEvolutionPage() {
  const { hasRole, loading } = useHasRole("curator");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Evolution Access Required</h1>
          <p className="text-muted-foreground font-serif">This dashboard is reserved for Heartwood Curators.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "growth", label: "Growth", icon: Activity },
    { value: "features", label: "Features", icon: TreePine },
    { value: "economy", label: "Economy", icon: Heart },
    { value: "coverage", label: "Coverage", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-serif text-primary tracking-wide">Evolution Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground font-serif mb-6">
          Where should we evolve next? All metrics derived from live data.
        </p>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start bg-card/50 backdrop-blur border border-border/50 rounded-xl p-1 overflow-x-auto flex-nowrap">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 font-serif text-xs tracking-wider whitespace-nowrap data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg px-4 py-2"
              >
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewPanel /></TabsContent>
          <TabsContent value="growth"><GrowthPanel /></TabsContent>
          <TabsContent value="features"><FeatureHealthPanel /></TabsContent>
          <TabsContent value="economy"><EconomyPanel /></TabsContent>
          <TabsContent value="coverage"><CoveragePanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

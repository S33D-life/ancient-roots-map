import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketCard from "@/components/MarketCard";
import CreateMarketWizard from "@/components/CreateMarketWizard";
import { useMarkets } from "@/hooks/use-markets";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Flame, TreePine, Leaf, Globe, TrendingUp, Settings2, Sprout, Gift } from "lucide-react";
import GiftSeedSender from "@/components/GiftSeedSender";
import { useMarketSeeds } from "@/hooks/use-market-seeds";
import { supabase } from "@/integrations/supabase/client";

const SEASONAL_PULSE = [
  { month: "February", highlight: "Snowdrops blooming · Hazel catkins releasing · Blackbirds singing at dusk" },
  { month: "March", highlight: "Ash & Oak budburst race · First blackthorn blossom · Frogs spawning" },
  { month: "April", highlight: "Bluebells carpeting woodland floors · Swallows returning · Cherry peak" },
];

const currentMonth = new Date().toLocaleString("default", { month: "long" });
const pulse = SEASONAL_PULSE.find(p => p.month === currentMonth) || SEASONAL_PULSE[0];

const CycleMarketsPage = () => {
  const [tab, setTab] = useState("featured");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { marketSeedsRemaining, giftSeedsRemaining } = useMarketSeeds(userId);

  const { markets: openMarkets, loading: loadingOpen, refetch } = useMarkets({ status: "open" });
  const { markets: resolvedMarkets, loading: loadingResolved } = useMarkets({ status: "resolved" });

  const allMarkets = tab === "resolved" ? resolvedMarkets : openMarkets;
  const loading = tab === "resolved" ? loadingResolved : loadingOpen;

  const filtered = allMarkets.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.filter(m => m.is_demo || m.totalStaked > 0).slice(0, 6);
  const bySpecies = filtered.filter(m => m.scope === "species");
  const byGrove = filtered.filter(m => m.scope === "grove" || m.scope === "tree");
  const byRegion = filtered.filter(m => m.scope === "region");
  const byProtocol = filtered.filter(m => m.market_type === "protocol_parameter");

  const displayMarkets =
    tab === "featured" ? featured :
    tab === "species" ? bySpecies :
    tab === "grove" ? byGrove :
    tab === "region" ? byRegion :
    tab === "protocol" ? byProtocol :
    tab === "resolved" ? filtered :
    filtered;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seasonal Pulse Banner */}
      <div
        className="border-b border-border/30"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.05))" }}
      >
        <div className="container mx-auto px-4 py-5 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌀</span>
                <h1 className="text-2xl font-serif text-primary tracking-wide">Cycle Markets</h1>
                <span className="text-xs font-serif text-muted-foreground border border-border/40 px-2 py-0.5 rounded-full">Phase 1</span>
              </div>
              <p className="text-xs font-serif text-muted-foreground max-w-md">
                Predict natural-cycle outcomes. Stake seeds. Fund local grove projects.
              </p>
              {userId && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] font-serif text-muted-foreground flex items-center gap-1">
                    <Sprout className="w-3 h-3 text-primary" /> {marketSeedsRemaining} market seeds
                  </span>
                  <span className="text-[11px] font-serif text-muted-foreground flex items-center gap-1">
                    <Gift className="w-3 h-3 text-primary" /> {giftSeedsRemaining} gift seeds
                  </span>
                </div>
              )}
            </div>
            <div className="md:text-right">
              <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider mb-0.5">Seasonal Pulse · {currentMonth}</p>
              <p className="text-xs font-serif text-foreground/70 max-w-xs">{pulse.highlight}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search markets…"
              className="pl-9 font-serif text-sm h-9"
            />
          </div>
          <GiftSeedSender />
          <Button
            onClick={() => setCreateOpen(true)}
            className="font-serif text-xs gap-1.5 h-9 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Market
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/30 border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1.5">
            <TabsTrigger value="featured" className="font-serif text-xs gap-1.5">
              <Flame className="w-3 h-3" /> Featured
            </TabsTrigger>
            <TabsTrigger value="species" className="font-serif text-xs gap-1.5">
              <Leaf className="w-3 h-3" /> By Species
            </TabsTrigger>
            <TabsTrigger value="grove" className="font-serif text-xs gap-1.5">
              <TreePine className="w-3 h-3" /> By Grove
            </TabsTrigger>
            <TabsTrigger value="region" className="font-serif text-xs gap-1.5">
              <Globe className="w-3 h-3" /> Regional
            </TabsTrigger>
            <TabsTrigger value="protocol" className="font-serif text-xs gap-1.5">
              <Settings2 className="w-3 h-3" /> Protocol
            </TabsTrigger>
            <TabsTrigger value="resolved" className="font-serif text-xs gap-1.5">
              <TrendingUp className="w-3 h-3" /> Resolved
            </TabsTrigger>
          </TabsList>

          {["featured", "species", "grove", "region", "protocol", "resolved"].map(t => (
            <TabsContent key={t} value={t}>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : displayMarkets.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-4">🌱</p>
                  <p className="font-serif text-muted-foreground mb-4">
                    {search ? "No markets match your search." : "No markets in this category yet."}
                  </p>
                  <Button
                    variant="outline"
                    className="font-serif text-xs gap-1.5"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Create the first one
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayMarkets.map((m, i) => (
                    <MarketCard key={m.id} market={m} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[11px] text-muted-foreground font-serif mt-12 max-w-md mx-auto"
        >
          🌿 Stake seeds to predict nature's cycles — seeds sprout into hearts when markets resolve.
          Winners share the seed pool. A portion routes to local grove funds and research.
        </motion.p>
      </div>

      <Footer />

      <CreateMarketWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refetch}
      />
    </div>
  );
};

export default CycleMarketsPage;

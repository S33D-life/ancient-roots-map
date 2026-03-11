/**
 * CycleMarketRoom — Embedded Cycle Market view for the Heartwood Rhythms room.
 * Participatory forecasting rooted in ecological cycles.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MarketCard from "@/components/MarketCard";
import CreateMarketWizard from "@/components/CreateMarketWizard";
import GiftSeedSender from "@/components/GiftSeedSender";
import { useMarkets } from "@/hooks/use-markets";
import { useMarketSeeds } from "@/hooks/use-market-seeds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Flame, TreePine, Leaf, Globe, TrendingUp, Settings2, Sprout, Gift, Info } from "lucide-react";

const CycleMarketRoom = () => {
  const [tab, setTab] = useState("featured");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
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
    <div className="space-y-6">
      {/* What is the Cycle Market */}
      <div className="rounded-xl bg-card/40 border border-border/20 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-serif text-sm text-foreground/80">What is the Cycle Market?</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Participatory forecasting rooted in ecological cycles. Predict seasonal events, bloom windows, 
              first frosts, and migration arrivals. Stake S33D Hearts on observed outcomes — not speculation, 
              but shared attention to nature's rhythms.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-[9px] text-muted-foreground/60 font-serif">
              <span>🌿 <strong className="text-foreground/60">Hearts</strong> — earned through correct ecological observations</span>
              <span>⚖️ <strong className="text-foreground/60">Influence</strong> — earned through participation streaks</span>
              <span>🎯 <strong className="text-foreground/60">Measurable</strong> — bloom dates, frost timing, phenology data</span>
              <span>🌀 <strong className="text-foreground/60">Symbolic</strong> — lunar reflections, seasonal alignment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seeds balance */}
      {userId && (
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-serif text-muted-foreground flex items-center gap-1">
            <Sprout className="w-3 h-3 text-primary" /> {marketSeedsRemaining} market seeds
          </span>
          <span className="text-[11px] font-serif text-muted-foreground flex items-center gap-1">
            <Gift className="w-3 h-3 text-primary" /> {giftSeedsRemaining} gift seeds
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cycles…"
            className="pl-9 font-serif text-sm h-9"
          />
        </div>
        <GiftSeedSender />
        <Button onClick={() => setCreateOpen(true)} className="font-serif text-xs gap-1.5 h-9 shrink-0">
          <Plus className="w-3.5 h-3.5" /> New Cycle
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/30 border border-border/50 mb-4 flex-wrap h-auto gap-1 p-1.5">
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
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : displayMarkets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🌱</p>
                <p className="font-serif text-muted-foreground text-sm mb-3">
                  {search ? "No cycles match your search." : "No cycles in this category yet."}
                </p>
                <Button variant="outline" className="font-serif text-xs gap-1.5" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Create the first one
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMarkets.map((m, i) => (
                  <MarketCard key={m.id} market={m} index={i} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[10px] text-muted-foreground/60 font-serif max-w-md mx-auto"
      >
        🌿 This is participatory ecological forecasting — not gambling. Stakes use in-app S33D Hearts only.
        Winners share the seed pool. A portion routes to local grove funds and research.
      </motion.p>

      <CreateMarketWizard open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
};

export default CycleMarketRoom;

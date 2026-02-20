import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useMarket, outcomePercent, timeLeft } from "@/hooks/use-markets";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, Loader2, Heart, Clock, TreePine, Leaf,
  Globe, Info, ChevronDown, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MarketOutcome } from "@/hooks/use-markets";

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  tree: <TreePine className="w-4 h-4" />,
  grove: <Leaf className="w-4 h-4" />,
  species: <span className="text-base">🌿</span>,
  region: <Globe className="w-4 h-4" />,
};

const MarketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { market, loading, refetch } = useMarket(id);

  const [selectedOutcome, setSelectedOutcome] = useState<MarketOutcome | null>(null);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [staking, setStaking] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground font-serif">Market not found.</p>
          <Link to="/markets" className="text-primary hover:underline font-serif mt-4 inline-block">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = market.status === "open" && new Date(market.close_time) > new Date();
  const tLeft = timeLeft(market.close_time);

  // Implied probability shift preview
  const previewProb = selectedOutcome && market.totalStaked >= 0
    ? Math.round(((market.stakes.filter(s => s.outcome_id === selectedOutcome.id)
        .reduce((s, st) => s + st.amount, 0) + stakeAmount) /
        (market.totalStaked + stakeAmount)) * 100)
    : null;

  const handleStake = async () => {
    if (!selectedOutcome || stakeAmount <= 0) return;
    setStaking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to place a stake.");

      const { error } = await supabase.from("market_stakes").insert({
        market_id: market.id,
        outcome_id: selectedOutcome.id,
        user_id: user.id,
        amount: stakeAmount,
      });
      if (error) throw error;

      setStakeSuccess(true);
      setTimeout(() => setStakeSuccess(false), 3000);
      toast({
        title: "Stake placed! 🌱",
        description: `${stakeAmount} S33D Hearts on "${selectedOutcome.label}"`,
      });
      refetch();
      setSelectedOutcome(null);
      setStakeAmount(10);
    } catch (e: unknown) {
      toast({ title: "Stake failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/markets")}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary font-serif text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cycle Markets
        </button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/40 bg-card/70 backdrop-blur overflow-hidden mb-6"
        >
          <div className="h-1" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)" }} />
          <div className="p-6 md:p-8">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="font-serif text-xs gap-1 border-border/60">
                {SCOPE_ICONS[market.scope]} {market.scope}
              </Badge>
              <Badge variant="outline" className="font-serif text-xs border-border/60">
                {market.market_type === "binary" ? "Yes/No" : market.market_type === "date_range" ? "Date Range" : "Over/Under"}
              </Badge>
              {market.linked_hive_id && (
                <Link to={`/hive/${market.linked_hive_id}`}>
                  <Badge variant="secondary" className="font-serif text-xs hover:bg-primary/20 transition-colors">
                    🌿 {market.linked_hive_id} Hive
                  </Badge>
                </Link>
              )}
              <Badge
                variant="outline"
                className={`font-serif text-xs ml-auto ${isOpen ? "border-emerald-500/50 text-emerald-400" : "border-border/40 text-muted-foreground"}`}
              >
                {isOpen ? `⏳ ${tLeft}` : market.status}
              </Badge>
            </div>

            <h1 className="text-xl md:text-2xl font-serif text-foreground mb-3 leading-snug">
              {market.title}
            </h1>

            {market.description && (
              <p className="text-sm text-muted-foreground font-serif leading-relaxed border-l-2 border-primary/20 pl-3">
                {market.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/20">
              <div className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground">
                <Heart className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-medium">{market.totalStaked}</span> hearts staked
              </div>
              <div className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Closes {new Date(market.close_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground ml-auto">
                <span className="text-primary">{market.winner_pool_percent}%</span> winners ·
                <span className="text-accent">{market.grove_fund_percent}%</span> grove ·
                <span className="text-muted-foreground">{market.research_pot_percent}%</span> research
              </div>
            </div>
          </div>
        </motion.div>

        {/* Outcomes + Stake */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Outcomes probability */}
          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-5">
              <h3 className="font-serif text-sm text-foreground mb-4">Current Probability</h3>
              <div className="space-y-3">
                {market.outcomes.map((outcome) => {
                  const pct = outcomePercent(market.stakes, outcome.id, market.totalStaked);
                  const isSelected = selectedOutcome?.id === outcome.id;
                  const isWinner = outcome.is_winning === true;
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => isOpen ? setSelectedOutcome(isSelected ? null : outcome) : undefined}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        isWinner ? "border-primary/60 bg-primary/10" :
                        isSelected ? "border-primary/50 bg-primary/5" :
                        "border-border/40 hover:border-border/80"
                      } ${!isOpen ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif text-sm text-foreground flex items-center gap-1.5">
                          {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                          {outcome.label}
                        </span>
                        <span className="font-serif text-sm tabular-nums text-primary font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <div className="text-[10px] font-serif text-muted-foreground mt-1">
                        {market.stakes.filter(s => s.outcome_id === outcome.id).reduce((s, st) => s + st.amount, 0)} hearts
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stake module */}
          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-5">
              <h3 className="font-serif text-sm text-foreground mb-1">Place Stake</h3>
              <p className="text-[11px] text-muted-foreground font-serif mb-4">
                In-app S33D Hearts only. Not real money.
              </p>

              {!isOpen ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif p-3 rounded-lg bg-secondary/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  This market is {market.status === "resolved" ? "resolved" : "closed"} — no new stakes.
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {stakeSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 gap-2 text-primary"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                      <p className="font-serif text-sm">Stake placed!</p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" className="space-y-4">
                      <div>
                        <p className="text-xs font-serif text-muted-foreground mb-2">
                          {selectedOutcome ? `Staking on: "${selectedOutcome.label}"` : "← Select an outcome"}
                        </p>
                        {!selectedOutcome && (
                          <p className="text-[11px] text-muted-foreground font-serif italic">Click an outcome on the left to select it.</p>
                        )}
                      </div>

                      {selectedOutcome && (
                        <>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-serif text-muted-foreground">Stake amount</span>
                              <span className="text-sm font-serif text-primary font-medium flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5" /> {stakeAmount}
                              </span>
                            </div>
                            <Slider
                              min={1} max={market.max_stake_per_user} step={1}
                              value={[stakeAmount]}
                              onValueChange={([v]) => setStakeAmount(v)}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-serif">
                              <span>1</span>
                              <span>max {market.max_stake_per_user}</span>
                            </div>
                          </div>

                          {previewProb !== null && (
                            <div className="bg-secondary/30 rounded-lg p-3 text-xs font-serif text-muted-foreground">
                              After your stake: <span className="text-primary font-medium">{previewProb}%</span> probability for "{selectedOutcome.label}"
                            </div>
                          )}

                          <Button
                            className="w-full font-serif text-sm gap-2"
                            onClick={handleStake}
                            disabled={staking}
                          >
                            {staking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                            Stake {stakeAmount} Hearts on "{selectedOutcome.label}"
                          </Button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evidence & Resolution accordion */}
        <Card className="bg-card/60 backdrop-blur border-border/40 mb-6">
          <CardContent className="p-0">
            <button
              onClick={() => setEvidenceOpen(v => !v)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="font-serif text-sm text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Evidence &amp; Resolution
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${evidenceOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {evidenceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 border-t border-border/20 pt-4">
                    {market.resolution_source && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif mb-1">Resolution Source</p>
                        <p className="text-sm font-serif text-foreground">{market.resolution_source}</p>
                      </div>
                    )}
                    {market.evidence_policy && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif mb-1">Evidence Policy</p>
                        <p className="text-sm font-serif text-foreground">{market.evidence_policy}</p>
                      </div>
                    )}
                    {market.rules_text && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif mb-1">Rules</p>
                        <p className="text-sm font-serif text-foreground">{market.rules_text}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/20">
                      <p className="text-[11px] font-serif text-muted-foreground">
                        Resolver: Council of Life Curators · Multi-curator vote for contentious markets.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Linked trees */}
        {market.linked_tree_ids?.length > 0 && (
          <Card className="bg-card/60 backdrop-blur border-border/40 mb-6">
            <CardContent className="p-5">
              <h3 className="font-serif text-sm text-foreground mb-3 flex items-center gap-2">
                <TreePine className="w-4 h-4 text-primary" /> Linked Ancient Friends
              </h3>
              <div className="flex flex-wrap gap-2">
                {market.linked_tree_ids.map(tId => (
                  <Link key={tId} to={`/tree/${tId}`}>
                    <Badge variant="outline" className="font-serif text-xs hover:bg-primary/10 transition-colors cursor-pointer">
                      🌳 View Tree
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground font-serif mt-4">
          🌿 In-app S33D Hearts only — not real money. Nature cycles &amp; local ecology markets only.
        </p>
      </div>
    </div>
  );
};

export default MarketDetailPage;

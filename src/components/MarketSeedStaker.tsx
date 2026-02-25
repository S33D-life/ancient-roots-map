import { useState, useEffect } from "react";
import { Sprout, Heart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMarketSeeds } from "@/hooks/use-market-seeds";
import { useToast } from "@/hooks/use-toast";
import type { MarketOutcome } from "@/hooks/use-markets";
import { motion, AnimatePresence } from "framer-motion";

interface MarketSeedStakerProps {
  marketId: string;
  outcomes: MarketOutcome[];
  isOpen: boolean;
}

/**
 * Compact seed-staking widget for the market detail page.
 * Users spend daily market seeds (separate from tree-planting seeds).
 * Seeds sprout into hearts when the market resolves — winners split the pool.
 */
const MarketSeedStaker = ({ marketId, outcomes, isOpen }: MarketSeedStakerProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [seedCount, setSeedCount] = useState(1);
  const [staking, setStaking] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const {
    marketSeedsRemaining,
    stakeSeed,
    getStakesForMarket,
  } = useMarketSeeds(userId);

  const myStakes = getStakesForMarket(marketId);
  const totalMySeeds = myStakes.reduce((s, st) => s + st.seeds_count, 0);

  if (!isOpen) return null;

  const handleStake = async () => {
    if (!selectedOutcome || seedCount <= 0) return;
    setStaking(true);
    const ok = await stakeSeed(marketId, selectedOutcome, seedCount);
    setStaking(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      toast({
        title: "Seed planted! 🌱",
        description: `${seedCount} seed${seedCount > 1 ? "s" : ""} staked — sprouts into hearts when market resolves.`,
      });
      setSelectedOutcome(null);
      setSeedCount(1);
    } else {
      toast({
        title: "Couldn't stake",
        description: userId ? "No seeds remaining today." : "Please sign in first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-primary" />
          <span className="text-sm font-serif text-foreground">Stake Seeds</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-serif border-primary/30 text-primary gap-1">
          <Sprout className="w-3 h-3" /> {marketSeedsRemaining} left today
        </Badge>
      </div>

      <p className="text-[11px] font-serif text-muted-foreground leading-relaxed">
        Plant seeds on an outcome. When the market resolves, winning seeds sprout into hearts — 
        winners split the entire seed pool.
      </p>

      {!userId ? (
        <p className="text-xs font-serif text-muted-foreground italic">Sign in to stake seeds.</p>
      ) : (
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-4 text-primary"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-serif text-sm">Seed planted!</span>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-2">
              {/* Outcome selector */}
              <div className="grid grid-cols-2 gap-2">
                {outcomes.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutcome(selectedOutcome === o.id ? null : o.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-serif text-left transition-all ${
                      selectedOutcome === o.id
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/40 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {selectedOutcome && (
                <>
                  {/* Seed count */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-serif text-muted-foreground">Seeds:</span>
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        disabled={n > marketSeedsRemaining}
                        onClick={() => setSeedCount(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-serif border transition-all ${
                          seedCount === n
                            ? "border-primary bg-primary/10 text-primary"
                            : n > marketSeedsRemaining
                            ? "border-border/20 text-muted-foreground/40 cursor-not-allowed"
                            : "border-border/40 text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    className="w-full font-serif text-xs gap-1.5"
                    onClick={handleStake}
                    disabled={staking || marketSeedsRemaining < seedCount}
                  >
                    {staking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sprout className="w-3.5 h-3.5" />}
                    Plant {seedCount} seed{seedCount > 1 ? "s" : ""} on "{outcomes.find(o => o.id === selectedOutcome)?.label}"
                  </Button>
                </>
              )}

              {/* Existing stakes */}
              {totalMySeeds > 0 && (
                <p className="text-[10px] font-serif text-muted-foreground/70 pt-1">
                  You have {totalMySeeds} seed{totalMySeeds > 1 ? "s" : ""} staked in this market.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default MarketSeedStaker;

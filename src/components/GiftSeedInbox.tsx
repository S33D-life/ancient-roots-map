/**
 * GiftSeedInbox — recipient-side UI for viewing and activating pending gift seeds.
 * Each activation converts seeds 1:1 into S33D Hearts.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Heart, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMarketSeeds, type GiftSeed } from "@/hooks/use-market-seeds";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GiftSeedInboxProps {
  userId: string;
}

const GiftSeedInbox = ({ userId }: GiftSeedInboxProps) => {
  const { pendingGifts, receivedGifts, activateGift, refresh } = useMarketSeeds(userId);
  const [activating, setActivating] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<Set<string>>(new Set());

  const activatedGifts = receivedGifts.filter(g => g.activated_at);

  const handleActivate = async (gift: GiftSeed) => {
    setActivating(gift.id);

    // Activate the gift (marks it + sets hearts_earned)
    const ok = await activateGift(gift.id);
    if (!ok) {
      toast.error("Couldn't activate gift seed");
      setActivating(null);
      return;
    }

    // Issue heart transaction for the recipient
    const { error } = await supabase.from("heart_transactions").insert({
      user_id: userId,
      tree_id: "00000000-0000-0000-0000-000000000000", // system-level gift heart
      heart_type: "gift",
      amount: gift.seeds_count,
    });

    if (error) {
      console.error("Heart tx error:", error);
    }

    setJustActivated(prev => new Set(prev).add(gift.id));
    setActivating(null);
    toast(`🌱 +${gift.seeds_count} S33D Heart${gift.seeds_count > 1 ? "s" : ""} sprouted from gift!`);
    await refresh();
  };

  if (pendingGifts.length === 0 && activatedGifts.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card/40 border border-border/20 text-center">
        <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-serif italic">
          No gift seeds yet. When a friend sends you seeds, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending gifts — actionable */}
      {pendingGifts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-serif tracking-widest uppercase text-primary flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Seeds Awaiting You
          </h4>
          <AnimatePresence mode="popLayout">
            {pendingGifts.map((gift) => (
              <motion.div
                key={gift.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-card/60 backdrop-blur border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm font-serif text-foreground">
                            {gift.seeds_count} seed{gift.seeds_count > 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(gift.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {gift.message && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2 ml-6">
                            "{gift.message}"
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleActivate(gift)}
                        disabled={activating === gift.id || justActivated.has(gift.id)}
                        className="shrink-0 gap-1.5 font-serif text-xs"
                      >
                        {activating === gift.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : justActivated.has(gift.id) ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Heart className="w-3.5 h-3.5" />
                        )}
                        {justActivated.has(gift.id) ? "Sprouted!" : "Sprout"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Recently activated */}
      {activatedGifts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-serif tracking-widest uppercase text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sprouted
          </h4>
          {activatedGifts.slice(0, 5).map((gift) => (
            <div key={gift.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/20">
              <Heart className="w-4 h-4 text-primary/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-serif text-muted-foreground">
                  +{gift.hearts_earned || gift.seeds_count} heart{(gift.hearts_earned || gift.seeds_count) > 1 ? "s" : ""}
                </span>
                {gift.message && (
                  <span className="text-[10px] text-muted-foreground/60 ml-2 italic">"{gift.message}"</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                {gift.activated_at && formatDistanceToNow(new Date(gift.activated_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftSeedInbox;

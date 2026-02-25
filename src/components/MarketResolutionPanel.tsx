/**
 * MarketResolutionPanel — curator UI to resolve a market and distribute heart payouts.
 * Winners split the pool proportionally based on their stake.
 */
import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MarketOutcome, MarketStake } from "@/hooks/use-markets";

interface Props {
  marketId: string;
  outcomes: MarketOutcome[];
  stakes: MarketStake[];
  totalStaked: number;
  winnerPoolPercent: number;
  onResolved: () => void;
}

export default function MarketResolutionPanel({ marketId, outcomes, stakes, totalStaked, winnerPoolPercent, onResolved }: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!selectedOutcome) return;
    setResolving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Insert resolution record
      const { error: resErr } = await supabase.from("market_resolutions").insert({
        market_id: marketId,
        resolved_outcome_id: selectedOutcome,
        resolver_id: user.id,
        notes: notes || null,
      });
      if (resErr) throw resErr;

      // 2. Mark winning outcome
      await supabase.from("market_outcomes")
        .update({ is_winning: true })
        .eq("id", selectedOutcome);

      // 3. Update market status
      await supabase.from("markets")
        .update({ status: "resolved", resolve_time: new Date().toISOString() })
        .eq("id", marketId);

      // 4. Distribute hearts to winners
      const winnerPool = Math.floor(totalStaked * (winnerPoolPercent / 100));
      const winningStakes = stakes.filter(s => s.outcome_id === selectedOutcome);
      const winningTotal = winningStakes.reduce((s, st) => s + st.amount, 0);

      if (winningTotal > 0 && winnerPool > 0) {
        const heartInserts = winningStakes.map(stake => {
          const share = Math.max(1, Math.round((stake.amount / winningTotal) * winnerPool));
          return {
            user_id: stake.user_id,
            tree_id: "00000000-0000-0000-0000-000000000000",
            heart_type: "market_win",
            amount: share,
          };
        });

        if (heartInserts.length > 0) {
          await supabase.from("heart_transactions").insert(heartInserts);
        }

        // Update seed stakes with payout info
        for (const stake of winningStakes) {
          const share = Math.max(1, Math.round((stake.amount / winningTotal) * winnerPool));
          await supabase.from("market_seed_stakes")
            .update({ hearts_earned: share, resolved_at: new Date().toISOString() })
            .eq("market_id", marketId)
            .eq("user_id", stake.user_id)
            .eq("outcome_id", selectedOutcome);
        }
      }

      toast("Market resolved! Hearts distributed to winners. 🎉");
      onResolved();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Resolution failed");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-sm tracking-widest uppercase text-primary">Resolve Market</h3>
      </div>

      <p className="text-xs text-muted-foreground font-serif">
        Select the winning outcome. {totalStaked > 0 ? `${Math.floor(totalStaked * (winnerPoolPercent / 100))} hearts will be distributed to winners.` : "No stakes to distribute."}
      </p>

      <div className="space-y-2">
        {outcomes.map((o) => {
          const outcomeStakes = stakes.filter(s => s.outcome_id === o.id).reduce((s, st) => s + st.amount, 0);
          return (
            <button
              key={o.id}
              onClick={() => setSelectedOutcome(o.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                selectedOutcome === o.id
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-card/40 hover:border-border/60"
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedOutcome === o.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                <span className="text-sm font-serif">{o.label}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{outcomeStakes} staked</Badge>
            </button>
          );
        })}
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Resolution notes (optional)..."
        className="text-sm font-serif min-h-[60px]"
      />

      <Button
        onClick={handleResolve}
        disabled={!selectedOutcome || resolving}
        className="w-full font-serif gap-2"
      >
        {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Confirm Resolution
      </Button>
    </div>
  );
}

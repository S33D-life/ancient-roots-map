/**
 * HeartClaimsPanel — Shows claimable rewards (future blockchain bridge).
 * Renders an elegant placeholder when empty.
 */
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { motion } from "framer-motion";
import { Wallet, Sparkles, Lock, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  userId: string;
}

const HeartClaimsPanel = ({ userId }: Props) => {
  const { claims, isLoading } = useHeartEconomy(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  // Active claims
  if (claims.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
          Claimable Rewards
        </p>
        {claims.map((claim, i) => (
          <motion.div
            key={claim.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground">
                {claim.claim_type.replace(/_/g, " ")}
              </p>
              <p className="text-[10px] text-muted-foreground/50 font-serif">
                {claim.amount} Hearts · Connect wallet to claim
              </p>
            </div>
            <span className="text-sm font-serif font-bold text-primary tabular-nums">
              {claim.amount}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  // Empty state — future-safe placeholder
  return (
    <div className="text-center py-6 space-y-4">
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.1), transparent)",
          border: "1px dashed hsl(var(--primary) / 0.2)",
        }}
      >
        <Wallet className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <div>
        <p className="text-sm font-serif text-foreground/70">No claimable rewards yet</p>
        <p className="text-[10px] font-serif text-muted-foreground/40 mt-1 max-w-[240px] mx-auto leading-relaxed">
          As you participate in the S33D ecosystem, certain rewards will become claimable
          through an optional wallet connection — coming in a future chapter.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] font-serif text-muted-foreground/30">
        <Lock className="w-3 h-3" />
        <span>Wallet connection optional · Blockchain bridge coming soon</span>
      </div>
    </div>
  );
};

export default HeartClaimsPanel;

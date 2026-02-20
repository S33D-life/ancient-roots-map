import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TreePine, Flame, Globe, Leaf, Clock, Heart } from "lucide-react";
import type { MarketWithMeta } from "@/hooks/use-markets";
import { timeLeft, outcomePercent } from "@/hooks/use-markets";

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  tree: <TreePine className="w-3 h-3" />,
  grove: <Leaf className="w-3 h-3" />,
  species: <Flame className="w-3 h-3" />,
  region: <Globe className="w-3 h-3" />,
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-emerald-500",
  closed: "text-amber-500",
  resolved: "text-primary",
  draft: "text-muted-foreground",
  cancelled: "text-destructive",
};

interface MarketCardProps {
  market: MarketWithMeta;
  index?: number;
}

const MarketCard = ({ market, index = 0 }: MarketCardProps) => {
  const tLeft = timeLeft(market.close_time);
  const isOpen = market.status === "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link to={`/markets/${market.id}`}>
        <Card className="bg-card/60 backdrop-blur border-border/40 hover:border-primary/30 transition-all duration-200 cursor-pointer group hover:shadow-md">
          <CardContent className="p-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] font-serif gap-1 border-border/60 px-1.5 py-0.5"
                >
                  {SCOPE_ICONS[market.scope]}
                  {market.scope}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-serif border-border/60 px-1.5 py-0.5"
                >
                  {market.market_type === "binary" ? "Yes/No" : market.market_type === "date_range" ? "Date" : "Over/Under"}
                </Badge>
                {market.is_demo && (
                  <Badge variant="secondary" className="text-[10px] font-serif px-1.5 py-0.5">
                    Demo
                  </Badge>
                )}
              </div>
              <span className={`text-[11px] font-serif ${STATUS_COLORS[market.status]} shrink-0`}>
                {market.status === "open" ? tLeft : market.status}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-foreground group-hover:text-primary transition-colors text-sm leading-snug mb-3 line-clamp-2">
              {market.title}
            </h3>

            {/* Outcome bars (binary only) */}
            {market.market_type === "binary" && market.outcomes.length >= 2 && (
              <div className="mb-3">
                <div className="flex gap-1.5 mb-1.5">
                  {market.outcomes.map((o) => {
                    const pct = outcomePercent(market.stakes, o.id, market.totalStaked);
                    return (
                      <div key={o.id} className="flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-serif text-muted-foreground">{o.label}</span>
                          <span className="text-[10px] font-serif tabular-nums text-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: o.label.toLowerCase().includes("yes") || o.sort_order === 0
                                ? "hsl(var(--primary))"
                                : "hsl(var(--muted-foreground) / 0.4)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-serif pt-2 border-t border-border/20">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {market.totalStaked} staked
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isOpen ? tLeft : new Date(market.close_time).toLocaleDateString()}
              </span>
              <span className="text-primary/60">
                {market.grove_fund_percent}% → grove
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default MarketCard;

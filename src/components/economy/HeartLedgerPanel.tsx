/**
 * HeartLedgerPanel — User-facing heart transaction history.
 * Feels like a living account of creative energy.
 */
import { useHeartEconomy } from "@/hooks/use-heart-economy";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Eye, Sparkles, ShoppingCart, Gift, Palette, Loader2 } from "lucide-react";
import type { HeartLedgerEntry } from "@/lib/heart-economy-types";

interface Props {
  userId: string;
}

const TXN_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  earn_tree_mapping: { label: "Tree Mapped", icon: MapPin, color: "120 50% 50%" },
  earn_checkin: { label: "Check-in", icon: Eye, color: "200 50% 50%" },
  earn_offering: { label: "Offering", icon: Heart, color: "330 60% 55%" },
  earn_curation: { label: "Curation", icon: Sparkles, color: "280 50% 55%" },
  earn_council: { label: "Council", icon: Sparkles, color: "42 80% 50%" },
  earn_contribution: { label: "Contribution", icon: MapPin, color: "150 45% 45%" },
  earn_referral: { label: "Referral", icon: Gift, color: "200 55% 50%" },
  earn_streak_bonus: { label: "Streak Bonus", icon: Sparkles, color: "42 90% 55%" },
  earn_windfall: { label: "Windfall", icon: Sparkles, color: "270 50% 60%" },
  earn_patron_grant: { label: "Patron Grant", icon: Heart, color: "42 95% 55%" },
  purchase_bundle: { label: "Purchased", icon: ShoppingCart, color: "200 60% 50%" },
  spend_nftree_generation: { label: "NFTree Created", icon: Palette, color: "330 55% 50%" },
  spend_room_customisation: { label: "Room Customised", icon: Palette, color: "270 45% 55%" },
  spend_skin_unlock: { label: "Skin Unlocked", icon: Sparkles, color: "42 70% 50%" },
  spend_gift: { label: "Gift Sent", icon: Gift, color: "330 60% 50%" },
};

const HeartLedgerPanel = ({ userId }: Props) => {
  const { ledger, isLoading } = useHeartEconomy(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (ledger.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
        <p className="text-xs font-serif text-muted-foreground/50">No heart activity yet</p>
        <p className="text-[10px] font-serif text-muted-foreground/30 mt-1">
          Map a tree or make an offering to see your first entry
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
        Heart Flow Ledger
      </p>
      <AnimatePresence mode="popLayout">
        {ledger.map((entry, i) => (
          <LedgerRow key={entry.id} entry={entry} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const LedgerRow = ({ entry, index }: { entry: HeartLedgerEntry; index: number }) => {
  const cfg = TXN_CONFIG[entry.transaction_type] || {
    label: entry.transaction_type.replace(/_/g, " "),
    icon: Heart,
    color: "42 95% 55%",
  };
  const Icon = cfg.icon;
  const isSpend = entry.amount < 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-card/30 transition-colors"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `hsl(${cfg.color} / 0.12)`,
          border: `1px solid hsl(${cfg.color} / 0.25)`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${cfg.color})` }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-serif text-foreground/80 truncate">{cfg.label}</p>
        <p className="text-[10px] text-muted-foreground/40 truncate">
          {entry.currency_type}{entry.entity_type ? ` · ${entry.entity_type}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`text-xs font-serif tabular-nums font-bold ${
            isSpend ? "text-destructive" : ""
          }`}
          style={!isSpend ? { color: `hsl(${cfg.color})` } : undefined}
        >
          {isSpend ? "" : "+"}{entry.amount}
        </span>
        <p className="text-[9px] text-muted-foreground/30">
          {new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
    </motion.div>
  );
};

export default HeartLedgerPanel;

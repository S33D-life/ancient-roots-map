/**
 * VaultPatronBadge — Shows founding patron details in the Vault
 * when the user has an active staff. Displays donation, starting hearts,
 * and links to Value Tree and Staff Room.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Heart, Shield, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
  PATRON_INFLUENCE_BONUS,
  PATRON_SPECIES_HEARTS_BONUS,
} from "@/data/staffPatronValue";
import type { CachedStaff } from "@/hooks/use-wallet";

interface Props {
  staff: CachedStaff;
}

const VaultPatronBadge = ({ staff }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden"
  >
    {/* Gold accent */}
    <div
      className="h-0.5"
      style={{
        background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.6), hsl(42 85% 55% / 0.2), transparent)",
      }}
    />

    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Crown className="w-4 h-4" style={{ color: "hsl(42, 85%, 55%)" }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-serif tracking-wide text-foreground">
            Founding Patron
          </h3>
          <p className="text-[9px] font-serif text-muted-foreground">
            {staff.id} · {staff.species}
            {staff.is_origin_spiral && " · Origin Spiral"}
          </p>
        </div>
        <Badge variant="outline" className="text-[8px] font-serif border-primary/20">
          Staff #{staff.token_id}
        </Badge>
      </div>

      {/* Value summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ValueChip
          icon={<Wand2 className="w-3 h-3" />}
          label="Donation"
          value={`£${PATRON_DONATION_GBP.toLocaleString()}`}
          color="hsl(42, 85%, 55%)"
        />
        <ValueChip
          icon={<Heart className="w-3 h-3" />}
          label="Starting Hearts"
          value={PATRON_STARTING_HEARTS.toLocaleString()}
          color="hsl(0, 65%, 55%)"
        />
        <ValueChip
          icon={<Sparkles className="w-3 h-3" />}
          label="Species Hearts"
          value={String(PATRON_SPECIES_HEARTS_BONUS)}
          color="hsl(150, 50%, 45%)"
        />
        <ValueChip
          icon={<Shield className="w-3 h-3" />}
          label="Influence"
          value={String(PATRON_INFLUENCE_BONUS)}
          color="hsl(42, 80%, 50%)"
        />
      </div>

      {/* Founding circle note */}
      <p className="text-[10px] font-serif text-muted-foreground/80 italic leading-relaxed">
        Your staff is a living node in the S33D economy — map trees, make offerings, and
        deepen your role as a founding patron of the Ancient Friends ecosystem.
      </p>

      {/* Links */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          to="/value-tree?tab=economy"
          className="group flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🌳</span>
            <span className="text-[10px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
              Your place in the Value Tree
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/patron-offering"
          className="group flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">👑</span>
            <span className="text-[10px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
              Patron Offering
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/library/staff-room"
          className="group flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🪄</span>
            <span className="text-[10px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
              Staff Room
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  </motion.div>
);

const ValueChip = ({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) => (
  <div className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/20 bg-card/20">
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </div>
    <span className="text-xs font-serif font-bold tabular-nums" style={{ color }}>
      {value}
    </span>
    <span className="text-[7px] font-serif text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default VaultPatronBadge;

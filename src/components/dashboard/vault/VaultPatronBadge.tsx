/**
 * VaultPatronBadge — Shows founding patron details in the Vault
 * with live activity stats: trees mapped, offerings made, species hearts, influence.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Crown, Heart, Shield, Sparkles, ArrowRight, Wand2,
  TreePine, Gift, MapPin, Scroll,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
  PATRON_INFLUENCE_BONUS,
  PATRON_SPECIES_HEARTS_BONUS,
} from "@/data/staffPatronValue";
import type { CachedStaff } from "@/hooks/use-wallet";

interface Props {
  staff: CachedStaff;
  userId?: string;
}

interface PatronActivity {
  treesMapped: number;
  offeringsMade: number;
  speciesHeartsEarned: number;
  influenceGained: number;
  recentHearts: { heart_type: string; amount: number; created_at: string }[];
}

const VaultPatronBadge = ({ staff, userId }: Props) => {
  const [activity, setActivity] = useState<PatronActivity | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [treesRes, offeringsRes, speciesRes, influenceRes, recentRes] = await Promise.all([
        supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("species_heart_transactions").select("amount").eq("user_id", userId),
        supabase.from("influence_transactions").select("amount").eq("user_id", userId),
        supabase.from("heart_transactions").select("heart_type, amount, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);
      setActivity({
        treesMapped: treesRes.count || 0,
        offeringsMade: offeringsRes.count || 0,
        speciesHeartsEarned: (speciesRes.data || []).reduce((s, r) => s + (r.amount || 0), 0),
        influenceGained: (influenceRes.data || []).reduce((s, r) => s + (r.amount || 0), 0),
        recentHearts: (recentRes.data || []) as any,
      });
    };
    load();
  }, [userId]);

  return (
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

        {/* Starting allocation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ValueChip icon={<Wand2 className="w-3 h-3" />} label="Donation" value={`£${PATRON_DONATION_GBP.toLocaleString()}`} color="hsl(42, 85%, 55%)" />
          <ValueChip icon={<Heart className="w-3 h-3" />} label="Starting Hearts" value={PATRON_STARTING_HEARTS.toLocaleString()} color="hsl(0, 65%, 55%)" />
          <ValueChip icon={<Sparkles className="w-3 h-3" />} label="Species Hearts" value={String(PATRON_SPECIES_HEARTS_BONUS)} color="hsl(150, 50%, 45%)" />
          <ValueChip icon={<Shield className="w-3 h-3" />} label="Influence" value={String(PATRON_INFLUENCE_BONUS)} color="hsl(42, 80%, 50%)" />
        </div>

        {/* Live activity panel */}
        {activity && (
          <div className="space-y-3">
            <p className="text-[9px] font-serif text-muted-foreground uppercase tracking-widest">Staff Activity</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ActivityChip icon={<MapPin className="w-3 h-3" />} label="Trees Mapped" value={activity.treesMapped} />
              <ActivityChip icon={<Gift className="w-3 h-3" />} label="Offerings" value={activity.offeringsMade} />
              <ActivityChip icon={<Sparkles className="w-3 h-3" />} label="Species ♡ Earned" value={Math.round(activity.speciesHeartsEarned)} />
              <ActivityChip icon={<Shield className="w-3 h-3" />} label="Influence Gained" value={Math.round(activity.influenceGained)} />
            </div>

            {/* Recent heart activity */}
            {activity.recentHearts.length > 0 && (
              <div className="space-y-1">
                <p className="text-[8px] font-serif text-muted-foreground/60 uppercase tracking-widest">Recent Heart Flow</p>
                {activity.recentHearts.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded-lg border border-border/10 bg-card/10">
                    <span className="text-[9px] font-serif text-muted-foreground">{h.heart_type.replace(/_/g, " ")}</span>
                    <span className="text-[9px] font-serif text-foreground font-medium">+{h.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Founding circle note */}
        <p className="text-[10px] font-serif text-muted-foreground/80 italic leading-relaxed">
          Your staff is a living node in the S33D economy — map trees, make offerings, and
          deepen your role as a founding patron of the Ancient Friends ecosystem.
        </p>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <NavLink to="/value-tree?tab=economy" icon="🌳" label="Value Tree" />
          <NavLink to="/patron-offering" icon="👑" label="Patron Offering" />
          <NavLink to="/library/staff-room" icon="🪄" label="Staff Room" />
        </div>
      </div>
    </motion.div>
  );
};

const NavLink = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
  <Link
    to={to}
    className="group flex items-center justify-between px-3 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
  >
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </div>
    <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
  </Link>
);

const ValueChip = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/20 bg-card/20">
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
    <span className="text-xs font-serif font-bold tabular-nums" style={{ color }}>{value}</span>
    <span className="text-[7px] font-serif text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

const ActivityChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex items-center gap-2 p-2 rounded-xl border border-border/15 bg-card/15">
    <div className="text-primary/50 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-serif font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[7px] font-serif text-muted-foreground truncate">{label}</p>
    </div>
  </div>
);

export default VaultPatronBadge;

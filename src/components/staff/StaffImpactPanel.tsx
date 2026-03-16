/**
 * StaffImpactPanel — "Your Staff Impact" dashboard shown in the Staff Room.
 * Displays: hearts generated, trees mapped, NFTrees minted, council participation, influence earned.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart, TreeDeciduous, Sparkles, Shield, Crown,
  MapPin, Scroll, Users, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

interface StaffImpact {
  heartsGenerated: number;
  treesMapped: number;
  nfTreesMinted: number;
  councilParticipation: number;
  influenceEarned: number;
  speciesHeartsEarned: number;
  staffCode: string | null;
  staffSpecies: string | null;
}

const StaffImpactPanel = () => {
  const { userId } = useCurrentUser();
  const [impact, setImpact] = useState<StaffImpact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const load = async () => {
      // Check if user has a staff
      const { data: staff } = await supabase
        .from("staffs")
        .select("id, species")
        .eq("owner_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!staff) { setLoading(false); return; }

      const [heartsRes, treesRes, speciesRes, influenceRes, councilRes, nftreeRes] = await Promise.all([
        supabase.from("heart_transactions").select("amount").eq("user_id", userId),
        supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("species_heart_transactions").select("amount").eq("user_id", userId),
        supabase.from("influence_transactions").select("amount").eq("user_id", userId),
        supabase.from("council_participation_rewards").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("nftree_mints").select("*", { count: "exact", head: true }).eq("minter_user_id", userId).eq("mint_status", "confirmed"),
      ]);

      setImpact({
        heartsGenerated: (heartsRes.data || []).reduce((s, r) => s + (r.amount || 0), 0),
        treesMapped: treesRes.count || 0,
        nfTreesMinted: nftreeRes.count || 0,
        councilParticipation: councilRes.count || 0,
        influenceEarned: (influenceRes.data || []).reduce((s, r) => s + (r.amount || 0), 0),
        speciesHeartsEarned: (speciesRes.data || []).reduce((s, r) => s + (r.amount || 0), 0),
        staffCode: staff.id,
        staffSpecies: staff.species,
      });
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading || !impact) return null;

  const metrics = [
    { icon: <Heart className="w-3.5 h-3.5" />, label: "Hearts Generated", value: impact.heartsGenerated, color: "hsl(0, 65%, 55%)" },
    { icon: <MapPin className="w-3.5 h-3.5" />, label: "Trees Mapped", value: impact.treesMapped, color: "hsl(var(--primary))" },
    { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Species Hearts", value: Math.round(impact.speciesHeartsEarned), color: "hsl(150, 50%, 45%)" },
    { icon: <Shield className="w-3.5 h-3.5" />, label: "Influence Earned", value: Math.round(impact.influenceEarned), color: "hsl(42, 80%, 50%)" },
    { icon: <Users className="w-3.5 h-3.5" />, label: "Council Sessions", value: impact.councilParticipation, color: "hsl(280, 60%, 55%)" },
    { icon: <TreeDeciduous className="w-3.5 h-3.5" />, label: "NFTrees Minted", value: impact.nfTreesMinted, color: "hsl(120, 45%, 50%)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden"
    >
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.5), transparent)" }}
      />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Crown className="w-4 h-4" style={{ color: "hsl(42, 85%, 55%)" }} />
          <div>
            <h3 className="text-sm font-serif text-foreground tracking-wide">Your Staff Impact</h3>
            <p className="text-[9px] font-serif text-muted-foreground">
              {impact.staffCode} · {impact.staffSpecies}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-border/15 bg-card/15"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${m.color}15`, color: m.color }}
              >
                {m.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-serif font-bold text-foreground tabular-nums">{m.value}</p>
                <p className="text-[7px] font-serif text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cross-navigation */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: "/vault", icon: "🔐", label: "Vault" },
            { to: "/value-tree?tab=economy", icon: "🌳", label: "Value Tree" },
            { to: "/hives", icon: "🐝", label: "Hives" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all text-center"
            >
              <span className="text-sm">{link.icon}</span>
              <span className="text-[9px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StaffImpactPanel;

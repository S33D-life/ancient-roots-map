import { motion } from "framer-motion";
import { Shield, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getHiveInfo } from "@/utils/hiveUtils";

interface Props {
  globalInfluence: number;
  influenceByHive: Record<string, number>;
}

const VaultInfluence = ({ globalInfluence, influenceByHive }: Props) => {
  const hiveEntries = Object.entries(influenceByHive)
    .map(([family, amount]) => ({ family, amount, hive: getHiveInfo(family) }))
    .sort((a, b) => b.amount - a.amount);

  const totalInfluence = globalInfluence + hiveEntries.reduce((s, e) => s + e.amount, 0);

  // Reputation tier
  const tier = totalInfluence >= 100 ? "Elder Curator" :
    totalInfluence >= 50 ? "Grove Keeper" :
    totalInfluence >= 20 ? "Path Walker" :
    totalInfluence >= 5 ? "Seedling Voice" : "Observer";

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-serif tracking-wide text-foreground">Influence</h3>
          <Badge variant="outline" className="text-[9px] font-serif ml-auto" style={{ borderColor: "hsl(42 80% 50% / 0.4)" }}>
            Soulbound
          </Badge>
        </div>

        {/* Main balance + tier */}
        <motion.div
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-2"
              style={{
                borderColor: "hsl(42 80% 50% / 0.5)",
                background: "radial-gradient(circle, hsl(42 80% 50% / 0.1), transparent)",
              }}
            >
              <span className="text-xl font-serif font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>
                {totalInfluence}
              </span>
            </div>
            <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-serif text-foreground">{tier}</p>
            <p className="text-[10px] text-muted-foreground font-serif">Your curation reputation</p>
            {globalInfluence > 0 && (
              <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
                {globalInfluence} global · {totalInfluence - globalInfluence} hive-specific
              </p>
            )}
          </div>
        </motion.div>

        {/* How influence is earned */}
        <div className="border-t border-border/30 pt-3 mb-3">
          <p className="text-[10px] text-muted-foreground font-serif mb-2 uppercase tracking-wider">Earned by</p>
          <div className="flex flex-wrap gap-1.5">
            {["Verify trees", "Add metadata", "Quality media", "Curate playlists", "Resolve duplicates"].map(action => (
              <Badge key={action} variant="secondary" className="text-[9px] font-serif">{action}</Badge>
            ))}
          </div>
        </div>

        {/* Per-hive breakdown */}
        {hiveEntries.length > 0 && (
          <div className="border-t border-border/30 pt-3 space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">By Hive</p>
            {hiveEntries.map(e => (
              <div key={e.family} className="flex items-center gap-2 text-xs font-serif">
                <span>{e.hive.icon}</span>
                <span className="flex-1 text-muted-foreground truncate">{e.hive.displayName}</span>
                <span className="tabular-nums" style={{ color: `hsl(${e.hive.accentHsl})` }}>{e.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultInfluence;

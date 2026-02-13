import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { SpeciesBalance } from "@/hooks/use-species-tokens";

interface Props {
  balances: SpeciesBalance[];
  totalSpeciesHearts: number;
}

const VaultSpeciesHearts = ({ balances, totalSpeciesHearts }: Props) => {
  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌿</span>
          <h3 className="text-sm font-serif tracking-wide text-foreground">Species Hearts</h3>
        </div>
        <p className="text-xs text-muted-foreground font-serif">
          Map trees and make offerings to earn Species Hearts — fractal tokens tied to each botanical family.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h3 className="text-sm font-serif tracking-wide text-foreground">Species Hearts</h3>
          </div>
          <span className="text-xs font-serif tabular-nums text-muted-foreground">
            {totalSpeciesHearts} total
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-serif">Fractal hearts by botanical lineage</p>
      </div>

      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {balances.map((b, i) => (
          <motion.div
            key={b.family}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/hive/${b.hive.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all group"
            >
              <span className="text-2xl">{b.hive.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground truncate group-hover:text-primary transition-colors">
                  {b.hive.displayName.replace(" Hive", "")} Hearts
                </p>
                <p className="text-[10px] text-muted-foreground font-serif">{b.family}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-serif tabular-nums font-bold" style={{ color: `hsl(${b.hive.accentHsl})` }}>
                  {b.amount}
                </p>
                <Heart className="w-3 h-3 inline" style={{ color: `hsl(${b.hive.accentHsl})` }} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VaultSpeciesHearts;

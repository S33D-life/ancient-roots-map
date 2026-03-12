/**
 * EmissionCurve — Visualizes the Proof of Flow emission eras.
 * A horizontal bar chart styled as tree growth rings.
 */
import { motion } from "framer-motion";
import { EMISSION_ERAS } from "@/data/s33dEconomy";

const EmissionCurve = () => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-serif text-muted-foreground italic">
          Hearts drip into the ecosystem like sap through a tree — fast at first, slowing as the forest matures.
        </p>
      </div>

      <div className="space-y-2.5">
        {EMISSION_ERAS.map((era, i) => (
          <motion.div
            key={era.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            {/* Era label */}
            <div className="w-24 shrink-0 text-right">
              <p className="text-[11px] font-serif text-foreground">{era.label}</p>
              <p className="text-[9px] font-serif text-muted-foreground">{era.years}</p>
            </div>

            {/* Bar */}
            <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-card/30 border border-border/20">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-lg flex items-center px-3"
                style={{
                  backgroundColor: era.color,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 12px ${era.color}30`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${era.supplyPercent}%` }}
                transition={{ delay: i * 0.12 + 0.2, duration: 0.6, ease: "easeOut" }}
              >
                <span className="text-[10px] font-serif font-bold text-white whitespace-nowrap">
                  {era.supplyPercent}%
                </span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total context */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-serif text-muted-foreground/60">
          Proof of Flow distributes <span className="text-foreground font-bold">333,333,333</span> hearts over 60 years
        </p>
      </div>
    </div>
  );
};

export default EmissionCurve;

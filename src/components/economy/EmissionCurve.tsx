/**
 * EmissionCurve — Proof of Flow emission eras, styled as a long forest rhythm.
 * Elegant, botanical, with clear era explanations.
 */
import { motion } from "framer-motion";
import { EMISSION_ERAS } from "@/data/s33dEconomy";

const TOTAL_YEARS = 60;
const PROOF_OF_FLOW_SUPPLY = 333_333_333;

const EmissionCurve = () => {
  return (
    <div className="space-y-6">
      {/* Poetic intro */}
      <div className="text-center space-y-2">
        <p className="text-xs font-serif text-muted-foreground italic max-w-md mx-auto leading-relaxed">
          Like Bitcoin's halving curve, Proof of Flow emissions slow over time — but here, scarcity emerges through ecological participation, not computation.
        </p>
        <p className="text-[10px] font-serif text-muted-foreground/60">
          {PROOF_OF_FLOW_SUPPLY.toLocaleString()} hearts over {TOTAL_YEARS} years
        </p>
      </div>

      {/* Era bars */}
      <div className="space-y-3">
        {EMISSION_ERAS.map((era, i) => {
          const heartsInEra = Math.round(PROOF_OF_FLOW_SUPPLY * (era.supplyPercent / 100));

          return (
            <motion.div
              key={era.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="group"
            >
              {/* Label row */}
              <div className="flex items-baseline justify-between mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: era.color, boxShadow: `0 0 6px ${era.color}40` }}
                  />
                  <span className="text-[11px] font-serif font-semibold text-foreground">{era.label}</span>
                </div>
                <span className="text-[9px] font-serif text-muted-foreground tabular-nums">
                  {era.years} · {era.yearRange}
                </span>
              </div>

              {/* Bar */}
              <div className="relative h-7 rounded-lg overflow-hidden bg-card/30 border border-border/15">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-lg flex items-center"
                  style={{
                    background: `linear-gradient(90deg, ${era.color}, ${era.color}cc)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 16px ${era.color}20`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(era.supplyPercent, 8)}%` }}
                  transition={{ delay: i * 0.12 + 0.2, duration: 0.7, ease: "easeOut" }}
                >
                  <span className="text-[10px] font-serif font-bold text-white/90 pl-3 whitespace-nowrap">
                    {era.supplyPercent}%
                  </span>
                </motion.div>
              </div>

              {/* Description */}
              <div className="flex items-baseline justify-between mt-1 px-1">
                <p className="text-[9px] font-serif text-muted-foreground/60 leading-snug max-w-[70%]">
                  {era.description}
                </p>
                <p className="text-[9px] font-serif text-muted-foreground/40 tabular-nums shrink-0">
                  ≈{(heartsInEra / 1_000_000).toFixed(1)}M hearts
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Timeline visualization */}
      <div className="pt-2 px-1">
        <div className="relative h-1.5 rounded-full bg-card/30 border border-border/10 overflow-hidden">
          {EMISSION_ERAS.reduce((acc, era, i) => {
            const prevWidth = acc.offset;
            const width = (era.supplyPercent / 100) * 100;
            acc.elements.push(
              <div
                key={era.label}
                className="absolute inset-y-0"
                style={{
                  left: `${prevWidth}%`,
                  width: `${width}%`,
                  backgroundColor: era.color,
                  opacity: 0.6,
                }}
              />
            );
            acc.offset += width;
            return acc;
          }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
        </div>
        <div className="flex justify-between mt-1.5 text-[8px] font-serif text-muted-foreground/40 tabular-nums">
          <span>Year 0</span>
          <span>Year 5</span>
          <span>Year 15</span>
          <span>Year 30</span>
          <span>Year 60</span>
        </div>
      </div>
    </div>
  );
};

export default EmissionCurve;

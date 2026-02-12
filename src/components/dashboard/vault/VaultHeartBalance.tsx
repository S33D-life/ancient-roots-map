import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface VaultHeartBalanceProps {
  total: number;
  wanderer: number;
  sower: number;
  windfall: number;
  baseHearts: number;
  milestoneHearts: number;
  seedsRemaining: number;
}

const VaultHeartBalance = ({
  total, wanderer, sower, windfall, baseHearts, milestoneHearts, seedsRemaining,
}: VaultHeartBalanceProps) => {
  const segments = [
    { label: "Mapped", value: baseHearts, color: "hsl(42, 95%, 55%)" },
    { label: "Milestones", value: milestoneHearts, color: "hsl(28, 70%, 50%)" },
    { label: "Wanderer", value: wanderer, color: "hsl(0, 65%, 55%)" },
    { label: "Sower", value: sower, color: "hsl(120, 45%, 50%)" },
    { label: "Windfall", value: windfall, color: "hsl(270, 50%, 60%)" },
  ].filter(s => s.value > 0);

  const ringTotal = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  // Build SVG ring segments
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-card/40 backdrop-blur-sm">
      {/* Woodgrain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            hsl(30, 30%, 40%) 8px,
            hsl(30, 30%, 40%) 9px
          )`,
        }}
      />
      {/* Inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, hsl(42 80% 50% / 0.06), transparent)",
        }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Ring chart */}
          <div className="relative shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-lg">
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                stroke="hsl(75, 15%, 20%)"
                strokeWidth="10"
                opacity="0.3"
              />
              {segments.map((seg, i) => {
                const segLen = (seg.value / ringTotal) * circumference;
                const offset = cumulativeOffset;
                cumulativeOffset += segLen;
                return (
                  <motion.circle
                    key={seg.label}
                    cx="80" cy="80" r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${segLen} ${circumference - segLen}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 80 80)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                    style={{ filter: `drop-shadow(0 0 4px ${seg.color})` }}
                  />
                );
              })}
            </svg>
            {/* Center number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-serif font-bold tabular-nums"
                style={{ color: "hsl(42, 95%, 55%)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {total}
              </motion.span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-serif mt-0.5">
                S33D Hearts
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2 w-full">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}` }}
                />
                <span className="text-xs font-serif text-muted-foreground flex-1">{seg.label}</span>
                <span className="text-xs font-serif tabular-nums text-foreground">{seg.value}</span>
              </motion.div>
            ))}

            {/* Daily seeds remaining */}
            <div className="pt-2 mt-2 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
                <span className="text-sm">🌱</span>
                <span>{seedsRemaining} seeds remaining today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultHeartBalance;

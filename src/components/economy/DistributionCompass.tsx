/**
 * DistributionCompass — 360° donut chart showing S33D supply allocation.
 * Ceremonial, legible, mobile-responsive. Feels like a sacred tree ring.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHANNELS, TOTAL_SUPPLY } from "@/data/s33dEconomy";

const DistributionCompass = ({ mintedTotal }: { mintedTotal: number }) => {
  const [active, setActive] = useState<string | null>(null);

  const SIZE = 300;
  const STROKE = 34;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const CENTER = SIZE / 2;

  // Build arc segments
  let cumulativeOffset = 0;
  const segments = CHANNELS.map((ch) => {
    const fraction = ch.hearts / TOTAL_SUPPLY;
    const dashLength = fraction * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dashLength;
    const startAngle = (cumulativeOffset / TOTAL_SUPPLY) * 360 - 90;
    const midAngle = startAngle + (ch.degrees / 2);
    cumulativeOffset += ch.hearts;
    return { ...ch, dashLength, gap, startAngle, midAngle };
  });

  const mintedPercent = ((mintedTotal / TOTAL_SUPPLY) * 100).toFixed(3);
  const activeChannel = segments.find((s) => s.id === active);

  const handleInteraction = (id: string) => setActive(prev => prev === id ? null : id);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* SVG Compass — responsive via max-w */}
      <div className="relative w-full max-w-[300px] aspect-square mx-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-full drop-shadow-lg"
        >
          {/* Outer decorative ring */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS + STROKE / 2 + 3}
            fill="none" stroke="hsl(var(--border) / 0.08)" strokeWidth={1}
          />

          {/* Background ring */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none" stroke="hsl(var(--border) / 0.12)" strokeWidth={STROKE}
          />

          {/* Channel arcs */}
          {segments.map((seg) => (
            <circle
              key={seg.id}
              cx={CENTER} cy={CENTER} r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={active === seg.id ? STROKE + 6 : STROKE}
              strokeDasharray={`${seg.dashLength} ${seg.gap}`}
              strokeLinecap="butt"
              transform={`rotate(${seg.startAngle} ${CENTER} ${CENTER})`}
              style={{
                filter: active === seg.id ? `drop-shadow(0 0 10px ${seg.glowColor})` : undefined,
                opacity: active && active !== seg.id ? 0.3 : 1,
                transition: "all 0.4s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setActive(seg.id)}
              onMouseLeave={() => setActive(null)}
              onClick={() => handleInteraction(seg.id)}
            />
          ))}

          {/* Inner decorative ring */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS - STROKE / 2 - 6}
            fill="none" stroke="hsl(var(--primary) / 0.06)" strokeWidth={0.5}
          />
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS - STROKE / 2 - 10}
            fill="none" stroke="hsl(var(--primary) / 0.04)" strokeWidth={0.5}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <AnimatePresence mode="wait">
            {activeChannel ? (
              <motion.div
                key={activeChannel.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-2xl mb-1">{activeChannel.icon}</p>
                <p className="text-[11px] font-serif font-semibold text-foreground leading-tight">
                  {activeChannel.label}
                </p>
                <p className="text-lg font-serif font-bold tabular-nums text-foreground mt-1">
                  {activeChannel.percentage}%
                </p>
                <p className="text-[9px] font-serif text-muted-foreground tabular-nums">
                  {activeChannel.hearts.toLocaleString()} · {activeChannel.degrees}°
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-widest">
                  Total Supply
                </p>
                <p className="text-2xl font-serif font-bold tabular-nums text-foreground mt-1">
                  777,777,777
                </p>
                <p className="text-[10px] font-serif text-muted-foreground mt-1">
                  S33D Hearts
                </p>
                <p className="text-[9px] font-serif text-muted-foreground/60 mt-1.5">
                  {mintedPercent}% currently minted
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend — wraps cleanly on mobile */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm px-2">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
              active === ch.id
                ? "border-primary/30 bg-card/60 scale-[1.02]"
                : "border-border/20 bg-card/20 hover:bg-card/40"
            }`}
            onMouseEnter={() => setActive(ch.id)}
            onMouseLeave={() => setActive(null)}
            onClick={() => handleInteraction(ch.id)}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: ch.color, boxShadow: `0 0 6px ${ch.glowColor}` }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-serif text-foreground leading-tight">{ch.shortLabel}</p>
              <p className="text-[9px] font-serif text-muted-foreground tabular-nums">
                {ch.percentage}% · {ch.degrees}°
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DistributionCompass;

/**
 * DistributionCompass — 360° donut chart showing S33D supply allocation.
 * Feels like a living economic compass / tree ring cross-section.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHANNELS, TOTAL_SUPPLY, type DistributionChannel } from "@/data/s33dEconomy";

const SIZE = 280;
const STROKE = 32;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

const DistributionCompass = ({ mintedTotal }: { mintedTotal: number }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  // Build arc segments
  let cumulativeOffset = 0;
  const segments = CHANNELS.map((ch) => {
    const fraction = ch.hearts / TOTAL_SUPPLY;
    const dashLength = fraction * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dashLength;
    const rotation = (cumulativeOffset / TOTAL_SUPPLY) * 360 - 90; // start from top
    cumulativeOffset += ch.hearts;

    return { ...ch, dashLength, gap, rotation };
  });

  const mintedPercent = ((mintedTotal / TOTAL_SUPPLY) * 100).toFixed(3);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* SVG Compass */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="drop-shadow-lg"
        >
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--border) / 0.15)"
            strokeWidth={STROKE}
          />

          {/* Channel arcs */}
          {segments.map((seg) => (
            <circle
              key={seg.id}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.id ? STROKE + 6 : STROKE}
              strokeDasharray={`${seg.dashLength} ${seg.gap}`}
              strokeLinecap="butt"
              transform={`rotate(${seg.rotation} ${CENTER} ${CENTER})`}
              style={{
                filter: hovered === seg.id ? `drop-shadow(0 0 8px ${seg.glowColor})` : undefined,
                opacity: hovered && hovered !== seg.id ? 0.35 : 1,
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(seg.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* Inner glow ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS - STROKE / 2 - 4}
            fill="none"
            stroke="hsl(var(--primary) / 0.08)"
            strokeWidth={1}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {hovered ? (
              <motion.div
                key={hovered}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="px-3"
              >
                <p className="text-lg font-serif font-bold text-foreground">
                  {segments.find((s) => s.id === hovered)?.icon}
                </p>
                <p className="text-[11px] font-serif text-foreground mt-1">
                  {segments.find((s) => s.id === hovered)?.shortLabel}
                </p>
                <p className="text-xs font-serif font-bold tabular-nums text-foreground mt-0.5">
                  {segments.find((s) => s.id === hovered)?.percentage}%
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-[10px] font-serif text-muted-foreground">Total Supply</p>
                <p className="text-lg font-serif font-bold tabular-nums text-foreground">
                  777M
                </p>
                <p className="text-[9px] font-serif text-muted-foreground/70 mt-0.5">
                  {mintedPercent}% in circulation
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${
              hovered === ch.id
                ? "border-primary/30 bg-card/60"
                : "border-border/20 bg-card/20 hover:bg-card/40"
            }`}
            onMouseEnter={() => setHovered(ch.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: ch.color, boxShadow: `0 0 6px ${ch.glowColor}` }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-serif text-foreground truncate">{ch.shortLabel}</p>
              <p className="text-[9px] font-serif text-muted-foreground tabular-nums">
                {(ch.hearts / 1_000_000).toFixed(1)}M · {ch.degrees}°
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DistributionCompass;

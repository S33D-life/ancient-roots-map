/**
 * BloomingClockDial — Seasonal Time Explorer with Seasonal Lens arcs.
 * 
 * A circular month dial that lets users explore time.
 * Tapping a seasonal arc activates/deactivates that season's lens across the system.
 */
import { useState } from "react";
import { type CycleStage } from "@/hooks/use-food-cycles";
import { useSeasonalLens, LENS_CONFIGS, type SeasonalLensType } from "@/contexts/SeasonalLensContext";
import { motion, AnimatePresence } from "framer-motion";

interface BloomingClockDialProps {
  currentMonth: number; // 1-12
  onMonthChange: (month: number) => void;
  activeStages?: CycleStage[];
}

const MONTHS = [
  { n: 1, label: "Jan", poetry: "Deep Winter" },
  { n: 2, label: "Feb", poetry: "Late Winter" },
  { n: 3, label: "Mar", poetry: "Early Spring" },
  { n: 4, label: "Apr", poetry: "Spring" },
  { n: 5, label: "May", poetry: "Late Spring" },
  { n: 6, label: "Jun", poetry: "Early Summer" },
  { n: 7, label: "Jul", poetry: "Midsummer" },
  { n: 8, label: "Aug", poetry: "Late Summer" },
  { n: 9, label: "Sep", poetry: "Early Autumn" },
  { n: 10, label: "Oct", poetry: "Autumn" },
  { n: 11, label: "Nov", poetry: "Late Autumn" },
  { n: 12, label: "Dec", poetry: "Early Winter" },
];

/** Seasonal arc definitions — maps to SeasonalLensContext LENS_CONFIGS */
const SEASON_ARCS: {
  key: SeasonalLensType;
  startMonth: number;
  endMonth: number;
  color: string;
  activeColor: string;
  glowColor: string;
}[] = [
  {
    key: "spring",
    startMonth: 3,
    endMonth: 5,
    color: "hsla(120, 35%, 50%, 0.15)",
    activeColor: "hsla(120, 45%, 55%, 0.35)",
    glowColor: "hsla(120, 50%, 55%, 0.25)",
  },
  {
    key: "summer",
    startMonth: 6,
    endMonth: 8,
    color: "hsla(42, 60%, 55%, 0.12)",
    activeColor: "hsla(42, 70%, 58%, 0.32)",
    glowColor: "hsla(42, 65%, 55%, 0.2)",
  },
  {
    key: "autumn",
    startMonth: 9,
    endMonth: 11,
    color: "hsla(25, 55%, 45%, 0.14)",
    activeColor: "hsla(25, 65%, 50%, 0.35)",
    glowColor: "hsla(25, 60%, 48%, 0.22)",
  },
  {
    key: "winter",
    startMonth: 12,
    endMonth: 2,
    color: "hsla(220, 25%, 50%, 0.12)",
    activeColor: "hsla(220, 35%, 55%, 0.3)",
    glowColor: "hsla(220, 30%, 55%, 0.18)",
  },
];

/** Build an SVG arc path for a seasonal segment */
function seasonArcPath(startMonth: number, endMonth: number, r: number, cx: number, cy: number): string {
  // Convert month to angle (month 1 = top, clockwise)
  const toAngle = (m: number) => ((m - 1) / 12) * 360 - 90;
  
  // For winter (12→2), we need to handle the wrap
  let startAngle = toAngle(startMonth);
  let endAngle = toAngle(endMonth + 1); // +1 to include the end month
  
  if (endMonth < startMonth) {
    // Wrap around (winter: 12→2)
    endAngle = toAngle(endMonth + 1 + 12);
  }
  
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/* Seasonal tint for the dial's ambient glow */
function seasonalTint(month: number): string {
  if (month >= 3 && month <= 5) return "hsla(120, 35%, 50%, 0.12)";
  if (month >= 6 && month <= 8) return "hsla(42, 60%, 55%, 0.12)";
  if (month >= 9 && month <= 11) return "hsla(25, 55%, 45%, 0.14)";
  return "hsla(220, 20%, 45%, 0.1)";
}

export default function BloomingClockDial({
  currentMonth,
  onMonthChange,
}: BloomingClockDialProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredSeason, setHoveredSeason] = useState<SeasonalLensType>(null);
  const { activeLens, setLens, lensConfig } = useSeasonalLens();
  
  const displayMonth = hoveredMonth ?? currentMonth;
  const poetry = MONTHS.find(m => m.n === displayMonth)?.poetry || "";
  const isToday = currentMonth === new Date().getMonth() + 1;

  const size = 140;
  const center = size / 2;
  const arcRadius = 56;
  const monthRadius = 48;

  const handleSeasonClick = (key: SeasonalLensType) => {
    setLens(activeLens === key ? null : key);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Poetry / Lens label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLens || poetry}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="text-[9px] font-serif italic text-center"
          style={{
            color: activeLens ? "hsl(var(--primary))" : "hsl(42, 45%, 58%)",
            opacity: 0.85,
          }}
        >
          {activeLens && lensConfig
            ? `${lensConfig.emoji} ${lensConfig.label}`
            : poetry}
        </motion.div>
      </AnimatePresence>

      {/* Dial ring with seasonal arcs */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: seasonalTint(displayMonth),
          transition: "background 1.2s ease-in-out",
        }}
      >
        {/* SVG seasonal arcs (clickable) */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
        >
          {SEASON_ARCS.map(arc => {
            const isActive = activeLens === arc.key;
            const isHovered = hoveredSeason === arc.key;
            const path = seasonArcPath(arc.startMonth, arc.endMonth, arcRadius, center, center);

            return (
              <g key={arc.key}>
                {/* Glow layer for active lens */}
                {isActive && (
                  <path
                    d={path}
                    fill="none"
                    stroke={arc.glowColor}
                    strokeWidth={12}
                    strokeLinecap="round"
                    className="animate-pulse"
                    style={{ filter: "blur(4px)" }}
                  />
                )}
                {/* Arc stroke */}
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? arc.activeColor : isHovered ? arc.activeColor : arc.color}
                  strokeWidth={isActive ? 6 : isHovered ? 5 : 3}
                  strokeLinecap="round"
                  style={{
                    pointerEvents: "stroke",
                    cursor: "pointer",
                    transition: "stroke 0.4s ease, stroke-width 0.3s ease",
                  }}
                  onMouseEnter={() => setHoveredSeason(arc.key)}
                  onMouseLeave={() => setHoveredSeason(null)}
                  onClick={() => handleSeasonClick(arc.key)}
                />
              </g>
            );
          })}
        </svg>

        {/* Month nodes */}
        {MONTHS.map(m => {
          const angle = ((m.n - 1) / 12) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = center + monthRadius * Math.cos(rad);
          const y = center + monthRadius * Math.sin(rad);
          const isActive = m.n === currentMonth;
          const isHovered = m.n === hoveredMonth;

          // Check if month is within active lens
          const inLens = lensConfig?.months.includes(m.n);

          return (
            <button
              key={m.n}
              onClick={() => onMonthChange(m.n)}
              onMouseEnter={() => setHoveredMonth(m.n)}
              onMouseLeave={() => setHoveredMonth(null)}
              className="absolute transition-all duration-500"
              style={{
                left: x - 10,
                top: y - 10,
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontFamily: "serif",
                background: isActive
                  ? "hsla(42, 60%, 50%, 0.3)"
                  : inLens && activeLens
                    ? "hsla(120, 40%, 50%, 0.12)"
                    : isHovered
                      ? "hsla(42, 50%, 50%, 0.15)"
                      : "transparent",
                color: isActive
                  ? "hsl(42, 80%, 68%)"
                  : inLens && activeLens
                    ? "hsl(120, 50%, 60%)"
                    : "hsl(42, 30%, 48%)",
                border: isActive
                  ? "1px solid hsla(42, 50%, 50%, 0.4)"
                  : inLens && activeLens
                    ? "1px solid hsla(120, 40%, 50%, 0.25)"
                    : "1px solid transparent",
                transform: isActive ? "scale(1.15)" : isHovered ? "scale(1.08)" : "scale(1)",
                cursor: "pointer",
              }}
              aria-label={m.poetry}
            >
              {m.label}
            </button>
          );
        })}

        {/* Center: current month / active lens indicator */}
        <div
          className="absolute flex flex-col items-center justify-center transition-all duration-700"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: activeLens
              ? "hsla(30, 20%, 10%, 0.9)"
              : "hsla(30, 20%, 10%, 0.8)",
            border: activeLens
              ? "1px solid hsl(var(--primary) / 0.3)"
              : "1px solid hsla(42, 30%, 35%, 0.3)",
          }}
        >
          {activeLens && lensConfig ? (
            <>
              <span className="text-sm">{lensConfig.emoji}</span>
              <span
                className="text-[7px] font-serif"
                style={{ color: "hsl(var(--primary))", opacity: 0.7 }}
              >
                active
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-serif" style={{ color: "hsl(42, 60%, 65%)" }}>
                {MONTHS.find(m => m.n === displayMonth)?.label}
              </span>
              {isToday && displayMonth === currentMonth && (
                <span className="text-[7px] font-serif" style={{ color: "hsl(42, 40%, 50%)", opacity: 0.6 }}>
                  now
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Season quick-select pills (below dial) */}
      <div className="flex gap-1 mt-0.5">
        {SEASON_ARCS.map(arc => {
          const cfg = LENS_CONFIGS[arc.key!];
          if (!cfg) return null;
          const isActive = activeLens === arc.key;
          return (
            <button
              key={arc.key}
              onClick={() => handleSeasonClick(arc.key)}
              className={`
                text-[7px] font-serif px-1.5 py-0.5 rounded-full transition-all duration-300
                ${isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground/40 hover:text-muted-foreground/70 border border-transparent hover:border-border/20"
                }
              `}
              title={cfg.label}
            >
              {cfg.emoji}
            </button>
          );
        })}
      </div>

      {/* Reset / deactivate */}
      <div className="flex gap-2">
        {currentMonth !== new Date().getMonth() + 1 && (
          <button
            onClick={() => onMonthChange(new Date().getMonth() + 1)}
            className="text-[8px] font-serif italic transition-opacity duration-500 text-muted-foreground/50 hover:text-muted-foreground/80"
          >
            return to today
          </button>
        )}
        {activeLens && (
          <button
            onClick={() => setLens(null)}
            className="text-[8px] font-serif italic transition-opacity duration-500 text-primary/60 hover:text-primary"
          >
            clear lens
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * BloomingClockDial — Seasonal Time Explorer
 * 
 * A circular month dial that lets users explore time.
 * "The user should feel like they are exploring time itself. Not applying a filter."
 */
import { useState, useCallback } from "react";
import { type CycleStage, STAGE_VISUALS } from "@/hooks/use-food-cycles";

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

/* Seasonal tint for the dial's ambient glow */
function seasonalTint(month: number): string {
  if (month >= 3 && month <= 5) return "hsla(120, 35%, 50%, 0.12)"; // spring greens
  if (month >= 6 && month <= 8) return "hsla(42, 60%, 55%, 0.12)";  // summer golds
  if (month >= 9 && month <= 11) return "hsla(25, 55%, 45%, 0.14)"; // autumn ambers
  return "hsla(220, 20%, 45%, 0.1)";                                 // winter blues
}

export default function BloomingClockDial({
  currentMonth,
  onMonthChange,
}: BloomingClockDialProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const displayMonth = hoveredMonth ?? currentMonth;
  const poetry = MONTHS.find(m => m.n === displayMonth)?.poetry || "";
  const isToday = currentMonth === new Date().getMonth() + 1;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Poetry label */}
      <div
        className="text-[9px] font-serif italic transition-all duration-700"
        style={{ color: "hsl(42, 45%, 58%)", opacity: 0.8 }}
      >
        {poetry}
      </div>

      {/* Dial ring */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: seasonalTint(displayMonth),
          transition: "background 1.2s ease-in-out",
        }}
      >
        {/* Month nodes */}
        {MONTHS.map(m => {
          const angle = ((m.n - 1) / 12) * 360 - 90; // start at top
          const rad = (angle * Math.PI) / 180;
          const r = 48;
          const x = 60 + r * Math.cos(rad);
          const y = 60 + r * Math.sin(rad);
          const isActive = m.n === currentMonth;
          const isHovered = m.n === hoveredMonth;

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
                  : isHovered
                    ? "hsla(42, 50%, 50%, 0.15)"
                    : "transparent",
                color: isActive
                  ? "hsl(42, 80%, 68%)"
                  : "hsl(42, 30%, 48%)",
                border: isActive
                  ? "1px solid hsla(42, 50%, 50%, 0.4)"
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

        {/* Center: current month indicator */}
        <div
          className="absolute flex flex-col items-center justify-center transition-all duration-700"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "hsla(30, 20%, 10%, 0.8)",
            border: "1px solid hsla(42, 30%, 35%, 0.3)",
          }}
        >
          <span className="text-xs font-serif" style={{ color: "hsl(42, 60%, 65%)" }}>
            {MONTHS.find(m => m.n === displayMonth)?.label}
          </span>
          {isToday && displayMonth === currentMonth && (
            <span className="text-[7px] font-serif" style={{ color: "hsl(42, 40%, 50%)", opacity: 0.6 }}>
              now
            </span>
          )}
        </div>
      </div>

      {/* Reset to today */}
      {currentMonth !== new Date().getMonth() + 1 && (
        <button
          onClick={() => onMonthChange(new Date().getMonth() + 1)}
          className="text-[8px] font-serif italic transition-opacity duration-500"
          style={{ color: "hsl(42, 40%, 52%)", opacity: 0.6 }}
        >
          return to today
        </button>
      )}
    </div>
  );
}

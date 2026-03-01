/**
 * BloomingClockSigils — Seasonal legend overlay
 *
 * A whisper-quiet corner indicator showing what's alive right now.
 * Not a legend panel. A breath.
 */
import { type CycleStage, STAGE_VISUALS } from "@/hooks/use-food-cycles";

interface BloomingClockSigilsProps {
  activeStages: CycleStage[];
  currentMonth: number;
  foodCount: number;
}

const MONTH_POETRY: Record<number, string> = {
  1: "Deep Winter", 2: "Late Winter", 3: "Early Spring",
  4: "Spring", 5: "Late Spring", 6: "Early Summer",
  7: "Midsummer", 8: "Late Summer", 9: "Early Autumn",
  10: "Autumn", 11: "Late Autumn", 12: "Early Winter",
};

const SIGIL_ORDER: CycleStage[] = ["flowering", "peak", "fruiting", "harvest", "dormant"];

export default function BloomingClockSigils({
  activeStages,
  currentMonth,
  foodCount,
}: BloomingClockSigilsProps) {
  if (activeStages.length === 0) return null;

  const orderedStages = SIGIL_ORDER.filter(s => activeStages.includes(s));
  const poetry = MONTH_POETRY[currentMonth] || "";

  return (
    <div
      className="absolute bottom-20 left-3 z-[600] flex flex-col gap-1 animate-fade-in"
      style={{
        pointerEvents: "none",
        maxWidth: 140,
      }}
    >
      {/* Season whisper */}
      <div
        className="text-[9px] font-serif italic mb-0.5"
        style={{ color: "hsl(42, 40%, 55%)", opacity: 0.7 }}
      >
        {poetry}
      </div>

      {/* Sigils */}
      {orderedStages.map(stage => {
        const v = STAGE_VISUALS[stage];
        return (
          <div
            key={stage}
            className="flex items-center gap-1.5"
            style={{ opacity: 0.7 }}
          >
            <span className="text-[11px]">{v.icon}</span>
            <span
              className="text-[8px] font-serif tracking-wide"
              style={{ color: v.color }}
            >
              {v.label}
            </span>
          </div>
        );
      })}

      {/* Count whisper */}
      {foodCount > 0 && (
        <div
          className="text-[7px] font-serif mt-1"
          style={{ color: "hsl(42, 25%, 45%)", opacity: 0.5 }}
        >
          {foodCount} cycle{foodCount !== 1 ? "s" : ""} active
        </div>
      )}
    </div>
  );
}

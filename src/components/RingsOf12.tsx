/**
 * RingsOf12 — Shared component for visit/milestone ring visualization.
 * Used by Tree Ledger (visit rings) and Staff Spiral (bead chains).
 * Each ring = 12 slots. Rings accumulate sequentially.
 */
import { memo, useMemo } from "react";

export interface RingSlot {
  filled: boolean;
  label?: string;
  date?: string;
  userId?: string;
  displayName?: string;
}

interface RingsOf12Props {
  slots: RingSlot[];
  size?: number;
  ringGap?: number;
  baseRadius?: number;
  filledColor?: string;
  emptyColor?: string;
  glowColor?: string;
  showProgress?: boolean;
  onSlotClick?: (index: number, slot: RingSlot) => void;
  onSlotHover?: (index: number | null, slot?: RingSlot) => void;
  className?: string;
}

const RingsOf12 = memo(({
  slots,
  size = 120,
  ringGap = 14,
  baseRadius = 18,
  filledColor = "hsl(var(--primary))",
  emptyColor = "hsl(var(--muted))",
  glowColor = "hsl(var(--primary) / 0.4)",
  showProgress = true,
  onSlotClick,
  onSlotHover,
  className = "",
}: RingsOf12Props) => {
  const rings = useMemo(() => {
    const result: RingSlot[][] = [];
    for (let i = 0; i < slots.length; i += 12) {
      result.push(slots.slice(i, i + 12));
    }
    // Always show at least the current incomplete ring
    if (result.length === 0) result.push([]);
    return result;
  }, [slots]);

  const totalFilled = slots.filter(s => s.filled).length;
  const currentRingIndex = Math.floor(totalFilled / 12);
  const currentRingProgress = totalFilled % 12;

  const center = size / 2;

  return (
    <div className={`relative inline-flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Render each ring */}
        {rings.map((ring, ringIdx) => {
          const radius = baseRadius + ringIdx * ringGap;
          const slotCount = 12;

          return (
            <g key={ringIdx}>
              {Array.from({ length: slotCount }).map((_, slotIdx) => {
                const globalIdx = ringIdx * 12 + slotIdx;
                const slot = slots[globalIdx] || { filled: false };
                const angle = (slotIdx / slotCount) * Math.PI * 2 - Math.PI / 2;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const dotRadius = 3 + ringIdx * 0.3;
                const isFilled = slot.filled;

                return (
                  <g key={slotIdx}>
                    {/* Glow for filled */}
                    {isFilled && (
                      <circle
                        cx={x}
                        cy={y}
                        r={dotRadius + 2}
                        fill="none"
                        stroke={glowColor}
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={dotRadius}
                      fill={isFilled ? filledColor : emptyColor}
                      opacity={isFilled ? 1 : 0.3}
                      className={`transition-all duration-300 ${onSlotClick ? "cursor-pointer" : ""}`}
                      onClick={() => onSlotClick?.(globalIdx, slot)}
                      onMouseEnter={() => onSlotHover?.(globalIdx, slot)}
                      onMouseLeave={() => onSlotHover?.(null)}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center count */}
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--foreground))"
          fontSize={Math.min(14, size / 8)}
          fontFamily="serif"
          fontWeight="bold"
        >
          {totalFilled}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--muted-foreground))"
          fontSize={Math.min(8, size / 16)}
          fontFamily="sans-serif"
        >
          visits
        </text>
      </svg>

      {showProgress && (
        <p className="text-[10px] text-muted-foreground font-mono">
          {currentRingProgress}/12 · Ring {currentRingIndex + 1}
        </p>
      )}
    </div>
  );
});

RingsOf12.displayName = "RingsOf12";

export default RingsOf12;

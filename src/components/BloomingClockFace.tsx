/**
 * BloomingClockFace — Horological Seasonal Complication
 *
 * Inspired by the Prague Astronomical Clock and haute horology.
 * Multi-layered SVG dial: outer month ring, seasonal phase ring,
 * food subdials, hemisphere indicator. The planet as a watch complication.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { type FoodCycle, type CycleStage, STAGE_VISUALS } from "@/hooks/use-food-cycles";

interface BloomingClockFaceProps {
  currentMonth: number;
  onMonthChange: (month: number) => void;
  stageFilter: CycleStage | "all";
  onStageChange: (stage: CycleStage | "all") => void;
  foods: FoodCycle[];
  selectedFoodIds: string[];
  onFoodToggle: (id: string) => void;
  onFoodClear: () => void;
}

/* ── Constants ── */
const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;

const MONTHS = [
  { n: 1, label: "I", full: "January", poetry: "Deep Winter" },
  { n: 2, label: "II", full: "February", poetry: "Late Winter" },
  { n: 3, label: "III", full: "March", poetry: "Early Spring" },
  { n: 4, label: "IV", full: "April", poetry: "Spring" },
  { n: 5, label: "V", full: "May", poetry: "Late Spring" },
  { n: 6, label: "VI", full: "June", poetry: "Early Summer" },
  { n: 7, label: "VII", full: "July", poetry: "Midsummer" },
  { n: 8, label: "VIII", full: "August", poetry: "Late Summer" },
  { n: 9, label: "IX", full: "September", poetry: "Early Autumn" },
  { n: 10, label: "X", full: "October", poetry: "Autumn" },
  { n: 11, label: "XI", full: "November", poetry: "Late Autumn" },
  { n: 12, label: "XII", full: "December", poetry: "Early Winter" },
];

const STAGES: { key: CycleStage; label: string; hue: number }[] = [
  { key: "flowering", label: "Flowering", hue: 340 },
  { key: "fruiting", label: "Fruiting", hue: 120 },
  { key: "harvest", label: "Harvest", hue: 35 },
  { key: "dormant", label: "Dormant", hue: 220 },
];

/* ── Helpers ── */
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(cx, cy, r, endAngle);
  const end = polarToXY(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getCurrentStageForFood(food: FoodCycle, month: number): CycleStage | null {
  if (food.peak_months.includes(month)) return "peak";
  if (food.harvest_months.includes(month)) return "harvest";
  if (food.fruiting_months.includes(month)) return "fruiting";
  if (food.flowering_months.includes(month)) return "flowering";
  if (food.dormant_months.includes(month)) return "dormant";
  return null;
}

/* ── Brass/enamel color palette ── */
const BRASS = "hsl(42, 55%, 52%)";
const BRASS_LIGHT = "hsl(42, 65%, 65%)";
const BRASS_DIM = "hsl(42, 30%, 35%)";
const BRASS_GLOW = "hsla(42, 70%, 55%, 0.4)";
const MIDNIGHT = "hsl(225, 25%, 8%)";
const MIDNIGHT_LIGHT = "hsl(225, 18%, 14%)";
const ENAMEL_GREEN = "hsl(150, 20%, 22%)";
const IVORY = "hsl(42, 40%, 82%)";

export default function BloomingClockFace({
  currentMonth,
  onMonthChange,
  stageFilter,
  onStageChange,
  foods,
  selectedFoodIds,
  onFoodToggle,
  onFoodClear,
}: BloomingClockFaceProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredStage, setHoveredStage] = useState<CycleStage | null>(null);
  const [hoveredFood, setHoveredFood] = useState<string | null>(null);
  const displayMonth = hoveredMonth ?? currentMonth;
  const poetry = MONTHS.find(m => m.n === displayMonth)?.poetry ?? "";
  const todayMonth = new Date().getMonth() + 1;

  // Selected or all foods for subdials (max 6 shown)
  const displayFoods = useMemo(() => {
    const list = selectedFoodIds.length > 0
      ? foods.filter(f => selectedFoodIds.includes(f.id))
      : foods;
    return list.slice(0, 6);
  }, [foods, selectedFoodIds]);

  // Month ring rotation angle (smooth sweep)
  const monthRotation = useMemo(() => {
    return -((currentMonth - 1) / 12) * 360;
  }, [currentMonth]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Poetry whisper */}
      <div
        className="text-[10px] font-serif italic tracking-wider"
        style={{
          color: BRASS_LIGHT,
          opacity: 0.75,
          transition: "all 0.8s ease",
          minHeight: 16,
        }}
      >
        {poetry}
      </div>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Brass gradient */}
          <radialGradient id="bc-brass-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(225, 20%, 12%)" />
            <stop offset="85%" stopColor="hsl(225, 25%, 7%)" />
            <stop offset="100%" stopColor="hsl(225, 30%, 5%)" />
          </radialGradient>
          {/* Gold glow filter */}
          <filter id="bc-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bc-glow-strong">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Engraved text shadow */}
          <filter id="bc-engrave">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.3" floodColor="hsla(0,0%,0%,0.5)" />
          </filter>
        </defs>

        {/* ═══ Background ═══ */}
        <circle cx={CX} cy={CY} r={SIZE / 2 - 1} fill="url(#bc-brass-bg)" />

        {/* ═══ Outer bezel ring ═══ */}
        <circle cx={CX} cy={CY} r={SIZE / 2 - 2} fill="none"
          stroke={BRASS_DIM} strokeWidth="2.5" opacity="0.6" />
        <circle cx={CX} cy={CY} r={SIZE / 2 - 6} fill="none"
          stroke={BRASS_DIM} strokeWidth="0.5" opacity="0.3" />

        {/* ═══ Hemisphere globe (behind everything) ═══ */}
        <g opacity="0.12">
          {/* Northern hemisphere */}
          <path
            d={describeArc(CX, CY, 42, 0, 180)}
            fill="none" stroke={BRASS} strokeWidth="0.5"
          />
          {/* Southern hemisphere (inverted tint) */}
          <path
            d={describeArc(CX, CY, 42, 180, 360)}
            fill="none" stroke="hsl(200, 25%, 50%)" strokeWidth="0.5"
          />
          {/* Equator */}
          <line x1={CX - 42} y1={CY} x2={CX + 42} y2={CY}
            stroke={BRASS_DIM} strokeWidth="0.3" />
          {/* Meridians */}
          <ellipse cx={CX} cy={CY} rx={20} ry={42}
            fill="none" stroke={BRASS_DIM} strokeWidth="0.2" />
          <ellipse cx={CX} cy={CY} rx={35} ry={42}
            fill="none" stroke={BRASS_DIM} strokeWidth="0.2" />
        </g>

        {/* ═══ SEASONAL PHASE RING (inner) ═══ */}
        <circle cx={CX} cy={CY} r={62} fill="none"
          stroke={BRASS_DIM} strokeWidth="0.5" opacity="0.4" />
        <circle cx={CX} cy={CY} r={82} fill="none"
          stroke={BRASS_DIM} strokeWidth="0.5" opacity="0.4" />

        {STAGES.map((s, i) => {
          const startAngle = i * 90;
          const endAngle = (i + 1) * 90;
          const midAngle = startAngle + 45;
          const isActive = stageFilter === s.key || stageFilter === "all";
          const isHovered = hoveredStage === s.key;
          const visual = STAGE_VISUALS[s.key];
          const labelPos = polarToXY(CX, CY, 72, midAngle);

          return (
            <g key={s.key}>
              {/* Arc segment */}
              <path
                d={describeArc(CX, CY, 72, startAngle, endAngle)}
                fill="none"
                stroke={isActive ? visual.color : BRASS_DIM}
                strokeWidth={isHovered ? 14 : 12}
                opacity={isActive ? (isHovered ? 0.35 : 0.2) : 0.06}
                style={{
                  cursor: "pointer",
                  transition: "all 0.6s ease",
                }}
                onClick={() => onStageChange(stageFilter === s.key ? "all" : s.key)}
                onMouseEnter={() => setHoveredStage(s.key)}
                onMouseLeave={() => setHoveredStage(null)}
              />
              {/* Stage label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontSize: "7px",
                  fontFamily: "serif",
                  fill: isActive ? visual.color : BRASS_DIM,
                  opacity: isActive ? 0.8 : 0.35,
                  cursor: "pointer",
                  transition: "all 0.5s ease",
                  letterSpacing: "0.06em",
                  pointerEvents: "none",
                }}
              >
                {visual.icon}
              </text>
            </g>
          );
        })}

        {/* ═══ MONTH RING (outer) ═══ */}
        <g style={{
          transform: `rotate(${monthRotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: "transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}>
          {MONTHS.map(m => {
            const angle = ((m.n - 1) / 12) * 360;
            const tickStart = polarToXY(CX, CY, SIZE / 2 - 8, angle);
            const tickEnd = polarToXY(CX, CY, SIZE / 2 - 18, angle);
            const labelPos = polarToXY(CX, CY, SIZE / 2 - 26, angle);
            const isActive = m.n === currentMonth;
            const isHovered = m.n === hoveredMonth;
            const isToday = m.n === todayMonth;

            // Minor ticks between months
            const minorTicks = [1, 2, 3].map(t => {
              const minorAngle = angle + (t / 4) * 30;
              const ms = polarToXY(CX, CY, SIZE / 2 - 8, minorAngle);
              const me = polarToXY(CX, CY, SIZE / 2 - 13, minorAngle);
              return (
                <line key={t} x1={ms.x} y1={ms.y} x2={me.x} y2={me.y}
                  stroke={BRASS_DIM} strokeWidth="0.3" opacity="0.3" />
              );
            });

            return (
              <g key={m.n}>
                {minorTicks}
                {/* Major tick */}
                <line
                  x1={tickStart.x} y1={tickStart.y}
                  x2={tickEnd.x} y2={tickEnd.y}
                  stroke={isActive ? BRASS_LIGHT : BRASS_DIM}
                  strokeWidth={isActive ? 1.2 : 0.6}
                  opacity={isActive ? 0.9 : 0.5}
                />
                {/* Month numeral */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  filter={isActive ? "url(#bc-glow)" : undefined}
                  style={{
                    fontSize: isActive ? "9px" : "7.5px",
                    fontFamily: "serif",
                    fontWeight: isActive ? 600 : 400,
                    fill: isActive ? BRASS_LIGHT : isHovered ? BRASS : BRASS_DIM,
                    cursor: "pointer",
                    transition: "all 0.5s ease",
                    letterSpacing: "0.05em",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMonthChange(m.n);
                  }}
                  onMouseEnter={() => setHoveredMonth(m.n)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {m.label}
                </text>
                {/* Today marker */}
                {isToday && (
                  <circle
                    cx={polarToXY(CX, CY, SIZE / 2 - 35, angle).x}
                    cy={polarToXY(CX, CY, SIZE / 2 - 35, angle).y}
                    r={1.5}
                    fill={BRASS_LIGHT}
                    opacity={0.7}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* ═══ FOOD SUBDIALS (complications) ═══ */}
        {displayFoods.length > 0 && (
          <g>
            {displayFoods.map((food, i) => {
              const count = displayFoods.length;
              // Arrange subdials in inner circle
              const angle = (i / Math.max(count, 1)) * 360;
              const subdialR = count <= 3 ? 28 : count <= 4 ? 24 : 20;
              const orbitR = count <= 1 ? 0 : count <= 3 ? 30 : count <= 5 ? 34 : 36;
              const pos = count <= 1
                ? { x: CX, y: CY }
                : polarToXY(CX, CY, orbitR, angle);

              const stage = getCurrentStageForFood(food, displayMonth);
              const visual = stage ? STAGE_VISUALS[stage] : null;
              const isSelected = selectedFoodIds.includes(food.id);
              const isFoodHovered = hoveredFood === food.id;
              const isPeak = food.peak_months.includes(displayMonth);

              // Stage arc on subdial
              const stageArcs = (() => {
                const arcs: JSX.Element[] = [];
                const stageData: { months: number[]; stage: CycleStage }[] = [
                  { months: food.flowering_months, stage: "flowering" },
                  { months: food.fruiting_months, stage: "fruiting" },
                  { months: food.harvest_months, stage: "harvest" },
                  { months: food.dormant_months, stage: "dormant" },
                  { months: food.peak_months, stage: "peak" },
                ];

                stageData.forEach(({ months, stage: s }) => {
                  if (months.length === 0) return;
                  const sv = STAGE_VISUALS[s];
                  months.forEach(m => {
                    const mAngle = ((m - 1) / 12) * 360;
                    const mEnd = mAngle + 28;
                    arcs.push(
                      <path
                        key={`${s}-${m}`}
                        d={describeArc(pos.x, pos.y, subdialR - 3, mAngle, mEnd)}
                        fill="none"
                        stroke={sv.color}
                        strokeWidth="2.5"
                        opacity={0.25}
                      />
                    );
                  });
                });
                return arcs;
              })();

              return (
                <g key={food.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onFoodToggle(food.id)}
                  onMouseEnter={() => setHoveredFood(food.id)}
                  onMouseLeave={() => setHoveredFood(null)}
                >
                  {/* Subdial background */}
                  <circle
                    cx={pos.x} cy={pos.y} r={subdialR}
                    fill={MIDNIGHT_LIGHT}
                    stroke={isSelected ? BRASS : BRASS_DIM}
                    strokeWidth={isSelected ? 1 : 0.5}
                    opacity={isFoodHovered ? 0.95 : 0.85}
                    style={{ transition: "all 0.5s ease" }}
                  />

                  {/* Stage arcs around subdial */}
                  {stageArcs}

                  {/* Current month indicator on subdial */}
                  {(() => {
                    const handAngle = ((displayMonth - 1) / 12) * 360;
                    const handEnd = polarToXY(pos.x, pos.y, subdialR - 6, handAngle);
                    return (
                      <line
                        x1={pos.x} y1={pos.y}
                        x2={handEnd.x} y2={handEnd.y}
                        stroke={BRASS_LIGHT}
                        strokeWidth="0.8"
                        opacity={0.6}
                        strokeLinecap="round"
                      />
                    );
                  })()}

                  {/* Food icon */}
                  <text
                    x={pos.x} y={pos.y - 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: count <= 3 ? "14px" : "11px", pointerEvents: "none" }}
                    filter={isPeak ? "url(#bc-glow-strong)" : undefined}
                  >
                    {food.icon}
                  </text>

                  {/* Stage label */}
                  {stage && visual && (
                    <text
                      x={pos.x} y={pos.y + (count <= 3 ? 12 : 9)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontSize: "5px",
                        fontFamily: "serif",
                        fill: visual.color,
                        opacity: 0.7,
                        letterSpacing: "0.08em",
                        pointerEvents: "none",
                      }}
                    >
                      {visual.label}
                    </text>
                  )}

                  {/* Peak indicator */}
                  {isPeak && (
                    <circle
                      cx={pos.x + subdialR - 5}
                      cy={pos.y - subdialR + 5}
                      r={2.5}
                      fill="hsl(42, 75%, 55%)"
                      opacity={0.8}
                      filter="url(#bc-glow)"
                    />
                  )}

                  {/* Hemisphere hint */}
                  <text
                    x={pos.x} y={pos.y + (count <= 3 ? 18 : 14)}
                    textAnchor="middle"
                    style={{
                      fontSize: "4px",
                      fontFamily: "serif",
                      fill: BRASS_DIM,
                      opacity: 0.4,
                      pointerEvents: "none",
                    }}
                  >
                    {food.hemisphere === "both" ? "N+S" : food.hemisphere === "northern" ? "N" : "S"}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ═══ Center jewel ═══ */}
        <circle cx={CX} cy={CY} r={count1Center(displayFoods.length)}
          fill={MIDNIGHT}
          stroke={BRASS_DIM}
          strokeWidth="0.8"
          opacity="0.9"
        />
        {displayFoods.length === 0 && (
          <>
            <text
              x={CX} y={CY - 4}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "10px", fontFamily: "serif", fill: BRASS_LIGHT, opacity: 0.8 }}
            >
              🌸
            </text>
            <text
              x={CX} y={CY + 8}
              textAnchor="middle"
              style={{ fontSize: "5.5px", fontFamily: "serif", fill: BRASS_DIM, opacity: 0.6, letterSpacing: "0.1em" }}
            >
              BLOOMING
            </text>
            <text
              x={CX} y={CY + 15}
              textAnchor="middle"
              style={{ fontSize: "5.5px", fontFamily: "serif", fill: BRASS_DIM, opacity: 0.6, letterSpacing: "0.1em" }}
            >
              CLOCK
            </text>
          </>
        )}

        {/* ═══ Current month hand ═══ */}
        {(() => {
          const handAngle = ((currentMonth - 1) / 12) * 360;
          const handTip = polarToXY(CX, CY, SIZE / 2 - 18, handAngle);
          const handBase1 = polarToXY(CX, CY, 8, handAngle - 8);
          const handBase2 = polarToXY(CX, CY, 8, handAngle + 8);
          return (
            <g style={{
              transition: "all 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}>
              <polygon
                points={`${handTip.x},${handTip.y} ${handBase1.x},${handBase1.y} ${handBase2.x},${handBase2.y}`}
                fill={BRASS_LIGHT}
                opacity={0.5}
                filter="url(#bc-glow)"
              />
              {/* Center cap */}
              <circle cx={CX} cy={CY} r={3}
                fill={BRASS}
                stroke={BRASS_LIGHT}
                strokeWidth="0.5"
              />
            </g>
          );
        })()}

      </svg>

      {/* Return to today */}
      {currentMonth !== todayMonth && (
        <button
          onClick={() => onMonthChange(todayMonth)}
          className="text-[8px] font-serif italic tracking-wide"
          style={{ color: BRASS_DIM, opacity: 0.55, transition: "opacity 0.5s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
        >
          return to today
        </button>
      )}

      {/* Food pills (below clock for selection) */}
      <div className="flex flex-wrap gap-1 justify-center max-w-[260px] mt-1">
        <button
          onClick={onFoodClear}
          className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
          style={{
            background: selectedFoodIds.length === 0 ? "hsla(42, 40%, 40%, 0.25)" : "transparent",
            color: selectedFoodIds.length === 0 ? BRASS_LIGHT : BRASS_DIM,
            border: selectedFoodIds.length === 0 ? `1px solid hsla(42, 40%, 45%, 0.3)` : "1px solid transparent",
            transition: "all 0.5s ease",
          }}
        >
          All Foods
        </button>
        {foods.map(f => (
          <button
            key={f.id}
            onClick={() => onFoodToggle(f.id)}
            className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
            style={{
              background: selectedFoodIds.includes(f.id) ? "hsla(42, 40%, 35%, 0.25)" : "transparent",
              color: selectedFoodIds.includes(f.id) ? BRASS_LIGHT : BRASS_DIM,
              border: selectedFoodIds.includes(f.id) ? `1px solid hsla(42, 40%, 45%, 0.3)` : "1px solid transparent",
              transition: "all 0.5s ease",
            }}
          >
            {f.icon} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Center jewel size adapts to number of subdials */
function count1Center(count: number): number {
  if (count === 0) return 22;
  if (count === 1) return 6;
  return 8;
}

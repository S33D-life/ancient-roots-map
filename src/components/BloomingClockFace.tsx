/**
 * BloomingClockFace — Horological Seasonal Complication
 *
 * Inspired by the Prague Astronomical Clock and haute horology.
 * Multi-layered SVG dial with globe, brass rings, food subdials,
 * stage labels, and a title cartouche.
 *
 * "The planet becomes a watch complication."
 */
import { useState, useMemo } from "react";
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

/* ── Layout ── */
const W = 300;
const H = 330;
const CX = W / 2;
const CY = 155;
const OUTER_R = 130;
const BEZEL_R = 126;
const MONTH_R = 116;
const TICK_OUTER = 122;
const TICK_INNER = 110;
const STAGE_R = 88;
const GLOBE_R = 68;
const SUBDIAL_R = 28;

/* ── Palette ── */
const P = {
  brass:      "hsl(42, 55%, 52%)",
  brassLight: "hsl(42, 65%, 68%)",
  brassDim:   "hsl(42, 28%, 32%)",
  brassGlow:  "hsla(42, 70%, 58%, 0.35)",
  midnight:   "hsl(225, 28%, 7%)",
  midnightL:  "hsl(225, 20%, 12%)",
  enamel:     "hsl(152, 18%, 16%)",
  enamelD:    "hsl(152, 15%, 11%)",
  ivory:      "hsl(42, 35%, 82%)",
  globeSea:   "hsl(200, 30%, 15%)",
  globeLand:  "hsl(140, 20%, 22%)",
};

const MONTHS = [
  { n:1,  l:"I",    f:"January" },
  { n:2,  l:"II",   f:"February" },
  { n:3,  l:"III",  f:"March" },
  { n:4,  l:"IV",   f:"April" },
  { n:5,  l:"V",    f:"May" },
  { n:6,  l:"VI",   f:"June" },
  { n:7,  l:"VII",  f:"July" },
  { n:8,  l:"VIII", f:"August" },
  { n:9,  l:"IX",   f:"September" },
  { n:10, l:"X",    f:"October" },
  { n:11, l:"XI",   f:"November" },
  { n:12, l:"XII",  f:"December" },
];

const POETRY: Record<number,string> = {
  1:"Deep Winter", 2:"Late Winter", 3:"Early Spring", 4:"Spring",
  5:"Late Spring", 6:"Early Summer", 7:"Midsummer", 8:"Late Summer",
  9:"Early Autumn", 10:"Autumn", 11:"Late Autumn", 12:"Early Winter",
};

const STAGES: { key: CycleStage; arc: [number,number] }[] = [
  { key: "flowering", arc: [225, 315] },
  { key: "fruiting",  arc: [315, 45]  },
  { key: "harvest",   arc: [45, 135]  },
  { key: "dormant",   arc: [135, 225] },
];

/* ── Helpers ── */
function pol(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, a1: number, a2: number) {
  // Normalize angles for correct sweep
  let sweep = a2 - a1;
  if (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  const s = pol(cx, cy, r, a1);
  const e = pol(cx, cy, r, a2);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function foodStage(food: FoodCycle, month: number): CycleStage | null {
  if (food.peak_months.includes(month)) return "peak";
  if (food.harvest_months.includes(month)) return "harvest";
  if (food.fruiting_months.includes(month)) return "fruiting";
  if (food.flowering_months.includes(month)) return "flowering";
  if (food.dormant_months.includes(month)) return "dormant";
  return null;
}

export default function BloomingClockFace({
  currentMonth, onMonthChange, stageFilter, onStageChange,
  foods, selectedFoodIds, onFoodToggle, onFoodClear,
}: BloomingClockFaceProps) {
  const [hMonth, setHMonth] = useState<number|null>(null);
  const [hStage, setHStage] = useState<CycleStage|null>(null);
  const dm = hMonth ?? currentMonth;
  const today = new Date().getMonth() + 1;

  // Subdial foods (left and right)
  const subdialFoods = useMemo(() => {
    const list = selectedFoodIds.length > 0
      ? foods.filter(f => selectedFoodIds.includes(f.id))
      : foods.slice(0, 2);
    return list.slice(0, 2);
  }, [foods, selectedFoodIds]);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          {/* Backgrounds */}
          <radialGradient id="bcf-bg" cx="50%" cy="47%" r="50%">
            <stop offset="0%" stopColor="hsl(200, 20%, 12%)" />
            <stop offset="60%" stopColor={P.midnight} />
            <stop offset="100%" stopColor="hsl(225, 35%, 4%)" />
          </radialGradient>
          <radialGradient id="bcf-globe" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor={P.globeLand} />
            <stop offset="40%" stopColor={P.globeSea} />
            <stop offset="100%" stopColor="hsl(210, 25%, 8%)" />
          </radialGradient>
          <radialGradient id="bcf-brass-ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(42, 50%, 45%)" />
            <stop offset="50%" stopColor="hsl(42, 55%, 38%)" />
            <stop offset="100%" stopColor="hsl(42, 40%, 28%)" />
          </radialGradient>
          <radialGradient id="bcf-subdial" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(42, 35%, 30%)" />
            <stop offset="100%" stopColor="hsl(42, 25%, 18%)" />
          </radialGradient>
          <linearGradient id="bcf-enamel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.enamel} />
            <stop offset="100%" stopColor={P.enamelD} />
          </linearGradient>
          {/* Glow filters */}
          <filter id="bcf-g1"><feGaussianBlur stdDeviation="1.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bcf-g2"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bcf-g3"><feGaussianBlur stdDeviation="5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          {/* Subtle inner shadow */}
          <filter id="bcf-inset">
            <feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0" /></feComponentTransfer>
            <feGaussianBlur stdDeviation="3" />
            <feOffset dx="0" dy="1" result="shadow" />
            <feComposite in="shadow" in2="SourceGraphic" operator="atop" />
          </filter>
        </defs>

        {/* ═══ OUTER BEZEL ═══ */}
        <circle cx={CX} cy={CY} r={OUTER_R + 4} fill="none" stroke="hsl(42, 40%, 25%)" strokeWidth="3" />
        <circle cx={CX} cy={CY} r={OUTER_R + 1.5} fill="none" stroke="url(#bcf-brass-ring)" strokeWidth="5" opacity="0.8" />
        <circle cx={CX} cy={CY} r={OUTER_R - 1} fill="none" stroke="hsl(42, 50%, 35%)" strokeWidth="0.5" opacity="0.6" />

        {/* ═══ MAIN FACE BACKGROUND ═══ */}
        <circle cx={CX} cy={CY} r={BEZEL_R} fill="url(#bcf-bg)" />

        {/* ═══ GLOBE (behind everything) ═══ */}
        <g opacity="0.2">
          <circle cx={CX} cy={CY} r={GLOBE_R} fill="url(#bcf-globe)" />
          {/* Landmasses (simplified) */}
          {/* Europe/Africa */}
          <ellipse cx={CX + 8} cy={CY - 12} rx={12} ry={22} fill={P.globeLand} opacity="0.5" />
          {/* Americas */}
          <ellipse cx={CX - 28} cy={CY - 5} rx={10} ry={28} fill={P.globeLand} opacity="0.4" transform={`rotate(-10 ${CX - 28} ${CY - 5})`} />
          {/* Asia */}
          <ellipse cx={CX + 30} cy={CY - 15} rx={18} ry={14} fill={P.globeLand} opacity="0.35" />
          {/* Australia */}
          <ellipse cx={CX + 35} cy={CY + 18} rx={8} ry={6} fill={P.globeLand} opacity="0.3" />
          {/* Grid lines */}
          <line x1={CX - GLOBE_R} y1={CY} x2={CX + GLOBE_R} y2={CY} stroke={P.brassDim} strokeWidth="0.3" />
          <ellipse cx={CX} cy={CY} rx={GLOBE_R * 0.5} ry={GLOBE_R} fill="none" stroke={P.brassDim} strokeWidth="0.2" />
          <ellipse cx={CX} cy={CY} rx={GLOBE_R * 0.8} ry={GLOBE_R} fill="none" stroke={P.brassDim} strokeWidth="0.2" />
          {/* Tropics */}
          <line x1={CX - GLOBE_R} y1={CY - 16} x2={CX + GLOBE_R} y2={CY - 16} stroke={P.brassDim} strokeWidth="0.2" opacity="0.5" />
          <line x1={CX - GLOBE_R} y1={CY + 16} x2={CX + GLOBE_R} y2={CY + 16} stroke={P.brassDim} strokeWidth="0.2" opacity="0.5" />
        </g>

        {/* ═══ ENAMEL SEASONAL RING ═══ */}
        <circle cx={CX} cy={CY} r={STAGE_R + 8} fill="none" stroke={P.brassDim} strokeWidth="0.5" opacity="0.5" />
        <circle cx={CX} cy={CY} r={STAGE_R - 8} fill="none" stroke={P.brassDim} strokeWidth="0.5" opacity="0.5" />

        {STAGES.map(s => {
          const v = STAGE_VISUALS[s.key];
          const isActive = stageFilter === s.key || stageFilter === "all";
          const isHovered = hStage === s.key;
          const midAngle = s.arc[0] + ((s.arc[1] - s.arc[0] + 360) % 360) / 2;
          const labelPos = pol(CX, CY, STAGE_R, (s.arc[0] + ((s.arc[1] - s.arc[0] + 360) % 360) / 2) % 360);

          return (
            <g key={s.key}>
              {/* Enamel arc */}
              <path
                d={arc(CX, CY, STAGE_R, s.arc[0], s.arc[1])}
                fill="none"
                stroke={isActive ? v.color : P.brassDim}
                strokeWidth={isHovered ? 16 : 14}
                opacity={isActive ? (isHovered ? 0.3 : 0.18) : 0.06}
                strokeLinecap="butt"
                style={{ cursor: "pointer", transition: "all 0.6s ease" }}
                onClick={() => onStageChange(stageFilter === s.key ? "all" : s.key)}
                onMouseEnter={() => setHStage(s.key)}
                onMouseLeave={() => setHStage(null)}
              />
              {/* Stage label — serif engraved */}
              <text
                x={labelPos.x}
                y={labelPos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontSize: "7px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: "italic",
                  fill: isActive ? v.color : P.brassDim,
                  opacity: isActive ? 0.85 : 0.3,
                  letterSpacing: "0.08em",
                  pointerEvents: "none",
                  transition: "all 0.5s ease",
                }}
              >
                {v.label}
              </text>
            </g>
          );
        })}

        {/* ═══ MONTH RING — Roman numerals + ticks ═══ */}
        {MONTHS.map(m => {
          const angle = ((m.n - 1) / 12) * 360;
          const tO = pol(CX, CY, TICK_OUTER, angle);
          const tI = pol(CX, CY, TICK_INNER, angle);
          const lP = pol(CX, CY, MONTH_R - 2, angle);
          const isActive = m.n === currentMonth;
          const isHov = m.n === hMonth;
          const isNow = m.n === today;

          // Minor ticks
          const minors = [1, 2, 3].map(t => {
            const a = angle + (t / 4) * 30;
            const s = pol(CX, CY, TICK_OUTER, a);
            const e = pol(CX, CY, TICK_OUTER - 4, a);
            return <line key={t} x1={s.x} y1={s.y} x2={e.x} y2={e.y}
              stroke={P.brassDim} strokeWidth="0.4" opacity="0.35" />;
          });

          return (
            <g key={m.n} style={{ cursor: "pointer" }}
              onClick={() => onMonthChange(m.n)}
              onMouseEnter={() => setHMonth(m.n)}
              onMouseLeave={() => setHMonth(null)}>
              {minors}
              {/* Major tick */}
              <line x1={tO.x} y1={tO.y} x2={tI.x} y2={tI.y}
                stroke={isActive ? P.brassLight : P.brass}
                strokeWidth={isActive ? 1.5 : 0.8}
                opacity={isActive ? 0.9 : 0.5}
              />
              {/* Numeral */}
              <text
                x={lP.x} y={lP.y}
                textAnchor="middle" dominantBaseline="central"
                filter={isActive ? "url(#bcf-g1)" : undefined}
                style={{
                  fontSize: isActive ? "10px" : "8px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontWeight: isActive ? 700 : 400,
                  fill: isActive ? P.brassLight : isHov ? P.brass : P.brassDim,
                  transition: "all 0.5s ease",
                  letterSpacing: "0.04em",
                }}
              >
                {m.l}
              </text>
              {/* Today dot */}
              {isNow && !isActive && (
                <circle cx={pol(CX, CY, MONTH_R - 12, angle).x}
                  cy={pol(CX, CY, MONTH_R - 12, angle).y}
                  r={1.5} fill={P.brassLight} opacity="0.6" />
              )}
            </g>
          );
        })}

        {/* ═══ FOOD SUBDIALS (left + right) ═══ */}
        {subdialFoods.map((food, i) => {
          const side = i === 0 ? -1 : 1;
          const sx = CX + side * 42;
          const sy = CY;
          const stage = foodStage(food, dm);
          const visual = stage ? STAGE_VISUALS[stage] : null;
          const isPeak = food.peak_months.includes(dm);
          const isSelected = selectedFoodIds.includes(food.id);

          // Build stage arcs on subdial
          const stageArcs: JSX.Element[] = [];
          const stageData: { months: number[]; st: CycleStage }[] = [
            { months: food.flowering_months, st: "flowering" },
            { months: food.fruiting_months, st: "fruiting" },
            { months: food.harvest_months, st: "harvest" },
            { months: food.dormant_months, st: "dormant" },
            { months: food.peak_months, st: "peak" },
          ];
          stageData.forEach(({ months, st }) => {
            months.forEach(m => {
              const a1 = ((m - 1) / 12) * 360;
              const a2 = a1 + 28;
              stageArcs.push(
                <path key={`${st}-${m}`}
                  d={arc(sx, sy, SUBDIAL_R - 2, a1, a2)}
                  fill="none" stroke={STAGE_VISUALS[st].color}
                  strokeWidth="2.5" opacity="0.3" strokeLinecap="butt" />
              );
            });
          });

          // Month hand on subdial
          const handAngle = ((dm - 1) / 12) * 360;
          const handTip = pol(sx, sy, SUBDIAL_R - 5, handAngle);

          return (
            <g key={food.id} style={{ cursor: "pointer" }}
              onClick={() => onFoodToggle(food.id)}>
              {/* Food name label above subdial */}
              <text x={sx} y={sy - SUBDIAL_R - 8}
                textAnchor="middle"
                style={{
                  fontSize: "7px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fill: isSelected ? P.brassLight : P.brass,
                  opacity: 0.8,
                  letterSpacing: "0.06em",
                  fontStyle: "italic",
                }}>
                {food.name}
              </text>

              {/* Subdial bezel */}
              <circle cx={sx} cy={sy} r={SUBDIAL_R + 2}
                fill="none" stroke={P.brass} strokeWidth="1.5" opacity="0.5" />
              <circle cx={sx} cy={sy} r={SUBDIAL_R}
                fill="url(#bcf-subdial)"
                stroke={isSelected ? P.brassLight : P.brassDim}
                strokeWidth={isSelected ? 1 : 0.5}
              />

              {/* Stage arcs */}
              {stageArcs}

              {/* Subdial tick marks */}
              {[0, 90, 180, 270].map(a => {
                const t1 = pol(sx, sy, SUBDIAL_R, a);
                const t2 = pol(sx, sy, SUBDIAL_R - 3, a);
                return <line key={a} x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y}
                  stroke={P.brass} strokeWidth="0.5" opacity="0.4" />;
              })}

              {/* Month hand */}
              <line x1={sx} y1={sy} x2={handTip.x} y2={handTip.y}
                stroke={P.brassLight} strokeWidth="0.8" opacity="0.7"
                strokeLinecap="round" />

              {/* Center food icon */}
              <text x={sx} y={sy + 1}
                textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: "16px", pointerEvents: "none" }}
                filter={isPeak ? "url(#bcf-g2)" : undefined}>
                {food.icon}
              </text>

              {/* Hub */}
              <circle cx={sx} cy={sy} r={2}
                fill={P.brass} stroke={P.brassLight} strokeWidth="0.3" />

              {/* Stage label below */}
              {visual && (
                <text x={sx} y={sy + SUBDIAL_R + 10}
                  textAnchor="middle"
                  style={{
                    fontSize: "6px",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fill: visual.color,
                    opacity: 0.7,
                    letterSpacing: "0.08em",
                    fontStyle: "italic",
                    pointerEvents: "none",
                  }}>
                  {visual.label}{isPeak ? " ✦" : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* ═══ MAIN HANDS ═══ */}
        {(() => {
          const handAngle = ((currentMonth - 1) / 12) * 360;
          const tip = pol(CX, CY, TICK_INNER - 2, handAngle);
          const tail = pol(CX, CY, 12, handAngle + 180);
          const b1 = pol(CX, CY, 6, handAngle - 12);
          const b2 = pol(CX, CY, 6, handAngle + 12);

          return (
            <g>
              {/* Hand shadow */}
              <line x1={tail.x + 0.5} y1={tail.y + 0.5} x2={tip.x + 0.5} y2={tip.y + 0.5}
                stroke="hsla(0,0%,0%,0.3)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Main hand */}
              <polygon
                points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${tail.x},${tail.y} ${b2.x},${b2.y}`}
                fill={P.brassLight}
                opacity="0.75"
                filter="url(#bcf-g1)"
                style={{ transition: "all 1s cubic-bezier(0.25,0.1,0.25,1)" }}
              />
              {/* Hub */}
              <circle cx={CX} cy={CY} r={5}
                fill={P.brass} stroke={P.brassLight} strokeWidth="0.8" />
              <circle cx={CX} cy={CY} r={2}
                fill={P.brassLight} />
            </g>
          );
        })()}

        {/* ═══ Scattered blossoms (decorative, subtle) ═══ */}
        {[
          { x: CX - 90, y: CY - 95, o: 0.15, s: 9 },
          { x: CX + 85, y: CY - 80, o: 0.12, s: 8 },
          { x: CX + 100, y: CY + 60, o: 0.1, s: 7 },
          { x: CX - 95, y: CY + 70, o: 0.13, s: 8 },
          { x: CX - 40, y: CY - 115, o: 0.1, s: 7 },
          { x: CX + 50, y: CY - 110, o: 0.08, s: 6 },
        ].map((b, i) => (
          <text key={i} x={b.x} y={b.y}
            style={{ fontSize: `${b.s}px`, opacity: b.o, pointerEvents: "none" }}>
            {i % 2 === 0 ? "🌸" : "✿"}
          </text>
        ))}

        {/* ═══ TITLE CARTOUCHE ═══ */}
        <g>
          {/* Cartouche background */}
          <rect x={CX - 65} y={CY + OUTER_R + 10} width={130} height={22}
            rx={4} ry={4}
            fill={P.enamelD}
            stroke={P.brassDim}
            strokeWidth="0.8"
            opacity="0.9"
          />
          {/* Decorative lines */}
          <line x1={CX - 58} y1={CY + OUTER_R + 12} x2={CX + 58} y2={CY + OUTER_R + 12}
            stroke={P.brassDim} strokeWidth="0.3" opacity="0.4" />
          <line x1={CX - 58} y1={CY + OUTER_R + 30} x2={CX + 58} y2={CY + OUTER_R + 30}
            stroke={P.brassDim} strokeWidth="0.3" opacity="0.4" />
          {/* Title text */}
          <text x={CX} y={CY + OUTER_R + 19}
            textAnchor="middle"
            style={{
              fontSize: "8px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fill: P.brassLight,
              letterSpacing: "0.2em",
              fontWeight: 600,
            }}>
            BLOOMING CLOCK
          </text>
          <text x={CX} y={CY + OUTER_R + 27}
            textAnchor="middle"
            style={{
              fontSize: "5px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fill: P.brassDim,
              letterSpacing: "0.15em",
              fontStyle: "italic",
            }}>
            {POETRY[dm]}
          </text>
        </g>

      </svg>

      {/* Return to today */}
      {currentMonth !== today && (
        <button
          onClick={() => onMonthChange(today)}
          className="text-[8px] font-serif italic tracking-wider mt-1"
          style={{ color: P.brassDim, opacity: 0.5, transition: "opacity 0.5s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
        >
          return to today
        </button>
      )}

      {/* Food selector pills */}
      <div className="flex flex-wrap gap-1 justify-center max-w-[280px] mt-2">
        <button
          onClick={onFoodClear}
          className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
          style={{
            background: selectedFoodIds.length === 0 ? "hsla(42, 35%, 35%, 0.25)" : "transparent",
            color: selectedFoodIds.length === 0 ? P.brassLight : P.brassDim,
            border: selectedFoodIds.length === 0 ? "1px solid hsla(42, 35%, 40%, 0.3)" : "1px solid transparent",
            transition: "all 0.5s ease",
          }}
        >
          All
        </button>
        {foods.map(f => (
          <button
            key={f.id}
            onClick={() => onFoodToggle(f.id)}
            className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
            style={{
              background: selectedFoodIds.includes(f.id) ? "hsla(42, 35%, 35%, 0.25)" : "transparent",
              color: selectedFoodIds.includes(f.id) ? P.brassLight : P.brassDim,
              border: selectedFoodIds.includes(f.id) ? "1px solid hsla(42, 35%, 40%, 0.3)" : "1px solid transparent",
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

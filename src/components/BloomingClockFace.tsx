/**
 * BloomingClockFace — Horological Seasonal Complication
 *
 * Inspired by the Prague Astronomical Clock and haute horology.
 * Multi-layered SVG dial with globe, brass rings, food subdials,
 * stage labels, title cartouche, rotating tourbillon, escapement
 * chime, and retrograde subdial hands.
 *
 * "The planet becomes a watch complication."
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
const W = 300, H = 330, CX = W / 2, CY = 155;
const OUTER_R = 130, BEZEL_R = 126, MONTH_R = 116;
const TICK_OUTER = 122, TICK_INNER = 110, STAGE_R = 88;
const GLOBE_R = 68, SUBDIAL_R = 28;

/* ── Palette ── */
const P = {
  brass: "hsl(42, 55%, 52%)", brassLight: "hsl(42, 65%, 68%)",
  brassDim: "hsl(42, 28%, 32%)", brassGlow: "hsla(42, 70%, 58%, 0.35)",
  midnight: "hsl(225, 28%, 7%)", midnightL: "hsl(225, 20%, 12%)",
  enamel: "hsl(152, 18%, 16%)", enamelD: "hsl(152, 15%, 11%)",
  ivory: "hsl(42, 35%, 82%)", globeSea: "hsl(200, 30%, 15%)",
  globeLand: "hsl(140, 20%, 22%)",
};

const MONTHS = [
  { n:1,l:"I",f:"January" },{ n:2,l:"II",f:"February" },{ n:3,l:"III",f:"March" },
  { n:4,l:"IV",f:"April" },{ n:5,l:"V",f:"May" },{ n:6,l:"VI",f:"June" },
  { n:7,l:"VII",f:"July" },{ n:8,l:"VIII",f:"August" },{ n:9,l:"IX",f:"September" },
  { n:10,l:"X",f:"October" },{ n:11,l:"XI",f:"November" },{ n:12,l:"XII",f:"December" },
];

const POETRY: Record<number,string> = {
  1:"Deep Winter",2:"Late Winter",3:"Early Spring",4:"Spring",
  5:"Late Spring",6:"Early Summer",7:"Midsummer",8:"Late Summer",
  9:"Early Autumn",10:"Autumn",11:"Late Autumn",12:"Early Winter",
};

const STAGES: { key: CycleStage; arc: [number,number] }[] = [
  { key:"flowering", arc:[225,315] }, { key:"fruiting", arc:[315,45] },
  { key:"harvest", arc:[45,135] }, { key:"dormant", arc:[135,225] },
];

/* ── Helpers ── */
function pol(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  let sweep = a2 - a1; if (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  const s = pol(cx, cy, r, a1), e = pol(cx, cy, r, a2);
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

/* ── Retrograde logic ── */
function getActiveMonthRange(food: FoodCycle): { start: number; end: number; span: number } | null {
  // Combine all non-dormant months
  const active = new Set([
    ...food.flowering_months, ...food.fruiting_months,
    ...food.harvest_months, ...food.peak_months,
  ]);
  if (active.size === 0 || active.size >= 10) return null; // too wide for retrograde
  const sorted = [...active].sort((a, b) => a - b);
  // Find contiguous range (handling year wrap)
  let bestStart = sorted[0], bestEnd = sorted[sorted.length - 1];
  let span = bestEnd - bestStart + 1;
  // Check if wrapping gives a tighter range
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] > 2) {
      // Gap found — the active window wraps around
      const wrapStart = sorted[i + 1];
      const wrapEnd = sorted[i];
      const wrapSpan = (12 - wrapStart + 1) + wrapEnd;
      if (wrapSpan < span) { bestStart = wrapStart; bestEnd = wrapEnd; span = wrapSpan; }
    }
  }
  if (span > 8) return null; // too wide
  return { start: bestStart, end: bestEnd, span };
}

function retrogradeAngle(month: number, range: { start: number; end: number; span: number }): number {
  // Map month position to a back-and-forth sweep within the active arc
  let pos: number;
  if (range.end >= range.start) {
    pos = Math.max(0, Math.min(1, (month - range.start) / range.span));
  } else {
    // Wrapping range
    if (month >= range.start) pos = (month - range.start) / range.span;
    else pos = (12 - range.start + month) / range.span;
  }
  // Retrograde sweep: 0→1 maps to startAngle→endAngle
  const startAngle = ((range.start - 1) / 12) * 360;
  const endAngle = ((range.end) / 12) * 360;
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  return startAngle + sweep * Math.min(1, Math.max(0, pos));
}

/* ── Tourbillon stage summary ── */
function tourbillonText(foods: FoodCycle[], month: number): string[] {
  const summaries: string[] = [];
  const stageCounts: Record<string, number> = {};
  foods.forEach(f => {
    const s = foodStage(f, month);
    if (s) stageCounts[s] = (stageCounts[s] || 0) + 1;
  });
  Object.entries(stageCounts).forEach(([s, c]) => {
    const v = STAGE_VISUALS[s as CycleStage];
    summaries.push(`${v.icon} ${c}`);
  });
  return summaries.length > 0 ? summaries : ["—"];
}

/* ── Escapement chime (Web Audio) ── */
function playEscapementTick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Tick: short metallic click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
    // Chime: soft bell undertone
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = "sine";
    bell.frequency.setValueAtTime(1200, ctx.currentTime + 0.02);
    bell.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
    bellGain.gain.setValueAtTime(0.025, ctx.currentTime + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    bell.connect(bellGain);
    bellGain.connect(ctx.destination);
    bell.start(ctx.currentTime + 0.02);
    bell.stop(ctx.currentTime + 0.2);
    // Cleanup
    setTimeout(() => ctx.close(), 300);
  } catch {
    // Silent fallback
  }
}

export default function BloomingClockFace({
  currentMonth, onMonthChange, stageFilter, onStageChange,
  foods, selectedFoodIds, onFoodToggle, onFoodClear,
}: BloomingClockFaceProps) {
  const [hMonth, setHMonth] = useState<number|null>(null);
  const [hStage, setHStage] = useState<CycleStage|null>(null);
  const dm = hMonth ?? currentMonth;
  const today = new Date().getMonth() + 1;
  const prevMonthRef = useRef(currentMonth);

  // ── Tourbillon rotation ──
  const [tourbillonAngle, setTourbillonAngle] = useState(0);
  const tourbillonRef = useRef<number>(0);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setTourbillonAngle(a => (a + 0.15) % 360);
      tourbillonRef.current = requestAnimationFrame(tick);
    };
    tourbillonRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(tourbillonRef.current); };
  }, []);

  // ── Escapement chime on month change ──
  useEffect(() => {
    if (prevMonthRef.current !== currentMonth) {
      playEscapementTick();
      prevMonthRef.current = currentMonth;
    }
  }, [currentMonth]);

  const tourbillonSummary = useMemo(() => tourbillonText(foods, dm), [foods, dm]);

  const subdialFoods = useMemo(() => {
    const list = selectedFoodIds.length > 0
      ? foods.filter(f => selectedFoodIds.includes(f.id))
      : foods.slice(0, 2);
    return list.slice(0, 2);
  }, [foods, selectedFoodIds]);

  const handleMonthClick = useCallback((m: number) => {
    onMonthChange(m);
  }, [onMonthChange]);

  return (
    <div className="flex flex-col items-center">
      {/* Poetry whisper */}
      <div className="text-[10px] font-serif italic tracking-wider mb-1"
        style={{ color: P.brassLight, opacity: 0.75, transition: "all 0.8s ease", minHeight: 16 }}>
        {POETRY[dm]}
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
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
          <filter id="bcf-g1"><feGaussianBlur stdDeviation="1.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bcf-g2"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* ═══ OUTER BEZEL ═══ */}
        <circle cx={CX} cy={CY} r={OUTER_R + 4} fill="none" stroke="hsl(42, 40%, 25%)" strokeWidth="3" />
        <circle cx={CX} cy={CY} r={OUTER_R + 1.5} fill="none" stroke="url(#bcf-brass-ring)" strokeWidth="5" opacity="0.8" />
        <circle cx={CX} cy={CY} r={OUTER_R - 1} fill="none" stroke="hsl(42, 50%, 35%)" strokeWidth="0.5" opacity="0.6" />

        {/* ═══ FACE ═══ */}
        <circle cx={CX} cy={CY} r={BEZEL_R} fill="url(#bcf-bg)" />

        {/* ═══ GLOBE ═══ */}
        <g opacity="0.2">
          <circle cx={CX} cy={CY} r={GLOBE_R} fill="url(#bcf-globe)" />
          <ellipse cx={CX + 8} cy={CY - 12} rx={12} ry={22} fill={P.globeLand} opacity="0.5" />
          <ellipse cx={CX - 28} cy={CY - 5} rx={10} ry={28} fill={P.globeLand} opacity="0.4" transform={`rotate(-10 ${CX - 28} ${CY - 5})`} />
          <ellipse cx={CX + 30} cy={CY - 15} rx={18} ry={14} fill={P.globeLand} opacity="0.35" />
          <ellipse cx={CX + 35} cy={CY + 18} rx={8} ry={6} fill={P.globeLand} opacity="0.3" />
          <line x1={CX - GLOBE_R} y1={CY} x2={CX + GLOBE_R} y2={CY} stroke={P.brassDim} strokeWidth="0.3" />
          <ellipse cx={CX} cy={CY} rx={GLOBE_R * 0.5} ry={GLOBE_R} fill="none" stroke={P.brassDim} strokeWidth="0.2" />
          <ellipse cx={CX} cy={CY} rx={GLOBE_R * 0.8} ry={GLOBE_R} fill="none" stroke={P.brassDim} strokeWidth="0.2" />
          <line x1={CX - GLOBE_R} y1={CY - 16} x2={CX + GLOBE_R} y2={CY - 16} stroke={P.brassDim} strokeWidth="0.2" opacity="0.5" />
          <line x1={CX - GLOBE_R} y1={CY + 16} x2={CX + GLOBE_R} y2={CY + 16} stroke={P.brassDim} strokeWidth="0.2" opacity="0.5" />
        </g>

        {/* ═══ SEASONAL RING ═══ */}
        <circle cx={CX} cy={CY} r={STAGE_R + 8} fill="none" stroke={P.brassDim} strokeWidth="0.5" opacity="0.4" />
        <circle cx={CX} cy={CY} r={STAGE_R - 8} fill="none" stroke={P.brassDim} strokeWidth="0.5" opacity="0.4" />

        {STAGES.map(s => {
          const v = STAGE_VISUALS[s.key];
          const isActive = stageFilter === s.key || stageFilter === "all";
          const isHov = hStage === s.key;
          const midA = (s.arc[0] + ((s.arc[1] - s.arc[0] + 360) % 360) / 2) % 360;
          const lp = pol(CX, CY, STAGE_R, midA);
          return (
            <g key={s.key}>
              <path d={arcPath(CX, CY, STAGE_R, s.arc[0], s.arc[1])} fill="none"
                stroke={isActive ? v.color : P.brassDim}
                strokeWidth={isHov ? 16 : 14}
                opacity={isActive ? (isHov ? 0.3 : 0.18) : 0.06}
                strokeLinecap="butt"
                style={{ cursor: "pointer", transition: "all 0.6s ease" }}
                onClick={() => onStageChange(stageFilter === s.key ? "all" : s.key)}
                onMouseEnter={() => setHStage(s.key)}
                onMouseLeave={() => setHStage(null)} />
              <text x={lp.x} y={lp.y + 1} textAnchor="middle" dominantBaseline="central"
                style={{
                  fontSize: "7px", fontFamily: "'Georgia', serif", fontStyle: "italic",
                  fill: isActive ? v.color : P.brassDim,
                  opacity: isActive ? 0.85 : 0.3, letterSpacing: "0.08em",
                  pointerEvents: "none", transition: "all 0.5s ease",
                }}>
                {v.label}
              </text>
            </g>
          );
        })}

        {/* ═══ MONTH RING ═══ */}
        {MONTHS.map(m => {
          const angle = ((m.n - 1) / 12) * 360;
          const tO = pol(CX, CY, TICK_OUTER, angle);
          const tI = pol(CX, CY, TICK_INNER, angle);
          const lP = pol(CX, CY, MONTH_R - 2, angle);
          const isActive = m.n === currentMonth;
          const isHov = m.n === hMonth;
          const isNow = m.n === today;

          const minors = [1, 2, 3].map(t => {
            const a = angle + (t / 4) * 30;
            const s = pol(CX, CY, TICK_OUTER, a);
            const e = pol(CX, CY, TICK_OUTER - 4, a);
            return <line key={t} x1={s.x} y1={s.y} x2={e.x} y2={e.y}
              stroke={P.brassDim} strokeWidth="0.4" opacity="0.35" />;
          });

          return (
            <g key={m.n} style={{ cursor: "pointer" }}
              onClick={() => handleMonthClick(m.n)}
              onMouseEnter={() => setHMonth(m.n)}
              onMouseLeave={() => setHMonth(null)}>
              {minors}
              <line x1={tO.x} y1={tO.y} x2={tI.x} y2={tI.y}
                stroke={isActive ? P.brassLight : P.brass}
                strokeWidth={isActive ? 1.5 : 0.8} opacity={isActive ? 0.9 : 0.5} />
              <text x={lP.x} y={lP.y} textAnchor="middle" dominantBaseline="central"
                filter={isActive ? "url(#bcf-g1)" : undefined}
                style={{
                  fontSize: isActive ? "10px" : "8px",
                  fontFamily: "'Georgia', serif", fontWeight: isActive ? 700 : 400,
                  fill: isActive ? P.brassLight : isHov ? P.brass : P.brassDim,
                  transition: "all 0.5s ease", letterSpacing: "0.04em",
                }}>
                {m.l}
              </text>
              {isNow && !isActive && (
                <circle cx={pol(CX, CY, MONTH_R - 12, angle).x}
                  cy={pol(CX, CY, MONTH_R - 12, angle).y} r={1.5}
                  fill={P.brassLight} opacity="0.6" />
              )}
            </g>
          );
        })}

        {/* ═══ FOOD SUBDIALS with retrograde ═══ */}
        {subdialFoods.map((food, i) => {
          const side = i === 0 ? -1 : 1;
          const sx = CX + side * 42;
          const sy = CY;
          const stage = foodStage(food, dm);
          const visual = stage ? STAGE_VISUALS[stage] : null;
          const isPeak = food.peak_months.includes(dm);
          const isSelected = selectedFoodIds.includes(food.id);

          // Retrograde detection
          const retroRange = getActiveMonthRange(food);
          const isRetrograde = retroRange !== null && retroRange.span <= 7;

          // Stage arcs
          const stageArcs: JSX.Element[] = [];
          ([
            { months: food.flowering_months, st: "flowering" as CycleStage },
            { months: food.fruiting_months, st: "fruiting" as CycleStage },
            { months: food.harvest_months, st: "harvest" as CycleStage },
            { months: food.dormant_months, st: "dormant" as CycleStage },
            { months: food.peak_months, st: "peak" as CycleStage },
          ]).forEach(({ months, st }) => {
            months.forEach(m => {
              const a1 = ((m - 1) / 12) * 360;
              stageArcs.push(
                <path key={`${st}-${m}`} d={arcPath(sx, sy, SUBDIAL_R - 2, a1, a1 + 28)}
                  fill="none" stroke={STAGE_VISUALS[st].color}
                  strokeWidth="2.5" opacity="0.3" strokeLinecap="butt" />
              );
            });
          });

          // Hand angle: retrograde or full sweep
          let handAngle: number;
          if (isRetrograde && retroRange) {
            handAngle = retrogradeAngle(dm, retroRange);
            // Retrograde arc boundary markers
          } else {
            handAngle = ((dm - 1) / 12) * 360;
          }
          const handTip = pol(sx, sy, SUBDIAL_R - 5, handAngle);

          return (
            <g key={food.id} style={{ cursor: "pointer" }}
              onClick={() => onFoodToggle(food.id)}>
              {/* Name */}
              <text x={sx} y={sy - SUBDIAL_R - 8} textAnchor="middle"
                style={{
                  fontSize: "7px", fontFamily: "'Georgia', serif",
                  fill: isSelected ? P.brassLight : P.brass,
                  opacity: 0.8, letterSpacing: "0.06em", fontStyle: "italic",
                }}>
                {food.name}
              </text>

              {/* Bezel */}
              <circle cx={sx} cy={sy} r={SUBDIAL_R + 2}
                fill="none" stroke={P.brass} strokeWidth="1.5" opacity="0.5" />
              <circle cx={sx} cy={sy} r={SUBDIAL_R}
                fill="url(#bcf-subdial)"
                stroke={isSelected ? P.brassLight : P.brassDim}
                strokeWidth={isSelected ? 1 : 0.5} />

              {stageArcs}

              {/* Retrograde arc limits */}
              {isRetrograde && retroRange && (() => {
                const rStart = ((retroRange.start - 1) / 12) * 360;
                const rEnd = ((retroRange.end) / 12) * 360;
                const s1 = pol(sx, sy, SUBDIAL_R - 1, rStart);
                const s2 = pol(sx, sy, SUBDIAL_R - 1, rEnd);
                return (
                  <>
                    <circle cx={s1.x} cy={s1.y} r={1.2} fill={P.brass} opacity="0.5" />
                    <circle cx={s2.x} cy={s2.y} r={1.2} fill={P.brass} opacity="0.5" />
                    <path d={arcPath(sx, sy, SUBDIAL_R + 1, rStart, rEnd)}
                      fill="none" stroke={P.brassLight} strokeWidth="0.5" opacity="0.25"
                      strokeDasharray="2 2" />
                  </>
                );
              })()}

              {/* Ticks */}
              {[0, 90, 180, 270].map(a => {
                const t1 = pol(sx, sy, SUBDIAL_R, a);
                const t2 = pol(sx, sy, SUBDIAL_R - 3, a);
                return <line key={a} x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y}
                  stroke={P.brass} strokeWidth="0.5" opacity="0.4" />;
              })}

              {/* Hand */}
              <line x1={sx} y1={sy} x2={handTip.x} y2={handTip.y}
                stroke={P.brassLight} strokeWidth="0.8" opacity="0.7"
                strokeLinecap="round"
                style={{ transition: "all 0.8s cubic-bezier(0.25,0.1,0.25,1)" }} />

              {/* Food icon */}
              <text x={sx} y={sy + 1} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: "16px", pointerEvents: "none" }}
                filter={isPeak ? "url(#bcf-g2)" : undefined}>
                {food.icon}
              </text>

              {/* Hub */}
              <circle cx={sx} cy={sy} r={2} fill={P.brass} stroke={P.brassLight} strokeWidth="0.3" />

              {/* Stage + retrograde label */}
              {visual && (
                <text x={sx} y={sy + SUBDIAL_R + 10} textAnchor="middle"
                  style={{
                    fontSize: "6px", fontFamily: "'Georgia', serif",
                    fill: visual.color, opacity: 0.7, letterSpacing: "0.08em",
                    fontStyle: "italic", pointerEvents: "none",
                  }}>
                  {visual.label}{isPeak ? " ✦" : ""}{isRetrograde ? " ↺" : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* ═══ TOURBILLON CENTER ═══ */}
        <g style={{
          transform: `rotate(${tourbillonAngle}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
        }}>
          {/* Tourbillon cage */}
          <circle cx={CX} cy={CY} r={16} fill="none"
            stroke={P.brassDim} strokeWidth="0.4" opacity="0.35" />
          {/* Cage spokes */}
          {[0, 60, 120, 180, 240, 300].map(a => {
            const s = pol(CX, CY, 5, a);
            const e = pol(CX, CY, 15, a);
            return <line key={a} x1={s.x} y1={s.y} x2={e.x} y2={e.y}
              stroke={P.brassDim} strokeWidth="0.3" opacity="0.2" />;
          })}
          {/* Stage summaries around tourbillon */}
          {tourbillonSummary.map((txt, i) => {
            const a = (i / tourbillonSummary.length) * 360;
            const p = pol(CX, CY, 10, a);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                style={{
                  fontSize: "6px", fontFamily: "'Georgia', serif",
                  fill: P.brassLight, opacity: 0.65, pointerEvents: "none",
                  // Counter-rotate so text stays upright
                  transform: `rotate(${-tourbillonAngle}deg)`,
                  transformOrigin: `${p.x}px ${p.y}px`,
                }}>
                {txt}
              </text>
            );
          })}
        </g>

        {/* ═══ MAIN HAND ═══ */}
        {(() => {
          const handAngle = ((currentMonth - 1) / 12) * 360;
          const tip = pol(CX, CY, TICK_INNER - 2, handAngle);
          const tail = pol(CX, CY, 12, handAngle + 180);
          const b1 = pol(CX, CY, 6, handAngle - 12);
          const b2 = pol(CX, CY, 6, handAngle + 12);
          return (
            <g>
              <line x1={tail.x + 0.5} y1={tail.y + 0.5} x2={tip.x + 0.5} y2={tip.y + 0.5}
                stroke="hsla(0,0%,0%,0.3)" strokeWidth="2.5" strokeLinecap="round" />
              <polygon
                points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${tail.x},${tail.y} ${b2.x},${b2.y}`}
                fill={P.brassLight} opacity="0.75" filter="url(#bcf-g1)"
                style={{ transition: "all 1s cubic-bezier(0.25,0.1,0.25,1)" }} />
              <circle cx={CX} cy={CY} r={5} fill={P.brass} stroke={P.brassLight} strokeWidth="0.8" />
              <circle cx={CX} cy={CY} r={2} fill={P.brassLight} />
            </g>
          );
        })()}

        {/* ═══ Scattered blossoms ═══ */}
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
          <rect x={CX - 65} y={CY + OUTER_R + 10} width={130} height={22}
            rx={4} ry={4} fill={P.enamelD} stroke={P.brassDim} strokeWidth="0.8" opacity="0.9" />
          <line x1={CX - 58} y1={CY + OUTER_R + 12} x2={CX + 58} y2={CY + OUTER_R + 12}
            stroke={P.brassDim} strokeWidth="0.3" opacity="0.4" />
          <line x1={CX - 58} y1={CY + OUTER_R + 30} x2={CX + 58} y2={CY + OUTER_R + 30}
            stroke={P.brassDim} strokeWidth="0.3" opacity="0.4" />
          <text x={CX} y={CY + OUTER_R + 19} textAnchor="middle"
            style={{
              fontSize: "8px", fontFamily: "'Georgia', serif",
              fill: P.brassLight, letterSpacing: "0.2em", fontWeight: 600,
            }}>
            BLOOMING CLOCK
          </text>
          <text x={CX} y={CY + OUTER_R + 27} textAnchor="middle"
            style={{
              fontSize: "5px", fontFamily: "'Georgia', serif",
              fill: P.brassDim, letterSpacing: "0.15em", fontStyle: "italic",
            }}>
            {POETRY[dm]}
          </text>
        </g>
      </svg>

      {currentMonth !== today && (
        <button onClick={() => handleMonthClick(today)}
          className="text-[8px] font-serif italic tracking-wider mt-1"
          style={{ color: P.brassDim, opacity: 0.5, transition: "opacity 0.5s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
          return to today
        </button>
      )}

      <div className="flex flex-wrap gap-1 justify-center max-w-[280px] mt-2">
        <button onClick={onFoodClear}
          className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
          style={{
            background: selectedFoodIds.length === 0 ? "hsla(42, 35%, 35%, 0.25)" : "transparent",
            color: selectedFoodIds.length === 0 ? P.brassLight : P.brassDim,
            border: selectedFoodIds.length === 0 ? "1px solid hsla(42, 35%, 40%, 0.3)" : "1px solid transparent",
            transition: "all 0.5s ease",
          }}>
          All
        </button>
        {foods.map(f => (
          <button key={f.id} onClick={() => onFoodToggle(f.id)}
            className="px-2 py-0.5 rounded-full text-[8px] font-serif tracking-wide"
            style={{
              background: selectedFoodIds.includes(f.id) ? "hsla(42, 35%, 35%, 0.25)" : "transparent",
              color: selectedFoodIds.includes(f.id) ? P.brassLight : P.brassDim,
              border: selectedFoodIds.includes(f.id) ? "1px solid hsla(42, 35%, 40%, 0.3)" : "1px solid transparent",
              transition: "all 0.5s ease",
            }}>
            {f.icon} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

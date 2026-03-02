/**
 * MantleClock — A small brass mantlepiece instrument that sits above the hearth fire.
 * 
 * Default: A subtle, ticking mechanical clock with Roman numerals and seasonal indicators.
 * On click: Expands like a pocket watch case to reveal the full BloomingClockPortal.
 * 
 * "Time is not a line. It is a ring of seasons, turning slowly on a brass axis."
 */
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BloomingClockPortal = lazy(() => import("@/components/BloomingClockPortal"));

/* ── Palette ── */
const P = {
  brass: "hsl(42, 55%, 52%)",
  brassLight: "hsl(42, 65%, 68%)",
  brassDim: "hsl(42, 28%, 32%)",
  brassGlow: "hsla(42, 70%, 50%, 0.15)",
  midnight: "hsl(225, 28%, 7%)",
  face: "hsl(38, 18%, 12%)",
  faceEdge: "hsl(42, 30%, 22%)",
};

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const MONTHS_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const SEASON_ICONS = ["❄️", "❄️", "🌱", "🌸", "🌿", "☀️", "☀️", "🌾", "🍂", "🍁", "🌧️", "❄️"];

export default function MantleClock() {
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const rafRef = useRef<number>(0);
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Lightweight tick animation — only runs when collapsed
  useEffect(() => {
    if (expanded) return;
    let last = performance.now();
    const loop = (now: number) => {
      if (now - last > 1000) {
        last = now;
        tickRef.current += 1;
        setTick(tickRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [expanded]);

  const handleOpen = useCallback(() => setExpanded(true), []);
  const handleClose = useCallback(() => setExpanded(false), []);

  // Second hand angle — 6 degrees per tick
  const secondAngle = (tick % 60) * 6;
  // Minute hand — slow sweep
  const minuteAngle = ((new Date().getMinutes() + new Date().getSeconds() / 60) / 60) * 360;
  // Hour hand
  const hourAngle = ((new Date().getHours() % 12 + new Date().getMinutes() / 60) / 12) * 360;
  // Seasonal ring rotation — slow continuous rotation based on month
  const seasonalRotation = (currentMonth / 12) * 360;

  return (
    <>
      {/* ── Collapsed: Mantle Clock ── */}
      <motion.div
        layout
        className="relative mx-auto cursor-pointer group"
        style={{ width: 120, height: 120 }}
        onClick={handleOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        title="The Blooming Clock — click to open"
      >
        {/* Outer brass bezel */}
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
          {/* Bezel ring */}
          <circle cx="60" cy="60" r="58" fill="none" stroke={P.brass} strokeWidth="2.5" opacity="0.7" />
          <circle cx="60" cy="60" r="55" fill="none" stroke={P.brassDim} strokeWidth="0.5" opacity="0.4" />
          
          {/* Clock face background */}
          <circle cx="60" cy="60" r="53" fill={P.face} />
          
          {/* Face texture — subtle radial grain */}
          <defs>
            <radialGradient id="mantle-face-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="hsla(42, 30%, 18%, 0.4)" />
              <stop offset="100%" stopColor="hsla(225, 20%, 6%, 0.6)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="53" fill="url(#mantle-face-grad)" />

          {/* Seasonal ring — outer, rotates slowly */}
          <g transform={`rotate(${seasonalRotation}, 60, 60)`} opacity="0.5">
            {MONTHS_SHORT.map((_, i) => {
              const angle = (i / 12) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 60 + 47 * Math.cos(rad);
              const y = 60 + 47 * Math.sin(rad);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="select-none"
                  style={{
                    fontSize: "6px",
                    fill: i === currentMonth ? P.brassLight : P.brassDim,
                    fontFamily: "serif",
                    opacity: i === currentMonth ? 1 : 0.5,
                  }}
                >
                  {SEASON_ICONS[i]}
                </text>
              );
            })}
          </g>

          {/* Roman numerals */}
          {ROMAN.map((numeral, i) => {
            const angle = (i / 12) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 60 + 39 * Math.cos(rad);
            const y = 60 + 39 * Math.sin(rad);
            return (
              <text
                key={numeral}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{
                  fontSize: i === 0 ? "7px" : "6px",
                  fill: P.brassLight,
                  fontFamily: "serif",
                  letterSpacing: "-0.5px",
                  opacity: 0.65,
                }}
              >
                {numeral}
              </text>
            );
          })}

          {/* Hour markers — small brass dots */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const isHour = i % 5 === 0;
            const r = isHour ? 1.2 : 0.4;
            const dist = isHour ? 32 : 33;
            return (
              <circle
                key={`dot-${i}`}
                cx={60 + dist * Math.cos(rad)}
                cy={60 + dist * Math.sin(rad)}
                r={r}
                fill={P.brass}
                opacity={isHour ? 0.6 : 0.2}
              />
            );
          })}

          {/* Hour hand */}
          <line
            x1="60" y1="60"
            x2={60 + 22 * Math.sin((hourAngle * Math.PI) / 180)}
            y2={60 - 22 * Math.cos((hourAngle * Math.PI) / 180)}
            stroke={P.brassLight}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Minute hand */}
          <line
            x1="60" y1="60"
            x2={60 + 30 * Math.sin((minuteAngle * Math.PI) / 180)}
            y2={60 - 30 * Math.cos((minuteAngle * Math.PI) / 180)}
            stroke={P.brassLight}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Second hand — thin, red-tinted brass */}
          <line
            x1="60" y1="60"
            x2={60 + 34 * Math.sin((secondAngle * Math.PI) / 180)}
            y2={60 - 34 * Math.cos((secondAngle * Math.PI) / 180)}
            stroke="hsl(15, 55%, 50%)"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Center pin */}
          <circle cx="60" cy="60" r="2.5" fill={P.brass} />
          <circle cx="60" cy="60" r="1" fill={P.midnight} />

          {/* Current season fruit indicator — small subdial at 6 o'clock */}
          <text
            x="60" y="78"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: "10px" }}
            className="select-none"
          >
            {SEASON_ICONS[currentMonth]}
          </text>

          {/* Subtle brass glow on hover — via group */}
          <circle
            cx="60" cy="60" r="56"
            fill="none"
            stroke={P.brass}
            strokeWidth="1"
            opacity="0"
            className="group-hover:opacity-30 transition-opacity duration-500"
          />
        </svg>

        {/* Tick pulse — subtle center glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: tick % 2 === 0
              ? `0 0 8px ${P.brassGlow}, inset 0 0 12px hsla(42, 50%, 30%, 0.05)`
              : `0 0 4px ${P.brassGlow}, inset 0 0 6px hsla(42, 50%, 30%, 0.02)`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </motion.div>

      {/* ── Expanded: Full Blooming Clock Portal ── */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Dim overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "hsla(225, 30%, 4%, 0.85)", backdropFilter: "blur(6px)" }}
              onClick={handleClose}
            />

            {/* Watch case — expands from center */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 22,
                stiffness: 200,
                mass: 0.8,
              }}
              className="fixed inset-4 md:inset-8 lg:inset-16 z-[101] flex flex-col items-center overflow-y-auto"
              style={{
                background: "radial-gradient(ellipse at 50% 20%, hsla(225, 20%, 12%, 0.98), hsla(225, 28%, 7%, 0.99))",
                borderRadius: "24px",
                border: `1px solid hsla(42, 40%, 30%, 0.25)`,
                boxShadow: `
                  0 0 60px hsla(42, 50%, 30%, 0.15),
                  0 0 120px hsla(42, 50%, 20%, 0.08),
                  inset 0 1px 0 hsla(42, 50%, 50%, 0.06)
                `,
              }}
            >
              {/* Close button — subtle brass X */}
              <div className="w-full flex justify-end p-4">
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-serif transition-colors"
                  style={{
                    background: "hsla(42, 30%, 20%, 0.3)",
                    color: P.brassDim,
                    border: "1px solid hsla(42, 40%, 30%, 0.2)",
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Mantle glow — decorative arc above the clock */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="w-48 h-1 rounded-full mx-auto -mt-2 mb-4"
                style={{
                  background: `linear-gradient(90deg, transparent, ${P.brass}, transparent)`,
                  opacity: 0.25,
                  boxShadow: `0 0 20px ${P.brassGlow}`,
                }}
              />

              {/* The full Blooming Clock Portal */}
              <div className="w-full max-w-2xl px-4 pb-8">
                <Suspense fallback={
                  <div className="h-[300px] flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 rounded-full"
                      style={{
                        border: `2px solid ${P.brassDim}`,
                        borderTopColor: P.brass,
                      }}
                    />
                  </div>
                }>
                  <BloomingClockPortal />
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

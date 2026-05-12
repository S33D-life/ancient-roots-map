/**
 * RegaliaChamber — mystical display of the wanderer's identity:
 * cloak, staff, sigils/badges, species affinity, streaks.
 *
 * Pure presentation — wires real data via props from useStaffIdentity and
 * useLivingProgression. Avoids RPG inventory tropes; reads as ceremonial.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Wand2, Sparkles, ArrowRight, ScrollText, ChevronDown } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useCloakHistory } from "@/hooks/use-cloak-history";
import { formatDistanceToNow } from "date-fns";

export interface RegaliaChamberProps {
  staffName?: string | null;
  staffSpecies?: string | null;
  isPermanent?: boolean;
  affinitySpecies?: string[];
  /** Distinct species count — drives breadth signal. */
  speciesCount?: number;
  /** Visit count — drives streak/return signal. */
  visits?: number;
  /** Deepest single-hive count — drives affinity signal. */
  affinityDepth?: number;
  /** Earned sigils/badges (short labels). */
  sigils?: string[];
  /** Streak label, e.g. "9 moon cycles". */
  streak?: string;
}

/**
 * Cloak evolves from a combined resonance score:
 *   breadth  (species learnt)   weight 1.5
 *   returns  (visits / streak)  weight 1.0
 *   affinity (deepest hive)     weight 2.0
 * Each axis is also softly capped so a single signal can't carry the cloak alone —
 * the mantle truly thickens only when wandering, returning, and tending all grow.
 */
const CLOAK_STAGES = [
  { min: 0,   label: "Plain wool",       tone: "from-stone-200/30 to-stone-400/20" },
  { min: 6,   label: "Rooted weave",     tone: "from-emerald-300/30 to-stone-400/25" },
  { min: 18,  label: "Mossbound mantle", tone: "from-emerald-400/35 to-amber-300/25" },
  { min: 40,  label: "Lichen-threaded",  tone: "from-emerald-500/40 to-amber-400/30" },
  { min: 75,  label: "Heartwood cloak",  tone: "from-amber-500/40 to-emerald-500/35" },
  { min: 120, label: "Ancient mantle",   tone: "from-amber-400/55 to-emerald-400/45" },
];

function resonanceScore(species: number, visits: number, affinity: number) {
  const breadth  = Math.min(40, species)  * 1.5;   // soft-cap at 40 species
  const returns  = Math.min(50, visits)   * 1.0;   // soft-cap at 50 visits
  const affinityScore = Math.min(20, affinity) * 2.0; // soft-cap at 20 in one hive
  return Math.round(breadth + returns + affinityScore);
}

function cloakStage(score: number) {
  return [...CLOAK_STAGES].reverse().find((s) => score >= s.min) ?? CLOAK_STAGES[0];
}

export default function RegaliaChamber({
  staffName,
  staffSpecies,
  isPermanent,
  affinitySpecies = [],
  speciesCount = 0,
  visits = 0,
  affinityDepth = 0,
  sigils = [],
  streak,
}: RegaliaChamberProps) {
  const score = resonanceScore(speciesCount, visits, affinityDepth);
  const cloak = cloakStage(score);
  const nextStage = CLOAK_STAGES.find((s) => s.min > score);
  const toNext = nextStage ? Math.max(0, nextStage.min - score) : 0;

  // Stage-transition animation: when the cloak label changes (after first paint),
  // briefly glow the cloak and cross-fade the label so ascension feels alive.
  const prevLabelRef = useRef<string | null>(null);
  const [ascending, setAscending] = useState(false);
  useEffect(() => {
    const prev = prevLabelRef.current;
    if (prev !== null && prev !== cloak.label) {
      setAscending(true);
      const t = window.setTimeout(() => setAscending(false), 2600);
      return () => window.clearTimeout(t);
    }
    prevLabelRef.current = cloak.label;
  }, [cloak.label]);
  // Keep ref in sync once animation lifecycle has read the previous value.
  useEffect(() => {
    prevLabelRef.current = cloak.label;
  }, [cloak.label]);

  return (
    <section
      className="relative rounded-2xl border border-amber-900/25 overflow-hidden bg-card/55 backdrop-blur-sm"
      aria-label="Regalia"
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-700/30 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-amber-700/85 dark:text-amber-300/85" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base text-foreground leading-tight">Regalia</h3>
          <p className="font-serif text-[11px] italic text-muted-foreground/85 mt-0.5">
            What you carry into the cave.
          </p>
        </div>
        {streak && (
          <span className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80 shrink-0">
            {streak}
          </span>
        )}
      </div>

      <div className="px-4 pt-4 pb-5 grid grid-cols-[1fr,auto] gap-3 items-start">
        {/* Cloak silhouette */}
        <div className="relative">
          <div
            className={`relative h-32 rounded-xl border bg-gradient-to-b ${cloak.tone} overflow-hidden transition-[border-color,box-shadow] duration-700 motion-reduce:transition-none ${
              ascending
                ? "border-amber-400/70 shadow-[0_0_28px_6px_hsl(38_90%_60%/0.45)]"
                : "border-border/30"
            }`}
            aria-live="polite"
          >
            <svg
              viewBox="0 0 100 120"
              className="absolute inset-0 w-full h-full opacity-90"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Stylised cloak shape */}
              <path
                d="M50 12 L70 22 L88 70 L80 110 L20 110 L12 70 L30 22 Z"
                fill="hsl(var(--foreground) / 0.06)"
                stroke="hsl(var(--foreground) / 0.25)"
                strokeWidth="0.6"
              />
              <path
                d="M50 14 L50 110"
                stroke="hsl(var(--foreground) / 0.18)"
                strokeWidth="0.4"
                strokeDasharray="2 2"
              />
              {/* Sigil pins on the cloak */}
              {sigils.slice(0, 5).map((_, i) => (
                <circle
                  key={i}
                  cx={32 + (i % 3) * 18}
                  cy={40 + Math.floor(i / 3) * 22}
                  r="3"
                  fill="hsl(38 90% 60%)"
                  stroke="hsl(38 90% 35%)"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
            {/* Ascension glow overlay */}
            {ascending && (
              <>
                <div
                  className="pointer-events-none absolute inset-0 motion-reduce:hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 55%, hsl(38 95% 65% / 0.55), transparent 65%)",
                    animation: "regalia-ascend-glow 2.4s ease-out forwards",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-6 top-1/2 h-px motion-reduce:hidden"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, hsl(38 95% 70% / 0.85), transparent)",
                    animation: "regalia-ascend-sweep 1.6s ease-out forwards",
                  }}
                  aria-hidden="true"
                />
              </>
            )}
          </div>
          <p
            key={cloak.label}
            className={`font-serif text-[10px] uppercase tracking-[0.18em] mt-1.5 text-center transition-colors duration-700 motion-reduce:transition-none ${
              ascending
                ? "text-amber-700 dark:text-amber-300 animate-fade-in"
                : "text-muted-foreground/75"
            }`}
          >
            {cloak.label}
            {ascending && (
              <span className="sr-only"> — new mantle attained</span>
            )}
          </p>
          {nextStage && (
            <p className="font-serif text-[10px] italic text-muted-foreground/60 mt-0.5 text-center leading-snug">
              {toNext} resonance to {nextStage.label.toLowerCase()}
            </p>
          )}
          <style>{`
            @keyframes regalia-ascend-glow {
              0%   { opacity: 0; transform: scale(0.85); }
              35%  { opacity: 1; transform: scale(1.05); }
              100% { opacity: 0; transform: scale(1.25); }
            }
            @keyframes regalia-ascend-sweep {
              0%   { transform: translateX(-120%); opacity: 0; }
              25%  { opacity: 1; }
              100% { transform: translateX(120%); opacity: 0; }
            }
          `}</style>
        </div>

        {/* Staff + sigils */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-serif uppercase tracking-[0.2em] text-muted-foreground/75">
              <Wand2 className="w-3 h-3" /> Staff
            </div>
            <p className="font-serif text-[12px] text-foreground/90 mt-0.5 leading-snug truncate">
              {staffName ?? (isPermanent ? "Bound" : "Awaiting first guide")}
            </p>
            {staffSpecies && (
              <p className="font-serif text-[10px] italic text-muted-foreground/80 truncate">
                {staffSpecies} · {isPermanent ? "permanent" : "borrowed"}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-serif uppercase tracking-[0.2em] text-muted-foreground/75">
              <Sparkles className="w-3 h-3" /> Sigils
            </div>
            <p className="font-serif text-[11px] text-foreground/85 mt-0.5 leading-snug">
              {sigils.length > 0 ? `${sigils.length} earned` : "None yet"}
            </p>
          </div>
        </div>
      </div>

      {affinitySpecies.length > 0 && (
        <div className="px-4 pb-4 -mt-1">
          <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
            Species affinity
          </p>
          <div className="flex flex-wrap gap-1.5">
            {affinitySpecies.slice(0, 6).map((s) => (
              <span
                key={s}
                className="font-serif text-[10px] px-2 py-0.5 rounded-full border border-emerald-700/25 bg-emerald-50/30 dark:bg-emerald-950/15 text-foreground/80"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <Link
          to={ROUTES.STAFF_ROOM}
          className="inline-flex items-center gap-1.5 font-serif text-[11px] text-foreground/85 hover:text-primary transition-colors"
        >
          Enter the Staff Room <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

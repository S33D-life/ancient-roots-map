/**
 * PathwayCard — Botanical pathway tile for The Arborium.
 *
 * Two variants:
 *   default  → standard half-width tile (3 secondary pathways)
 *   primary  → full-width featured tile with clue chips (Learn to Identify)
 *
 * Clue chips are visual-only placeholders for the future ID filter system.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface PathwayCardProps {
  to: string;
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  hue?: number;
  index?: number;
  comingSoon?: boolean;
  /** Renders the full-width primary variant with clue chips */
  primary?: boolean;
  /** Clue chip labels shown in the primary variant */
  chips?: string[];
}

function ClueChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-amber-900/20 bg-[hsl(48_45%_97%)]/80 text-[10px] font-serif uppercase tracking-[0.14em] text-amber-900/65 select-none">
      {label}
    </span>
  );
}

export default function PathwayCard({
  to,
  icon: Icon,
  emoji,
  title,
  description,
  hue = 95,
  index = 0,
  comingSoon,
  primary,
  chips,
}: PathwayCardProps) {
  const inner = primary ? (
    /* ── Primary variant ── */
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -1 }}
      className="group relative w-full rounded-2xl overflow-hidden border transition-all"
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 45% 94%) 0%, hsl(${hue - 8} 35% 91%) 55%, hsl(${hue + 12} 40% 93%) 100%)`,
        borderColor: `hsl(${hue} 35% 68% / 0.35)`,
        boxShadow: `inset 0 1px 0 hsl(${hue} 40% 80% / 0.7), 0 10px 30px -18px hsl(${hue} 40% 22% / 0.3)`,
      }}
    >
      {/* glow bloom */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: `hsl(${hue} 55% 68% / 0.5)` }}
        aria-hidden
      />

      <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* left: icon + text */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className="text-4xl select-none leading-none shrink-0"
            aria-hidden
            style={{ filter: "drop-shadow(0 2px 0 hsl(40 30% 100% / 0.7))" }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <p className="text-[9px] font-serif uppercase tracking-[0.2em] text-[hsl(95_25%_25%)]/60">
                Primary pathway
              </p>
            </div>
            <h3 className="font-serif text-xl md:text-2xl text-[hsl(95_30%_16%)] leading-tight">
              {title}
            </h3>
            <p className="text-xs font-serif text-[hsl(95_15%_28%)]/80 mt-1.5 leading-relaxed max-w-sm">
              {description}
            </p>

            {/* Clue chips */}
            {chips && chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {chips.map((chip) => (
                  <ClueChip key={chip} label={chip} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right: CTA */}
        <div className="shrink-0 self-end sm:self-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-900/20 bg-[hsl(48_40%_97%)]/60 text-[11px] font-serif text-[hsl(95_30%_18%)] group-hover:bg-[hsl(48_40%_94%)]/80 transition-colors">
            Begin here
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  ) : (
    /* ── Standard variant ── */
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="group relative h-full rounded-2xl p-5 overflow-hidden border transition-all"
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 38% 95%) 0%, hsl(${hue - 10} 28% 92%) 60%, hsl(${hue + 10} 33% 94%) 100%)`,
        borderColor: `hsl(${hue} 28% 70% / 0.32)`,
        boxShadow: `inset 0 1px 0 hsl(${hue} 32% 82% / 0.55), 0 6px 20px -14px hsl(${hue} 38% 25% / 0.22)`,
      }}
    >
      <div
        className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-35 blur-2xl pointer-events-none"
        style={{ background: `hsl(${hue} 48% 72% / 0.45)` }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="text-3xl select-none leading-none"
            aria-hidden
            style={{ filter: "drop-shadow(0 1px 0 hsl(40 30% 100% / 0.6))" }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-base text-[hsl(95_28%_18%)] leading-tight">{title}</h3>
            <p className="text-xs font-serif text-[hsl(95_14%_30%)]/72 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <Icon className="w-4 h-4 mt-1 shrink-0 text-[hsl(95_28%_30%)]/45 group-hover:text-[hsl(95_42%_30%)] transition-colors" />
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[10px] font-serif uppercase tracking-[0.18em] text-[hsl(95_18%_30%)]/52">
          {comingSoon ? "Opening soon" : "Enter"}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-[hsl(95_28%_30%)]/55 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );

  if (comingSoon) {
    return <div aria-disabled className="opacity-85 cursor-default">{inner}</div>;
  }
  return (
    <Link
      to={to}
      className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl ${primary ? "w-full" : "h-full"}`}
    >
      {inner}
    </Link>
  );
}

/**
 * SpeciesCard — Herbarium-styled species card for The Arborium.
 *
 * ID-first layout:
 *   1. Specimen plate (emoji + latin name)
 *   2. Common name + one-line tagline
 *   3. "Identify by" — primary visual clue (most prominent)
 *   4. Seasonal clue (when to look)
 *   5. Look for (specific field detail)
 *   6. Quest link placeholder
 *
 * Reusable structure for future per-species detail pages.
 *
 * Props merged from two branches:
 *   familyMode  — simplified copy + larger display (from main)
 *   highlighted — amber ring when matched by ID flow (from ux/arborium-next)
 *   dimmed      — opacity reduction when another species is matched
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Sun, Search, ArrowRight } from "lucide-react";
import type { SpeciesSeed } from "./starterSpecies";

export default function SpeciesCard({
  species,
  index = 0,
  familyMode = false,
  highlighted = false,
  dimmed = false,
}: {
  species: SpeciesSeed;
  index?: number;
  familyMode?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  const tagline = familyMode ? species.family?.tagline ?? species.tagline : species.tagline;
  const idClue = familyMode ? species.family?.idClue ?? species.idClue : species.idClue;

  return (
    <motion.article
      id={`specimen-${species.slug}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={[
        "group relative rounded-2xl overflow-hidden border bg-gradient-to-br from-[hsl(45_45%_96%)] via-[hsl(40_35%_93%)] to-[hsl(80_25%_92%)] dark:from-[hsl(95_18%_12%)] dark:via-[hsl(80_16%_14%)] dark:to-[hsl(95_20%_11%)] transition-all duration-300",
        highlighted ? "border-amber-500/55 ring-2 ring-amber-500/30" : "border-amber-900/15 dark:border-amber-200/12",
        dimmed ? "opacity-40" : "opacity-100",
      ].join(" ")}
      style={{
        boxShadow: highlighted
          ? "inset 0 1px 0 hsl(40 32% 86% / 0.6), 0 8px 24px -12px hsl(40 30% 28% / 0.22), 0 0 0 3px hsl(40 55% 60% / 0.14)"
          : "inset 0 1px 0 hsl(40 32% 86% / 0.6), 0 8px 24px -12px hsl(40 30% 28% / 0.22)",
      }}
    >
      {/* parchment fibres */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, hsl(35 40% 30%) 0 1px, transparent 2px), radial-gradient(circle at 78% 62%, hsl(110 30% 25%) 0 1px, transparent 2px)",
          backgroundSize: "180px 180px, 220px 220px",
        }}
        aria-hidden
      />

      {/* specimen plate */}
      <div
        className={`relative flex items-center justify-center border-b border-amber-900/12 dark:border-amber-200/10 bg-[hsl(45_40%_94%)]/55 dark:bg-[hsl(95_18%_10%)]/55 ${
          familyMode ? "h-28" : "h-20"
        }`}
      >
        <span
          className={`select-none ${familyMode ? "text-6xl" : "text-4xl"}`}
          aria-hidden
        >
          {species.emoji}
        </span>
        <span className="absolute top-2 left-2.5 text-[9px] font-serif uppercase tracking-[0.18em] text-amber-900/42 dark:text-amber-200/38">
          Specimen
        </span>
        {!familyMode && (
          <span className="absolute bottom-2 right-2.5 text-[10px] font-serif italic text-amber-900/48 dark:text-amber-200/42">
            {species.latin}
          </span>
        )}
      </div>

      <div className={`relative ${familyMode ? "p-5 space-y-3" : "p-4 space-y-2.5"}`}>

        {/* name + tagline */}
        <header>
          <h3
            className={`font-serif text-foreground leading-tight ${
              familyMode ? "text-lg" : "text-base"
            }`}
          >
            {species.common}
          </h3>
          <p
            className={`font-serif text-muted-foreground/72 mt-0.5 leading-relaxed ${
              familyMode ? "text-[13px]" : "text-[11px]"
            }`}
          >
            {tagline}
          </p>
        </header>

        {/* Identify by — primary clue, most prominent */}
        <div
          className={`rounded-xl border border-amber-900/15 dark:border-amber-200/12 space-y-1 bg-[hsl(45_38%_97%/0.85)] dark:bg-[hsl(95_18%_15%/0.7)] ${
            familyMode ? "p-3" : "p-2.5"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-amber-900/48 dark:text-amber-200/48 shrink-0" />
            <span className="text-[9px] font-serif uppercase tracking-[0.15em] text-amber-900/52 dark:text-amber-200/48">
              {familyMode ? "Look for" : "Identify by"}
            </span>
          </div>
          <p
            className={`font-serif text-foreground/88 leading-snug ${
              familyMode ? "text-[13px]" : "text-[12px]"
            }`}
          >
            {idClue}
          </p>
        </div>

        {/* Density: hide extra detail rows in Family Mode */}
        {!familyMode && (
          <>
            {/* Seasonal clue */}
            <div className="flex items-start gap-2">
              <Sun className="w-3 h-3 mt-0.5 shrink-0 text-amber-600/55 dark:text-amber-400/55" />
              <p className="text-[11px] font-serif text-muted-foreground/78 leading-snug">
                {species.seasonalClue}
              </p>
            </div>

            {/* Look for */}
            <div className="flex items-start gap-2">
              <Search className="w-3 h-3 mt-0.5 shrink-0 text-emerald-700/45 dark:text-emerald-400/45" />
              <p className="text-[11px] font-serif text-muted-foreground/78 leading-snug">
                {species.lookFor}
              </p>
            </div>
          </>
        )}

        {/* Quest placeholder link */}
        <Link
          to={`/library/arborium?species=${species.slug}`}
          className={`inline-flex items-center gap-1 font-serif text-primary/72 hover:text-primary transition-colors pt-0.5 ${
            familyMode ? "text-[12px]" : "text-[11px]"
          }`}
        >
          {familyMode ? "Go find one" : species.questHint ?? "Related quests"}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.article>
  );
}

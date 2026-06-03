/**
 * IDPanel — Two-step identification panel for the Arborium Tree ID Starter.
 *
 * Opens below the clue cards when the user taps one of the six ID starter cards.
 * Step 1: shows the question for the chosen clue type.
 * Step 2: user selects an answer → matched starter species are surfaced with CTAs.
 */
import { motion } from "framer-motion";
import { X, MapPin, Compass, BookOpen, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { ID_BRANCHES } from "./idBranches";
import { STARTER_SPECIES } from "./starterSpecies";
import { ROUTES } from "@/lib/routes";

interface IDPanelProps {
  clueKey: string;
  activeAnswerId: string | null;
  matchedSlugs: string[];
  onAnswerSelect: (answerId: string) => void;
  onClear: () => void;
}

export default function IDPanel({
  clueKey,
  activeAnswerId,
  matchedSlugs,
  onAnswerSelect,
  onClear,
}: IDPanelProps) {
  const branch = ID_BRANCHES[clueKey];
  if (!branch) return null;

  const matchedSpecies = STARTER_SPECIES.filter((s) =>
    matchedSlugs.includes(s.slug)
  );

  function scrollToSpecimen(slug: string) {
    const el = document.getElementById(`specimen-${slug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-2xl border border-amber-900/20 dark:border-amber-200/15 overflow-hidden
        bg-[linear-gradient(160deg,hsl(48_52%_96%)_0%,hsl(72_30%_94%)_55%,hsl(48_45%_95%)_100%)]
        dark:bg-[linear-gradient(160deg,hsl(95_18%_12%)_0%,hsl(80_16%_14%)_55%,hsl(95_20%_11%)_100%)]
        shadow-[inset_0_1px_0_hsl(48_40%_98%/0.9),0_8px_28px_-12px_hsl(40_28%_22%/0.18)]
        dark:shadow-[inset_0_1px_0_hsl(48_28%_22%/0.3),0_10px_30px_-14px_hsl(0_0%_0%/0.6)]"
    >
      {/* faint pressed-leaf texture */}
      <div
        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 30%, hsl(95 40% 22%) 0 1px, transparent 3px), radial-gradient(ellipse at 78% 68%, hsl(35 45% 22%) 0 1px, transparent 3px)",
          backgroundSize: "130px 130px, 170px 170px",
        }}
        aria-hidden
      />

      <div className="relative p-5 md:p-6 space-y-5">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-serif uppercase tracking-[0.22em] text-amber-900/52">
              {branch.label} · Field Guide
            </p>
            <h3 className="font-serif text-base md:text-lg text-foreground mt-0.5 leading-snug">
              {branch.question}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear identification"
            className="shrink-0 p-1.5 rounded-lg text-amber-900/50 hover:text-amber-900/80 hover:bg-amber-900/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Answer buttons ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          role="group"
          aria-label="Identification answers"
        >
          {branch.answers.map((answer) => {
            const selected = activeAnswerId === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => onAnswerSelect(answer.id)}
                aria-pressed={selected}
                className={[
                  "group relative text-left rounded-xl border px-3.5 py-3 transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-amber-600/45 dark:border-amber-400/45 bg-[hsl(45_50%_92%)]/90 dark:bg-[hsl(80_18%_16%)]/90 shadow-[inset_0_1px_0_hsl(48_40%_98%/0.8),0_0_0_3px_hsl(40_55%_60%/0.18)] dark:shadow-[inset_0_1px_0_hsl(48_28%_22%/0.35),0_0_0_3px_hsl(40_55%_50%/0.22)]"
                    : "border-amber-900/15 dark:border-amber-200/12 bg-[hsl(48_38%_97%)]/70 dark:bg-[hsl(95_18%_14%)]/70 hover:border-amber-700/28 dark:hover:border-amber-400/25 hover:bg-[hsl(46_44%_95%)]/80 dark:hover:bg-[hsl(80_18%_16%)]/80",
                ].join(" ")}
              >
                <div className="flex items-start gap-2.5">
                  {/* selected indicator dot */}
                  <span
                    className={[
                      "mt-1 shrink-0 w-2 h-2 rounded-full border transition-colors",
                      selected
                        ? "bg-amber-600/80 border-amber-600/80"
                        : "bg-transparent border-amber-900/30 group-hover:border-amber-700/45",
                    ].join(" ")}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-[13px] text-foreground leading-snug">{answer.label}</p>
                    <p className="text-[11px] font-serif text-muted-foreground/72 mt-0.5 leading-relaxed">
                      {answer.hint}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Results ── */}
        {activeAnswerId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-1"
          >
            <div className="h-px bg-amber-900/10" aria-hidden />

            {matchedSpecies.length === 0 ? (
              /* empty state — shouldn't happen with current data but good practice */
              <div className="rounded-xl border border-dashed border-amber-900/20 p-4 text-center">
                <Leaf className="w-5 h-5 text-amber-900/30 mx-auto mb-2" />
                <p className="font-serif text-sm text-muted-foreground/72 leading-relaxed">
                  No species match this clue in the starter set.<br />
                  Try a different observation.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[9px] font-serif uppercase tracking-[0.2em] text-amber-900/52 mb-2.5">
                    Likely matches — {matchedSpecies.length === 1 ? "1 species" : `${matchedSpecies.length} species`}
                  </p>

                  {/* per-species rows */}
                  <ul className="space-y-2" aria-label="Matched species">
                    {matchedSpecies.map((s) => (
                      <li
                        key={s.slug}
                        className="flex items-center justify-between gap-3 rounded-xl border border-amber-900/12 bg-[hsl(48_40%_97%)]/80 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl leading-none select-none shrink-0" aria-hidden>
                            {s.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="font-serif text-[13px] text-foreground leading-tight">{s.common}</p>
                            <p className="font-serif text-[10px] italic text-muted-foreground/58 leading-tight">
                              {s.latin}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => scrollToSpecimen(s.slug)}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-serif text-amber-900/65 hover:text-amber-900 border border-amber-900/18 hover:border-amber-900/32 rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <BookOpen className="w-3 h-3" aria-hidden />
                          Learn this species
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* group CTAs */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <Link
                    to={ROUTES.MAP}
                    className="inline-flex items-center gap-1.5 text-[11px] font-serif border border-amber-900/22 hover:border-amber-900/38 bg-[hsl(48_40%_96%)]/80 hover:bg-[hsl(46_44%_93%)]/90 rounded-xl px-3.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MapPin className="w-3 h-3 text-amber-700/60" aria-hidden />
                    View nearby trees
                  </Link>

                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center gap-1.5 text-[11px] font-serif border border-amber-900/12 bg-transparent rounded-xl px-3.5 py-2 text-muted-foreground/45 cursor-not-allowed"
                  >
                    <Compass className="w-3 h-3" aria-hidden />
                    Begin a quest
                    <span className="text-[9px] tracking-[0.15em] uppercase border border-current/40 rounded-full px-1.5 py-0.5 opacity-70">
                      Soon
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* microcopy */}
            <p className="text-[10px] font-serif italic text-muted-foreground/52 leading-relaxed">
              This is a gentle field guide, not a final authority. Meet the tree closely before naming it.
            </p>
          </motion.div>
        )}

        {/* ── Clear button (bottom, visible when answer selected) ── */}
        {activeAnswerId !== null && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-serif text-amber-900/50 hover:text-amber-900/78 underline-offset-2 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Clear identification
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

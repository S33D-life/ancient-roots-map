/**
 * SpeciesCard — Herbarium-styled starter species card for The Arborium.
 * Reusable structure for future per-species pages.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, ArrowRight } from "lucide-react";

export interface SpeciesSeed {
  slug: string;
  common: string;
  latin: string;
  description: string;
  clue: string;
  emoji: string;
  questHint?: string;
}

export default function SpeciesCard({ species, index = 0 }: { species: SpeciesSeed; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden border border-amber-900/15 bg-gradient-to-br from-[hsl(45_45%_96%)] via-[hsl(40_35%_93%)] to-[hsl(80_25%_92%)] dark:from-amber-950/15 dark:via-card/40 dark:to-emerald-950/10 shadow-[0_1px_0_hsl(40_30%_85%/0.6),0_8px_24px_-12px_hsl(40_30%_30%/0.25)]"
    >
      {/* parchment fibres */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, hsl(35 40% 30%) 0 1px, transparent 2px), radial-gradient(circle at 78% 62%, hsl(110 30% 25%) 0 1px, transparent 2px)",
          backgroundSize: "180px 180px, 220px 220px",
        }}
      />

      {/* specimen plate */}
      <div className="relative h-32 flex items-center justify-center border-b border-amber-900/15 bg-[hsl(45_40%_94%)]/60 dark:bg-card/30">
        <span className="text-5xl select-none" aria-hidden>
          {species.emoji}
        </span>
        <span className="absolute top-2 left-2 text-[9px] font-serif uppercase tracking-[0.18em] text-amber-900/50 dark:text-amber-200/40">
          Specimen
        </span>
        <span className="absolute bottom-2 right-3 text-[10px] font-serif italic text-amber-900/55 dark:text-amber-200/45">
          {species.latin}
        </span>
      </div>

      <div className="relative p-4 space-y-3">
        <header>
          <h3 className="font-serif text-base text-foreground leading-tight">{species.common}</h3>
          <p className="text-[11px] font-serif text-muted-foreground/80 mt-1 leading-relaxed">
            {species.description}
          </p>
        </header>

        <div className="rounded-lg border border-amber-900/15 bg-[hsl(45_35%_96%)]/70 dark:bg-card/30 p-2.5">
          <div className="flex items-center gap-1.5 text-[9px] font-serif uppercase tracking-[0.15em] text-amber-900/60 dark:text-amber-200/55">
            <Leaf className="w-3 h-3" />
            Field clue
          </div>
          <p className="text-[12px] font-serif text-foreground/85 mt-1 leading-snug">{species.clue}</p>
        </div>

        <Link
          to={`/library/arborium?species=${species.slug}`}
          className="inline-flex items-center gap-1 text-[11px] font-serif text-primary/80 hover:text-primary transition-colors"
        >
          {species.questHint ?? "Related quests"}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.article>
  );
}

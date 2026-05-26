/**
 * QuestPathStrip — Lightweight conceptual bridge from the Arborium
 * to the Quest Cave. No live quest state — just an invitation.
 */
import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";

const PATHS = [
  { title: "Winter Bark Quest", hint: "Read trees by their winter skin" },
  { title: "First Blossoms",    hint: "Track the opening of spring" },
  { title: "Learn Your First 5 Trees", hint: "A gentle beginner's walk" },
  { title: "Ancient Oaks Nearby", hint: "Seek elders within your reach" },
];

export default function QuestPathStrip() {
  return (
    <section className="rounded-2xl border border-amber-900/15 bg-[hsl(45_35%_95%)]/70 dark:bg-card/30 p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-serif uppercase tracking-[0.18em] text-amber-900/55 dark:text-amber-200/55">
            From the Quest Cave
          </p>
          <h3 className="font-serif text-lg text-foreground mt-0.5">Quest Paths</h3>
          <p className="text-xs font-serif text-muted-foreground/80 mt-1 max-w-md leading-relaxed">
            What you learn here becomes living journeys in the Quest Cave —
            seasonal walks, recognitions, and small apprenticeships beneath real trees.
          </p>
        </div>
        <Link
          to="/library/quest-cave"
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-serif text-primary/80 hover:text-primary"
        >
          Open the Cave <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PATHS.map((p) => (
          <li
            key={p.title}
            className="flex items-start gap-2.5 rounded-xl border border-amber-900/10 bg-card/50 p-3"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              <Compass className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-serif text-sm text-foreground leading-tight">{p.title}</div>
              <div className="text-[11px] font-serif text-muted-foreground/75 mt-0.5">{p.hint}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

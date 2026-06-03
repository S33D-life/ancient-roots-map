/**
 * QuestPathStrip — Bridge from The Arborium to the Quest Cave.
 *
 * "Learn the clue. Walk the quest."
 * Five observation-based quest seeds tied directly to the ID clues taught above.
 * All placeholders — no live quest state. The structure is ready for wiring.
 */
import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";

const QUEST_SEEDS = [
  { title: "Find a lobed leaf",          hint: "Oak, hawthorn, or hazel — look closely at the edges" },
  { title: "Photograph bark texture",     hint: "Smooth, furrowed, peeling — each tree wears its age" },
  { title: "Notice the first blossom",   hint: "Blackthorn and hawthorn are often first" },
  { title: "Find a water-loving tree",   hint: "Follow a stream — willow or alder will be nearby" },
  { title: "Meet an evergreen",          hint: "Yew, holly, or pine — green in the depths of winter" },
];

export default function QuestPathStrip() {
  return (
    <section
      className="rounded-2xl border border-amber-900/14 dark:border-amber-200/12 p-5 space-y-4 bg-[hsl(45_35%_95%/0.75)] dark:bg-[hsl(80_16%_13%/0.75)]
        shadow-[inset_0_1px_0_hsl(48_40%_98%/0.6)] dark:shadow-[inset_0_1px_0_hsl(48_25%_22%/0.25)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-serif uppercase tracking-[0.18em] text-amber-900/52">
            Learn the clue · Walk the quest
          </p>
          <h3 className="font-serif text-lg text-foreground mt-0.5">Quest seeds</h3>
          <p className="text-xs font-serif text-muted-foreground/78 mt-1 max-w-md leading-relaxed">
            Each identification clue becomes a real walk. These are waiting for you in the Quest Cave.
          </p>
        </div>
        <Link
          to="/library/quest-cave"
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-serif text-primary/75 hover:text-primary transition-colors"
        >
          Open the Cave <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUEST_SEEDS.map((q) => (
          <li
            key={q.title}
            className="flex items-start gap-2.5 rounded-xl border border-amber-900/10 bg-card/45 p-3"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/18 shrink-0">
              <Compass className="w-3.5 h-3.5 text-primary/70" />
            </div>
            <div className="min-w-0">
              <div className="font-serif text-sm text-foreground leading-tight">{q.title}</div>
              <div className="text-[11px] font-serif text-muted-foreground/70 mt-0.5 leading-snug">{q.hint}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

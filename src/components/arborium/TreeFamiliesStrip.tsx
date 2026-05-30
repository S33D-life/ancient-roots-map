/**
 * TreeFamiliesStrip — A lightweight visual grouping of tree families.
 *
 * Introduces the idea that trees reveal themselves through shared family traits.
 * No taxonomy database — just five gentle groupings to orient new learners.
 * Designed to grow into family chambers over time.
 */

interface FamilyTile {
  emoji: string;
  name: string;
  hint: string;
}

const FAMILIES: FamilyTile[] = [
  { emoji: "🌳", name: "Broadleaf trees",    hint: "Oak, beech, ash, birch, sycamore" },
  { emoji: "🌲", name: "Conifers",           hint: "Yew, pine, larch, cedar, spruce" },
  { emoji: "🌸", name: "Thorn trees",        hint: "Hawthorn, blackthorn, wild rose" },
  { emoji: "💧", name: "Water-loving trees", hint: "Willow, alder, crack willow, poplar" },
  { emoji: "🪨", name: "Ancient elders",     hint: "Yew, oak, sweet chestnut, lime" },
];

export default function TreeFamiliesStrip() {
  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55">
          Tree Families
        </p>
        <h2 className="font-serif text-xl text-foreground mt-1">Some trees reveal themselves through family</h2>
        <p className="text-xs font-serif text-muted-foreground/80 mt-1 max-w-lg leading-relaxed">
          Learning one tree in a family helps you begin to recognise the others.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {FAMILIES.map((f) => (
          <div
            key={f.name}
            className="relative rounded-2xl border border-amber-900/15 bg-[hsl(45_35%_96%)]/70 p-3.5 flex flex-col gap-1.5"
            style={{
              boxShadow: "inset 0 1px 0 hsl(48 40% 98% / 0.7), 0 3px 12px -6px hsl(40 30% 25% / 0.1)",
            }}
          >
            <span className="text-2xl leading-none select-none" aria-hidden>{f.emoji}</span>
            <div>
              <div className="font-serif text-[12px] text-foreground leading-tight">{f.name}</div>
              <div className="text-[10px] font-serif text-muted-foreground/70 mt-0.5 leading-snug">{f.hint}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-serif italic text-muted-foreground/50 pt-1">
        Family chambers will open gradually — one species group at a time.
      </p>
    </section>
  );
}

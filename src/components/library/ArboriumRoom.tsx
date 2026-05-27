/**
 * ArboriumRoom — The living field guide of the forest.
 *
 * A daylight, botanical, study-oriented chamber of the Heartwood Library.
 * Built around a single principle: teach people how to look before they name.
 *
 * Page order (v2 — ID-first):
 *   1. Hero              — brief, grounded
 *   2. Tree ID Starter   — "what clue can you see?" (immediately practical)
 *   3. Pathways          — Learn to Identify (primary) + three secondary
 *   4. Specimen Shelf    — five starter species, ID-first cards
 *   5. Tree Families     — lightweight visual grouping
 *   6. Quest seeds       — bridge to the Quest Cave
 *   7. Photo ID          — coming-soon placeholder
 *   8. Footer note
 */
import { motion } from "framer-motion";
import {
  Compass,
  TreeDeciduous,
  BookOpen,
  Leaf,
  Camera,
  Sun,
} from "lucide-react";
import PathwayCard from "@/components/arborium/PathwayCard";
import SpeciesCard from "@/components/arborium/SpeciesCard";
import QuestPathStrip from "@/components/arborium/QuestPathStrip";
import IDStarterCard, { ID_STARTER_CLUES } from "@/components/arborium/IDStarterCard";
import TreeFamiliesStrip from "@/components/arborium/TreeFamiliesStrip";
import { STARTER_SPECIES } from "@/components/arborium/starterSpecies";
import FamilyModeToggle from "@/components/arborium/FamilyModeToggle";
import { useFamilyMode } from "@/components/arborium/useFamilyMode";

const ID_CHIPS = ["Leaf", "Bark", "Bud", "Seed", "Flower", "Silhouette", "Season"];

export default function ArboriumRoom() {
  const { familyMode, toggle } = useFamilyMode();

  return (
    <div className="space-y-10 pb-16">

      {/* ── 1. Hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative rounded-3xl overflow-hidden border border-amber-900/14 px-6 py-8 md:px-10 md:py-10"
        style={{
          background:
            "linear-gradient(160deg, hsl(48 55% 95%) 0%, hsl(72 35% 92%) 55%, hsl(95 30% 90%) 100%)",
          boxShadow:
            "inset 0 1px 0 hsl(48 45% 98%), 0 10px 32px -20px hsl(95 35% 25% / 0.32)",
        }}
      >
        {/* sun motif */}
        <div
          className="absolute -top-14 -right-14 w-56 h-56 rounded-full opacity-45 blur-3xl pointer-events-none"
          style={{ background: "hsl(48 80% 70% / 0.55)" }}
          aria-hidden
        />
        {/* pressed-leaf pattern */}
        <div
          className="absolute inset-0 opacity-[0.055] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 40%, hsl(95 40% 25%) 0 1px, transparent 3px), radial-gradient(ellipse at 75% 70%, hsl(35 50% 25%) 0 1px, transparent 3px)",
            backgroundSize: "120px 120px, 160px 160px",
          }}
          aria-hidden
        />

        <div className="relative max-w-2xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-900/20 bg-[hsl(48_55%_96%)]/70 text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/68">
              <Sun className="w-3 h-3" /> The Arborium
            </div>
            <FamilyModeToggle active={familyMode} onToggle={toggle} />
          </div>
          <h1 className="mt-3 font-serif text-2xl md:text-3xl leading-tight text-[hsl(95_30%_17%)]">
            {familyMode ? "Meet the trees" : "Learn to read the forest"}
          </h1>
          <p className="mt-2.5 font-serif text-sm md:text-base leading-relaxed text-[hsl(95_15%_28%)]/82 max-w-lg">
            {familyMode
              ? "Look at a leaf. Touch the bark. Find a seed. Each tree has clues — and you can learn to spot them."
              : "Begin with what you can see — a leaf, bark, a bud, a seed. The Arborium is the living field guide of the forest: botanical atlas, woodland apprenticeship, shared ecological memory."}
          </p>
        </div>

      </motion.section>

      {/* ── 2. Tree ID Starter ── */}
      <section id="identify" className="space-y-4 scroll-mt-20">
        <header>
          <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-200/55">
            Tree ID Starter
          </p>
          <h2 className="font-serif text-xl text-foreground mt-1">Look closely. Choose the clue you can see.</h2>
          <p className="text-xs font-serif text-muted-foreground/78 mt-1 max-w-xl leading-relaxed">
            You don't need to know the name. Start with one thing — a leaf shape, a bark texture,
            a seed. That's the beginning of recognition.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ID_STARTER_CLUES.map((clue, i) => (
            <IDStarterCard key={clue.title} {...clue} index={i} />
          ))}
        </div>
      </section>

      {/* ── 3. Pathways ── */}
      <section className="space-y-4">
        <header>
          <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-200/55">
            Pathways
          </p>
          <h2 className="font-serif text-xl text-foreground mt-1">Choose a way in</h2>
        </header>

        {/* Primary pathway — full width */}
        <PathwayCard
          to="/library/arborium#identify"
          icon={Leaf}
          emoji="🌿"
          title="Learn to Identify"
          description="Begin with leaves, bark, buds, seeds, silhouette, and season. Each clue narrows the family."
          hue={95}
          index={0}
          primary
          chips={ID_CHIPS}
        />

        {/* Secondary pathways — grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PathwayCard
            to="/library/quest-cave"
            icon={Compass}
            emoji="🧭"
            title="Tree Quests"
            description="Seasonal journeys connected to the Quest Cave."
            hue={45}
            index={1}
          />
          <PathwayCard
            to="/library/arborium#families"
            icon={TreeDeciduous}
            emoji="🍂"
            title="Tree Families"
            description="Oak, Yew, Willow, Ash, Beech and their kin."
            hue={30}
            index={2}
            comingSoon
          />
          <PathwayCard
            to="/library/arborium#myth"
            icon={BookOpen}
            emoji="📖"
            title="Myth & Medicine"
            description="Folklore, ecology, medicinal uses, old stories."
            hue={75}
            index={3}
            comingSoon
          />
        </div>
      </section>

      {/* ── 4. Specimen Shelf ── */}
      <section className="space-y-4">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-200/55">
              Field Guide · Beginning
            </p>
            <h2 className="font-serif text-xl text-foreground mt-1">Your first five trees</h2>
            <p className="text-xs font-serif text-muted-foreground/78 mt-1 max-w-xl leading-relaxed">
              Five trees to meet over five weeks. Greet each one where it grows.
            </p>
          </div>
          <span className="hidden sm:block text-[10px] font-serif uppercase tracking-[0.18em] text-amber-900/42 shrink-0">
            Specimen shelf
          </span>
        </header>

        <div
          className={`grid gap-4 ${
            familyMode
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {STARTER_SPECIES.map((s, i) => (
            <SpeciesCard key={s.slug} species={s} index={i} familyMode={familyMode} />
          ))}
        </div>

      </section>

      {/* ── 5. Tree Families ── */}
      <TreeFamiliesStrip />

      {/* ── 6. Quest seeds ── */}
      <QuestPathStrip />

      {/* ── 7. Photo ID — coming soon ── */}
      <section>
        <div
          className="relative rounded-2xl border border-dashed border-amber-900/20 dark:border-amber-200/15 p-5 flex items-start gap-4"
          style={{ background: "hsl(45 30% 96% / 0.5)" }}
        >
          <div className="shrink-0 p-2.5 rounded-xl border border-amber-900/15 bg-[hsl(45_40%_95%)]/70">
            <Camera className="w-5 h-5 text-amber-900/45 dark:text-amber-200/45" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <p className="font-serif text-sm text-foreground/80">Photo ID</p>
              <span className="text-[9px] font-serif uppercase tracking-[0.18em] text-amber-900/50 dark:text-amber-200/50 border border-amber-900/20 rounded-full px-2 py-0.5">
                Coming soon
              </span>
            </div>
            <p className="text-xs font-serif text-muted-foreground/72 leading-relaxed max-w-md">
              Photograph a leaf, bark, bud, seed, or whole tree to begin narrowing the species.
              The clue you choose shapes the result.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ── */}
      <p className="text-center text-[11px] font-serif italic text-muted-foreground/52">
        The Arborium grows slowly, like its trees. Species pages, family chambers,
        and seasonal observations will open over time.
      </p>
    </div>
  );
}

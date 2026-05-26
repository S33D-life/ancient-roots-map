/**
 * ArboriumRoom — The living field guide of the forest.
 *
 * A daylight, botanical, study-oriented chamber of the Heartwood Library.
 * Tightly woven with the Quest Cave: recognition learned here becomes
 * living journeys there.
 *
 * First foundation only — landing + four pathway cards + a beginner
 * tree guide prototype + lightweight Quest Cave bridge. Reusable
 * structure (`SpeciesCard`, `PathwayCard`, `starterSpecies`) is prepared
 * for future species pages, AI identification, leaf/bark matching,
 * seasonal observations, family mode, and species councils.
 */
import { motion } from "framer-motion";
import { Leaf, Compass, TreeDeciduous, BookOpen, Sparkles, Sun } from "lucide-react";
import PathwayCard from "@/components/arborium/PathwayCard";
import SpeciesCard from "@/components/arborium/SpeciesCard";
import QuestPathStrip from "@/components/arborium/QuestPathStrip";
import { STARTER_SPECIES } from "@/components/arborium/starterSpecies";

export default function ArboriumRoom() {
  return (
    <div className="space-y-10 pb-16">
      {/* ── Hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden border border-amber-900/15 px-6 py-10 md:px-10 md:py-14"
        style={{
          background:
            "linear-gradient(160deg, hsl(48 55% 95%) 0%, hsl(72 35% 92%) 55%, hsl(95 30% 90%) 100%)",
          boxShadow:
            "inset 0 1px 0 hsl(48 45% 98%), 0 12px 36px -22px hsl(95 35% 25% / 0.35)",
        }}
      >
        {/* sun motif */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-50 blur-3xl pointer-events-none"
          style={{ background: "hsl(48 80% 70% / 0.6)" }}
          aria-hidden
        />
        {/* faint pressed-leaf pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 40%, hsl(95 40% 25%) 0 1px, transparent 3px), radial-gradient(ellipse at 75% 70%, hsl(35 50% 25%) 0 1px, transparent 3px)",
            backgroundSize: "120px 120px, 160px 160px",
          }}
          aria-hidden
        />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-900/20 bg-[hsl(48_55%_96%)]/70 text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/70">
            <Sun className="w-3 h-3" /> The Arborium
          </div>
          <h1 className="mt-4 font-serif text-3xl md:text-4xl leading-tight text-[hsl(95_30%_18%)]">
            Learn the language of the living forest
          </h1>
          <p className="mt-4 font-serif text-sm md:text-base leading-relaxed text-[hsl(95_15%_28%)]/85">
            S33D is not only a place to encounter trees — it is a place to slowly
            recognise them. The Arborium is the living field guide of the forest:
            part botanical atlas, part woodland apprenticeship, part shared
            ecological memory.
          </p>
        </div>
      </motion.section>

      {/* ── Pathways ── */}
      <section className="space-y-4">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-200/55">
              Pathways
            </p>
            <h2 className="font-serif text-xl text-foreground mt-1">Choose a way in</h2>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PathwayCard
            to="/library/arborium#identify"
            icon={Leaf}
            emoji="🌿"
            title="Learn to Identify"
            description="Leaves, bark, buds, seeds, silhouettes, seasonal clues."
            hue={95}
            index={0}
          />
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
            description="Oak, Yew, Willow, Ash, Beech and more."
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

      {/* ── Beginner tree guide ── */}
      <section id="identify" className="space-y-4 scroll-mt-24">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-200/55">
              Field Guide · Beginning
            </p>
            <h2 className="font-serif text-xl text-foreground mt-1">Learn your first trees</h2>
            <p className="text-xs font-serif text-muted-foreground/80 mt-1 max-w-xl leading-relaxed">
              Five gentle starting trees. Read one a week. Greet it where it grows.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-serif uppercase tracking-[0.18em] text-amber-900/45">
            <Sparkles className="w-3 h-3" /> Specimen shelf
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STARTER_SPECIES.map((s, i) => (
            <SpeciesCard key={s.slug} species={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── Quest Cave bridge ── */}
      <QuestPathStrip />

      {/* ── Footer note ── */}
      <p className="text-center text-[11px] font-serif italic text-muted-foreground/60">
        The Arborium grows slowly, like its trees. Species pages, family
        chambers and seasonal observations will open over time.
      </p>
    </div>
  );
}

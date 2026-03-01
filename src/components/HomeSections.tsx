import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Heart, TreeDeciduous, Users, Sparkles, BookOpen,
  Leaf, Crown, Globe, Music, Sprout, ScrollText, Hexagon, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── 1. Identity Tagline — shown right after the hero ─── */
export const IdentitySection = () => (
  <section id="identity" className="relative py-20 md:py-28 overflow-hidden">
    <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
    <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl space-y-6">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground/90 italic"
      >
        "A globally distributed, locally curated living library of seeds, stories, and mystery."
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto"
      >
        S33D maps the world's ancient trees, gathers wisdom from those who walk among them,
        and weaves it all into a planetary tapestry of living memory.
      </motion.p>

      {/* Value chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 pt-4"
      >
        {[
          { icon: MapPin, text: "Map trees" },
          { icon: ScrollText, text: "Gather wisdom" },
          { icon: Heart, text: "Earn hearts" },
          { icon: Users, text: "Join councils" },
        ].map(({ icon: Icon, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif border border-border/40 bg-card/50 backdrop-blur-sm text-foreground/70"
          >
            <Icon className="w-3.5 h-3.5 text-primary" />
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── 1b. Quick discovery row — Countries & Hives ─── */
export const DiscoveryRow = () => {
  const [treeCount, setTreeCount] = useState(0);

  useEffect(() => {
    supabase.from("trees").select("id", { count: "exact", head: true }).then(({ count }) => {
      if (count) setTreeCount(count);
    });
  }, []);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/atlas"
              className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-5 py-4 hover:bg-card/60 hover:border-primary/30 transition-all duration-300"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "hsl(195 60% 50% / 0.15)" }}
              >
                <Globe className="w-5 h-5" style={{ color: "hsl(195 60% 50%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm text-foreground/90 group-hover:text-primary transition-colors">
                  Browse by Country
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {treeCount > 0 ? `${treeCount.toLocaleString()} trees across nations` : "Explore country atlases"}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <Link
              to="/hives"
              className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-5 py-4 hover:bg-card/60 hover:border-primary/30 transition-all duration-300"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "hsl(45 100% 55% / 0.15)" }}
              >
                <Hexagon className="w-5 h-5" style={{ color: "hsl(45 100% 55%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm text-foreground/90 group-hover:text-primary transition-colors">
                  Species Hives
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Find your botanical family
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── 2. Focused CTA — single primary action ─── */
export const ParticipationSection = () => (
  <section id="participate" className="py-16 md:py-24">
    <div className="container mx-auto px-4 max-w-2xl text-center">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl md:text-3xl font-serif mb-3"
      >
        Begin Your Journey
      </motion.h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
        Every ancient tree has a story. Find yours.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link to="/add-tree">
          <Button variant="mystical" size="lg" className="gap-2 text-base px-8">
            <MapPin className="w-5 h-5" />
            Map Your First Ancient Friend
          </Button>
        </Link>
        <Link to="/atlas">
          <Button variant="outline" size="lg" className="gap-2 text-sm px-6 border-border/40 text-muted-foreground hover:text-foreground">
            <Globe className="w-4 h-4" />
            Explore the Atlas
          </Button>
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-xs text-muted-foreground/50 font-serif"
      >
        +10 Hearts for every tree you map
      </motion.p>
    </div>
  </section>
);

/* ─── 3. Mini Map Preview — static image with CTA ─── */
export const MapPreviewSection = () => {
  const [treeCount, setTreeCount] = useState(0);

  useEffect(() => {
    supabase.from("trees").select("id", { count: "exact", head: true }).then(({ count }) => {
      if (count) setTreeCount(count);
    });
  }, []);

  return (
    <section id="atlas-preview" className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-serif text-center mb-3"
        >
          The Arboreal Atlas of Ancient Friends
        </motion.h2>
        <p className="text-center text-muted-foreground text-sm mb-8 max-w-md mx-auto">
          {treeCount > 0
            ? `${treeCount.toLocaleString()} Ancient Friends mapped across nations. Explore the living grove.`
            : "Ancient Friends mapped across nations. Tap to explore."}
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/30"
          style={{ height: "clamp(280px, 50vw, 420px)" }}
        >
          {/* Atmospheric map placeholder — avoids iframe recursion */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `
                radial-gradient(ellipse at 30% 40%, hsl(120 30% 20% / 0.4), transparent 60%),
                radial-gradient(ellipse at 70% 60%, hsl(195 40% 25% / 0.3), transparent 50%),
                hsl(var(--card))
              `,
            }}
          >
            <div className="text-center space-y-4">
              <Globe className="w-16 h-16 text-primary/30 mx-auto" />
              <p className="text-sm text-muted-foreground/60 font-serif">The planetary grove awaits</p>
            </div>
          </div>

          {/* Clickable overlay to go to full map */}
          <Link
            to="/map"
            className="absolute inset-0 z-10 flex items-end justify-center pb-6"
          >
            <Button variant="mystical" size="lg" className="shadow-lg">
              <Globe className="w-4 h-4 mr-2" />
              Enter the Atlas
            </Button>
          </Link>
          {/* Legend overlay */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 text-[10px] text-foreground/70 bg-card/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(42 95% 55%)" }} />
              Ancient (500+ yrs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(120 45% 50%)" }} />
              Storied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(195 50% 50%)" }} />
              Notable
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-2.5 h-2.5 text-destructive" />
              Heart Pool
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── 4. Living Scroll — Wisdom Showcase ─── */
const WISDOM_SNIPPETS = [
  { icon: TreeDeciduous, category: "Tree Wisdom", text: "The Fortingall Yew has witnessed 3,000 years of seasons. It asks nothing in return." },
  { icon: ScrollText, category: "Pilgrim Story", text: "I walked three days through rain to find the Grandfather Oak. When I arrived, the sun broke through." },
  { icon: Sprout, category: "Seed Lore", text: "Every seed carries a memory of the forest it came from and a dream of the forest it will become." },
  { icon: Users, category: "Council Minute", text: "The Council voted to protect all yew trees over 500 years. The motion passed unanimously." },
  { icon: Heart, category: "Heart Balance", text: "142 hearts gathered this moon cycle. The grove grows stronger with each offering." },
  { icon: Music, category: "Song Offering", text: "A wanderer played violin beneath the cherry blossoms. The recording lives in the Heartwood Library." },
];

export const LivingScrollSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % WISDOM_SNIPPETS.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const current = WISDOM_SNIPPETS[activeIdx];
  const Icon = current.icon;

  return (
    <section id="wisdom" className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-serif text-center mb-10">
          Living Scroll
        </h2>

        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10 text-center space-y-4"
        >
          <div className="flex justify-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-serif">
            {current.category}
          </p>
          <p className="font-serif text-base md:text-lg text-foreground/85 leading-relaxed italic max-w-xl mx-auto">
            "{current.text}"
          </p>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 pt-3">
            {WISDOM_SNIPPETS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: i === activeIdx ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.25)",
                  transform: i === activeIdx ? "scale(1.4)" : "scale(1)",
                }}
                aria-label={`Show wisdom ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── 5. TETOL Navigation Anchors ─── */
const TETOL_NAV = [
  { icon: TreeDeciduous, label: "Ancient Friends", sublabel: "The Roots — Living Atlas", to: "/map", accent: "120 45% 45%" },
  { icon: BookOpen, label: "Heartwood Library", sublabel: "The Trunk — Stories & Offerings", to: "/library", accent: "28 70% 50%" },
  { icon: Leaf, label: "Council of Life", sublabel: "The Canopy — Governance & Voice", to: "/council-of-life", accent: "195 60% 50%" },
  { icon: Crown, label: "yOur Golden Dream", sublabel: "The Crown — Vision & Purpose", to: "/golden-dream", accent: "45 100% 60%" },
];

export const TetolNavSection = () => (
  <section id="navigate" className="py-16 md:py-24">
    <div className="container mx-auto px-4 max-w-4xl">
      <h2 className="text-2xl md:text-3xl font-serif text-center mb-3">
        The Ethereal Tree of Life
      </h2>
      <p className="text-center text-muted-foreground text-sm mb-10 max-w-md mx-auto">
        Navigate the living structure from roots to crown.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TETOL_NAV.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={item.to}
                className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm px-5 py-4 hover:bg-card/50 hover:border-primary/30 transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `hsl(${item.accent} / 0.15)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${item.accent})` }} />
                </div>
                <div>
                  <p className="font-serif text-sm text-foreground/90 group-hover:text-primary transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">{item.sublabel}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

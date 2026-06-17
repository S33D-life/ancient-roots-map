/**
 * TrunkSection — Heartwood Library preview for the tree scroll.
 * Trunk = warm ember tones, bark texture, lantern warmth.
 * Feels like the warm interior of the tree — the core living body.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Music, Wand2, ScrollText, Sprout, Lock, ArrowRight, Star, Map } from "lucide-react";
import SectionAtmosphere from "./SectionAtmosphere";
import TrunkChamberDoor, { type ChamberDepth } from "./TrunkChamberDoor";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

// Chambers carved into the trunk. Order matters: higher up the trunk on the left,
// deeper toward the roots on the right. Hue + depth define each chamber's interior.
type Chamber = {
  icon: typeof BookOpen;
  title: string;
  description: string;
  to: string;
  tempH: number;          // 38 amber · 128 green · 205 blue · 268 violet · 22 ember · 48 star-gold
  depth: ChamberDepth;
};

const LIBRARY_ROOMS: Chamber[] = [
  { icon: Star,       title: "Star Trail",        description: "High toward the canopy",  to: "/library/star-trail",  tempH: 48,  depth: "canopy-leaning" },
  { icon: Music,      title: "Music Room",        description: "A resonant chamber",      to: "/library/music-room",  tempH: 268, depth: "heartwood"      },
  { icon: ScrollText, title: "Scrolls & Records", description: "Shelves in heartwood",    to: "/library/ledger",      tempH: 38,  depth: "heartwood"      },
  { icon: Map,        title: "Map Room",          description: "Cartographer's alcove",   to: "/library/atlas",       tempH: 205, depth: "heartwood"      },
  { icon: Wand2,      title: "Staff Room",        description: "144 living staffs",       to: "/library/staff-room",  tempH: 38,  depth: "heartwood"      },
];

const PERSONAL_SPACES: Chamber[] = [
  { icon: Sprout, title: "Seed Cellar", description: "Lower, near the roots",  to: "/library/seed-cellar", tempH: 22,  depth: "root-leaning" },
  { icon: Lock,   title: "Vault",       description: "Behind a heavy door",    to: "/vault",               tempH: 268, depth: "root-leaning" },
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: EASE as unknown as [number, number, number, number] },
  }),
};

const TrunkSection = () => {
  const depth = useDepthStyle();
  const { sectionRef, style: parallaxStyle } = useParallaxDepth({ maxOffset: 3 });

  const titleLayout = useDepthBalancedText({
    text: "HeARTwood Library",
    font: '400 clamp(30px, 5vw, 48px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 52,
    zone: depth.zone,
  });

  const descLayout = useDepthBalancedText({
    text: "The living centre. Stories, offerings, and the fire that burns quietly — where your journey is remembered and the grove grows from every heart.",
    font: '400 clamp(14px, 2vw, 16px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 28,
    zone: depth.zone,
  });

  return (
    <section
      ref={sectionRef}
      id="heartwood"
      className="flex flex-col items-center justify-center px-6 py-24 md:py-32 relative overflow-hidden"
    >
      <SectionAtmosphere theme="trunk" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl text-center space-y-6"
        style={{ letterSpacing: depth.letterSpacing, ...parallaxStyle }}
      >
        <DepthRevealText
          as="p"
          className="text-[10px] uppercase tracking-[0.35em] font-serif text-foreground/45"
        >
          🪵 The Trunk
        </DepthRevealText>

        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "hsl(28 55% 45% / 0.12)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen className="w-5 h-5" style={{ color: "hsl(28 60% 58%)" }} />
        </motion.div>

        <DepthRevealText
          as="h2"
          delay={100}
          className="text-3xl md:text-5xl font-serif tracking-wide"
          style={{
            color: "hsl(30 55% 65%)",
            lineHeight: depth.lineHeight,
            ...(titleLayout.ready && titleLayout.balancedWidth
              ? { maxWidth: titleLayout.balancedWidth, margin: "0 auto" }
              : {}),
          }}
        >
          <span ref={titleLayout.containerRef as any}>HeARTwood Library</span>
        </DepthRevealText>

        {/* Anchor sentence */}
        <DepthRevealText
          delay={150}
          className="font-serif text-base md:text-lg max-w-md mx-auto"
          style={{ color: "hsl(35 30% 88%)", lineHeight: 1.55 }}
        >
          The library of every journey, song, and offering left at a tree.
        </DepthRevealText>

        <DepthRevealText
          delay={250}
          className="text-foreground/65 font-serif text-sm md:text-base max-w-sm mx-auto"
          style={{
            lineHeight: depth.lineHeight,
            ...(descLayout.ready && descLayout.balancedWidth
              ? { maxWidth: descLayout.balancedWidth }
              : {}),
          }}
        >
          <span ref={descLayout.containerRef as any}>
            The living centre. Stories, offerings, and the fire that burns quietly —
            where your journey is remembered and the grove grows from every heart.
          </span>
        </DepthRevealText>

        {/* Wonder line */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif italic text-base md:text-lg mx-auto max-w-xs text-foreground/55"
          style={getWonderLineStyle(depth.zone)}
        >
          Where your journey is remembered.
        </DepthRevealText>

        {/* Chambers carved into the trunk — doorways with warm interior bleed */}
        <div className="depth-reveal-trunk grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 pt-6 max-w-xl mx-auto">
          {LIBRARY_ROOMS.map((room, i) => (
            <motion.div
              key={room.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              style={{ ['--i' as any]: i }}
            >
              <TrunkChamberDoor {...room} />
            </motion.div>
          ))}
        </div>

        {/* Personal spaces — deeper chambers, closer to the roots */}
        <p className="text-[9px] uppercase tracking-[0.3em] font-serif text-muted-foreground/30 pt-6">
          Personal Chambers · Closer to the Roots
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-[14rem] mx-auto">
          {PERSONAL_SPACES.map((room, i) => (
            <motion.div
              key={room.title}
              custom={i + LIBRARY_ROOMS.length}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              <TrunkChamberDoor {...room} />
            </motion.div>
          ))}
        </div>

        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/40 hover:text-primary/70 transition-colors duration-300 pt-1"
        >
          Enter the Heartwood <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>

      {/* Organic transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(var(--background) / 0.4))",
        }}
      />
    </section>
  );
};

export default TrunkSection;

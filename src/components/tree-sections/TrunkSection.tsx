/**
 * TrunkSection — Heartwood Library preview for the tree scroll.
 * Trunk = warm ember tones, bark texture, lantern warmth.
 *
 * PRETEXT: Title + description use balanced wrapping.
 * DEPTH-TEXT: Letter spacing and line height respond to scroll depth.
 * WONDER LINE: "where your journey is remembered" treated as a wonder moment.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Music, Wand2, ScrollText, Sprout, Lock, ArrowRight } from "lucide-react";
import LeafAtmosphere from "../LeafAtmosphere";
import SectionAtmosphere from "./SectionAtmosphere";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";

const LIBRARY_ROOMS = [
  { icon: Wand2, title: "Staff Room", description: "Living wooden staffs", to: "/library/staff-room" },
  { icon: Music, title: "Music Room", description: "Songs offered to trees", to: "/library/music-room" },
  { icon: ScrollText, title: "Scrolls & Records", description: "Community ledger", to: "/library/ledger" },
];

const PERSONAL_SPACES = [
  { icon: Sprout, title: "Seed Cellar", description: "Living data archive", to: "/library/seed-cellar" },
  { icon: Lock, title: "Vault", description: "Your personal archive", to: "/vault" },
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
      id="heartwood"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-28 relative overflow-hidden"
    >
      <SectionAtmosphere theme="trunk" />
      <LeafAtmosphere variant="heartwood" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl text-center space-y-8"
        style={{ letterSpacing: depth.letterSpacing }}
      >
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "hsl(28 55% 45% / 0.1)" }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen className="w-6 h-6" style={{ color: "hsl(28 55% 50%)" }} />
        </motion.div>

        <DepthRevealText
          as="p"
          className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/40"
        >
          The Trunk
        </DepthRevealText>

        <DepthRevealText
          as="h2"
          delay={100}
          className="text-3xl md:text-5xl font-serif tracking-wide"
          style={{
            color: "hsl(30 50% 55%)",
            lineHeight: depth.lineHeight,
            ...(titleLayout.ready && titleLayout.balancedWidth
              ? { maxWidth: titleLayout.balancedWidth, margin: "0 auto" }
              : {}),
          }}
        >
          <span ref={titleLayout.containerRef as any}>HeARTwood Library</span>
        </DepthRevealText>

        <DepthRevealText
          delay={200}
          className="text-muted-foreground/60 font-serif text-sm md:text-base max-w-sm mx-auto"
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

        {/* ── Wonder line ── */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif text-lg md:text-xl mx-auto max-w-xs"
          style={getWonderLineStyle(depth.zone)}
        >
          Where your journey is remembered.
        </DepthRevealText>

        {/* Library rooms */}
        <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
          {LIBRARY_ROOMS.map((room, i) => {
            const Icon = room.icon;
            return (
              <motion.div
                key={room.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                <Link
                  to={room.to}
                  className="group flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border border-border/15 bg-card/15 backdrop-blur-sm hover:border-primary/25 hover:bg-card/30 transition-all duration-500"
                >
                  <Icon className="w-4.5 h-4.5 text-primary/50 group-hover:text-primary/80 transition-colors duration-300" />
                  <p className="font-serif text-[13px] text-foreground/75 tracking-wide">{room.title}</p>
                  <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{room.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Personal spaces */}
        <p className="text-[9px] uppercase tracking-[0.3em] font-serif text-muted-foreground/30 pt-6">
          Personal Spaces
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {PERSONAL_SPACES.map((room, i) => {
            const Icon = room.icon;
            return (
              <motion.div
                key={room.title}
                custom={i + LIBRARY_ROOMS.length}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                <Link
                  to={room.to}
                  className="group flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border border-border/15 bg-card/15 backdrop-blur-sm hover:border-primary/25 hover:bg-card/30 transition-all duration-500"
                >
                  <Icon className="w-4.5 h-4.5 text-primary/50 group-hover:text-primary/80 transition-colors duration-300" />
                  <p className="font-serif text-[13px] text-foreground/75 tracking-wide">{room.title}</p>
                  <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{room.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/50 hover:text-primary/80 transition-colors duration-300 pt-2"
        >
          Enter the Heartwood <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>

      <div className="vine-divider" />
    </section>
  );
};

export default TrunkSection;

/**
 * CrownSection — "yOur Golden Dream" preview for the tree scroll.
 * Crown = brightest, most luminous section. Golden radiance + solarpunk sky.
 * Feels like looking up into the highest branches where light pours through.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Cherry, Archive, ArrowRight } from "lucide-react";
import SectionAtmosphere from "./SectionAtmosphere";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

const ROOMS = [
  { icon: BookOpen, title: "Current Vision", description: "The living S33D blueprint", to: "/golden-dream" },
  { icon: Cherry, title: "Popular Fruit", description: "Next S33D likely to sprout", to: "/golden-dream" },
  { icon: Archive, title: "Archives", description: "Past versions of the dream", to: "/golden-dream" },
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

const CrownSection = () => {
  const depth = useDepthStyle();
  const { sectionRef, style: parallaxStyle } = useParallaxDepth({ maxOffset: 5, direction: -1 });

  const titleLayout = useDepthBalancedText({
    text: "yOur Golden Dream",
    font: '400 clamp(30px, 5vw, 48px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 52,
    zone: depth.zone,
  });

  const descLayout = useDepthBalancedText({
    text: "A living vision shaped by every wanderer who passes through the grove.",
    font: '400 clamp(14px, 2vw, 16px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 28,
    zone: depth.zone,
  });

  return (
    <section
      ref={sectionRef}
      id="golden-dream"
      className="flex flex-col items-center justify-center px-6 py-24 md:py-32 relative overflow-hidden"
    >
      <SectionAtmosphere theme="crown" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl text-center space-y-6"
        style={{ letterSpacing: depth.letterSpacing, ...parallaxStyle }}
      >
        {/* Zone label */}
        <DepthRevealText
          as="p"
          className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/30"
        >
          ↑ The Crown
        </DepthRevealText>

        {/* Floating icon */}
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "hsl(45 80% 55% / 0.08)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-5 h-5" style={{ color: "hsl(45 80% 60%)" }} />
        </motion.div>

        <DepthRevealText
          as="h2"
          delay={100}
          className="text-3xl md:text-5xl font-serif tracking-wide"
          style={{
            color: "hsl(45 70% 62%)",
            lineHeight: depth.lineHeight,
            ...(titleLayout.ready && titleLayout.balancedWidth
              ? { maxWidth: titleLayout.balancedWidth, margin: "0 auto" }
              : {}),
          }}
        >
          <span ref={titleLayout.containerRef as any}>yOur Golden Dream</span>
        </DepthRevealText>

        <DepthRevealText
          delay={200}
          className="text-muted-foreground/50 font-serif text-sm md:text-base max-w-sm mx-auto"
          style={{
            lineHeight: depth.lineHeight,
            ...(descLayout.ready && descLayout.balancedWidth
              ? { maxWidth: descLayout.balancedWidth }
              : {}),
          }}
        >
          <span ref={descLayout.containerRef as any}>
            A living vision shaped by every wanderer who passes through the grove.
          </span>
        </DepthRevealText>

        {/* Wonder line */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif text-lg md:text-xl mx-auto max-w-xs"
          style={getWonderLineStyle(depth.zone)}
        >
          The dream grows with the tree.
        </DepthRevealText>

        {/* Doorway cards — embedded, not floating */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
          {ROOMS.map((room, i) => {
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
                  className="group flex flex-col items-center gap-2 px-4 py-4 rounded-lg transition-all duration-500 hover:bg-foreground/[0.03]"
                >
                  <Icon className="w-4 h-4 text-foreground/30 group-hover:text-primary/60 transition-colors duration-300" />
                  <p className="font-serif text-[13px] text-foreground/60 tracking-wide">{room.title}</p>
                  <p className="text-[9px] text-muted-foreground/35 leading-relaxed">{room.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <Link
          to="/golden-dream"
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/40 hover:text-primary/70 transition-colors duration-300 pt-1"
        >
          Enter the full Golden Dream <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>

      {/* Organic transition — not a hard line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(var(--background) / 0.4))",
        }}
      />
    </section>
  );
};

export default CrownSection;

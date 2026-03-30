/**
 * CanopySection — Council of Life preview for the tree scroll.
 * Canopy = green-toned, communal, gathering energy.
 * Feels like a sheltered space among branches where people gather.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Users, ScrollText, Podcast, CalendarDays, ArrowRight } from "lucide-react";
import SectionAtmosphere from "./SectionAtmosphere";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

const COUNCIL_LINKS = [
  { icon: ScrollText, title: "Council Records", description: "Past councils & decisions", to: "/council-of-life" },
  { icon: Users, title: "Join Council", description: "Become a member via Telegram", href: "https://t.me/s33dlife" },
  { icon: Podcast, title: "Host a Pod", description: "Start a local pod gathering", to: "/council-of-life" },
  { icon: CalendarDays, title: "Next Council", description: "Upcoming council dates", to: "/council-of-life" },
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

const CanopySection = () => {
  const { sectionRef, style: parallaxStyle } = useParallaxDepth({ maxOffset: 4, direction: -1 });

  const titleLayout = useDepthBalancedText({
    text: "Council of Life",
    font: '400 clamp(30px, 5vw, 48px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 52,
    zone: depth.zone,
  });

  const descLayout = useDepthBalancedText({
    text: "Where the grove gathers. Community governance, ecological councils, and the voice of every wanderer who walks beneath the canopy.",
    font: '400 clamp(14px, 2vw, 16px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 28,
    zone: depth.zone,
  });

  return (
    <section
      id="council"
      className="flex flex-col items-center justify-center px-6 py-24 md:py-32 relative overflow-hidden"
    >
      <SectionAtmosphere theme="canopy" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl text-center space-y-6"
        style={{ letterSpacing: depth.letterSpacing }}
      >
        <DepthRevealText
          as="p"
          className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/30"
        >
          The Canopy
        </DepthRevealText>

        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "hsl(150 40% 35% / 0.08)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="w-5 h-5" style={{ color: "hsl(150 40% 45%)" }} />
        </motion.div>

        <DepthRevealText
          as="h2"
          delay={100}
          className="text-3xl md:text-5xl font-serif tracking-wide"
          style={{
            color: "hsl(150 35% 52%)",
            lineHeight: depth.lineHeight,
            ...(titleLayout.ready && titleLayout.balancedWidth
              ? { maxWidth: titleLayout.balancedWidth, margin: "0 auto" }
              : {}),
          }}
        >
          <span ref={titleLayout.containerRef as any}>Council of Life</span>
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
            Where the grove gathers. Community governance, ecological councils,
            and the voice of every wanderer who walks beneath the canopy.
          </span>
        </DepthRevealText>

        {/* Wonder line */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif text-lg md:text-xl mx-auto max-w-xs"
          style={getWonderLineStyle(depth.zone)}
        >
          Every voice shapes the canopy.
        </DepthRevealText>

        {/* Doorway cards — embedded, organic */}
        <div className="grid grid-cols-2 gap-2 pt-4 max-w-md mx-auto">
          {COUNCIL_LINKS.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className="group flex flex-col items-center gap-2 px-4 py-4 rounded-lg transition-all duration-500 hover:bg-foreground/[0.03]">
                <Icon className="w-4 h-4 text-foreground/30 group-hover:text-primary/60 transition-colors duration-300" />
                <p className="font-serif text-[13px] text-foreground/60 tracking-wide">{item.title}</p>
                <p className="text-[9px] text-muted-foreground/35 leading-relaxed">{item.description}</p>
              </div>
            );

            return (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <Link to={item.to!}>{inner}</Link>
                )}
              </motion.div>
            );
          })}
        </div>

        <Link
          to="/council-of-life"
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/40 hover:text-primary/70 transition-colors duration-300 pt-1"
        >
          Enter the Council <ArrowRight className="w-3 h-3" />
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

export default CanopySection;

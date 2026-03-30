/**
 * CanopySection — Council of Life preview for the tree scroll.
 * Canopy = green-toned, communal, gathering energy + branch silhouettes.
 *
 * PRETEXT: Title + description use balanced wrapping.
 * DEPTH-TEXT: Letter spacing and line height respond to scroll depth.
 * WONDER LINE: "the voice of every wanderer" treated as a wonder moment.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Users, ScrollText, Podcast, CalendarDays, ArrowRight } from "lucide-react";
import LeafAtmosphere from "../LeafAtmosphere";
import SectionAtmosphere from "./SectionAtmosphere";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";

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
  const depth = useDepthStyle();

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
      className="min-h-screen flex flex-col items-center justify-center px-6 py-28 relative overflow-hidden"
    >
      <SectionAtmosphere theme="canopy" />
      <LeafAtmosphere variant="canopy" />

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
          style={{ background: "hsl(150 40% 35% / 0.1)" }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="w-6 h-6" style={{ color: "hsl(150 40% 45%)" }} />
        </motion.div>

        <DepthRevealText
          as="p"
          className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/40"
        >
          The Canopy
        </DepthRevealText>

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
          className="text-muted-foreground/60 font-serif text-sm md:text-base max-w-sm mx-auto"
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

        {/* ── Wonder line ── */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif text-lg md:text-xl mx-auto max-w-xs"
          style={getWonderLineStyle(depth.zone)}
        >
          Every voice shapes the canopy.
        </DepthRevealText>

        <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
          {COUNCIL_LINKS.map((item, i) => {
            const Icon = item.icon;
            const card = (
              <div className="group flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border border-border/15 bg-card/15 backdrop-blur-sm hover:border-primary/25 hover:bg-card/30 transition-all duration-500">
                <Icon className="w-4.5 h-4.5 text-primary/50 group-hover:text-primary/80 transition-colors duration-300" />
                <p className="font-serif text-[13px] text-foreground/75 tracking-wide">{item.title}</p>
                <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{item.description}</p>
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
                  <a href={item.href} target="_blank" rel="noopener noreferrer">{card}</a>
                ) : (
                  <Link to={item.to!}>{card}</Link>
                )}
              </motion.div>
            );
          })}
        </div>

        <Link
          to="/council-of-life"
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/50 hover:text-primary/80 transition-colors duration-300 pt-2"
        >
          Enter the Council <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>

      <div className="vine-divider" />
    </section>
  );
};

export default CanopySection;

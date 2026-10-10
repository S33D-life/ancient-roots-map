/**
 * CrownSection — exterior Crown approach, with the legacy preview kept separate.
 * Crown = brightest, most luminous section. Golden radiance + solarpunk sky.
 * Feels like looking up into the highest branches where light pours through.
 */
import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigationType } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Sprout, Sparkles, BookOpen, Cherry, Archive, ArrowRight } from "lucide-react";
import SectionAtmosphere from "./SectionAtmosphere";
import { useDepthBalancedText, useDepthStyle, getWonderLineStyle } from "@/hooks/use-depth-text";
import DepthRevealText from "./DepthRevealText";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

import oak from "@/assets/parchment/plate-holm-oak.png";
import { ONE_CIRCLE_MANY_SURFACES, MATURITY_LABEL } from "@/data/crown/growths";

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

const CrownSection = ({ exterior = false }: { exterior?: boolean }) => {
  const depth = useDepthStyle();
  const reducedMotion = useReducedMotion();
  const entry = useRef<HTMLAnchorElement>(null);
  const location = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (exterior && navigationType === "POP" && location.hash === "#golden-dream") {
      entry.current?.focus({ preventScroll: true });
    }
  }, [exterior, location.key, location.hash, navigationType]);
  const { sectionRef, style: parallaxStyle } = useParallaxDepth({ maxOffset: 5, direction: -1 });

  const titleLayout = useDepthBalancedText({
    text: exterior ? "The Crown" : "Our Vision",
    font: '400 clamp(30px, 5vw, 48px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 52,
    zone: depth.zone,
  });

  return (
    <section
      ref={sectionRef}
      id="golden-dream"
      className={`flex flex-col items-center justify-center px-6 py-24 md:py-32 relative overflow-hidden ${exterior ? "exterior-crown-approach" : ""}`}
    >
      <SectionAtmosphere theme="crown" />
      {exterior && <div className="exterior-crown-world" aria-hidden="true" style={reducedMotion ? undefined : parallaxStyle}>
        <img src={oak} alt="" width="915" height="602" className="exterior-crown-distance" />
        {/* Overlapping, off-screen branch mass: compositional depth, not a 3D scene. */}
        <svg className="exterior-crown-bough" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice">
          <defs><linearGradient id="exterior-crown-wood" x1="0" y1="1" x2="0" y2="0"><stop stopColor="currentColor"/><stop offset="1" stopColor="currentColor" stopOpacity=".45"/></linearGradient></defs>
          <path fill="url(#exterior-crown-wood)" d="M-90 600 C60 445 280 540 425 470 C545 410 605 420 735 315 C860 218 985 200 1260 145 L1270 210 C1005 232 875 262 770 360 C650 476 555 482 450 528 C290 592 135 537 30 655 Z"/>
          <g fill="none" stroke="currentColor" strokeWidth="2" opacity=".4">
            <path d="M0 575 C190 482 304 571 470 496 S688 390 793 308 S1038 225 1200 187"/>
            <path d="M0 587 C190 494 310 585 480 509 S705 405 804 320 S1040 238 1200 200"/>
            <path d="M411 508 C330 407 235 409 170 348 M445 505 C377 399 287 382 245 294 M790 325 C860 335 958 371 1070 340" strokeWidth="8"/>
          </g>
        </svg>
      </div>}

      <motion.div
        initial={exterior ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-xl text-center space-y-6"
        style={exterior ? undefined : { letterSpacing: depth.letterSpacing, ...parallaxStyle }}
      >
        {/* Zone label — ecological marker */}
        <DepthRevealText
          as="p"
          className="text-[10px] uppercase tracking-[0.35em] font-serif text-foreground/45"
        >
          {exterior ? "The Living Dream" : "☀ The Crown"}
        </DepthRevealText>

        {/* Floating icon */}
        {!exterior && <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "hsl(45 80% 55% / 0.08)" }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-5 h-5" style={{ color: "hsl(45 80% 60%)" }} />
        </motion.div>}

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
          <span ref={titleLayout.containerRef as any}>{exterior ? "The Crown" : "Our Vision"}</span>
        </DepthRevealText>

        {/* Anchor sentence — orientation */}
        <DepthRevealText
          delay={150}
          className="font-serif text-base md:text-lg max-w-md mx-auto"
          style={{ color: "hsl(45 25% 88%)", lineHeight: 1.55 }}
        >
          {exterior ? "What might the Tree become?" : "A living dream for people, trees, and future generations."}
        </DepthRevealText>

        {/* Wonder line */}
        <DepthRevealText
          wonder
          delay={400}
          className="font-serif italic text-base md:text-lg mx-auto max-w-xs text-foreground/55"
          style={getWonderLineStyle(depth.zone)}
        >
          {exterior ? "Possibilities, not promises." : "The dream grows with the tree."}
        </DepthRevealText>

        {exterior && <p className="exterior-crown-glimpse"><Sprout size={22} aria-hidden="true" />
          <span>{MATURITY_LABEL[ONE_CIRCLE_MANY_SURFACES.maturity]}<br /><span>{ONE_CIRCLE_MANY_SURFACES.title}</span></span>
        </p>}
        {/* Threshold whisper — a single quiet invitation into the wood */}
        <DepthRevealText
          delay={550}
          className="font-serif italic text-[12px] md:text-[13px] text-muted-foreground/45 max-w-xs mx-auto pt-1"
        >
          {!exterior && "Find a tree. Leave something living behind."}
        </DepthRevealText>

        {/* Doorway cards — embedded, not floating */}
        {!exterior && <>
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

        </>}
        <Link
          ref={entry}
          to="/golden-dream"
          state={exterior ? { from: "/s33d#golden-dream" } : undefined}
          className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/40 hover:text-primary/70 transition-colors duration-300 pt-1"
        >
          Enter the Crown <ArrowRight className="w-3 h-3" />
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

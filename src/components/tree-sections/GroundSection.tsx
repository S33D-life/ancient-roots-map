/**
 * GroundSection — the soil-level landing of the Living Tree scroll.
 * TEOTAG emerges here as a gentle guide offering two paths:
 * descend into roots (primary) or climb into the tree.
 */
import { useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Hero from "../Hero";
import SectionAtmosphere from "./SectionAtmosphere";
import TeotagFace from "../TeotagFace";

const GroundSection = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const scrollToRoots = useCallback(() => {
    const el = document.getElementById("atlas-content");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Pretext: balanced layout for "Arboreal Atlas" title ──
  const atlasLayout = usePretextLayout({
    text: "Arboreal Atlas",
    font: '500 clamp(24px, 5vw, 30px) ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 36,
  });

  // ── Pretext: balanced layout for invitation subtitle ──
  const subtitleLayout = usePretextLayout({
    text: "The forest opens in two directions",
    font: 'italic 16px ui-serif, Georgia, "Times New Roman", serif',
    lineHeight: 26,
  });

  

  return (
    <section id="ground" className="relative">
      <SectionAtmosphere theme="ground" />
      <Hero />

      {/* ── Soil-Level TEOTAG Guide ── */}
      <div id="teotag-guide" className="relative z-20 -mt-4 md:-mt-8 pb-8 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 pointer-events-auto px-4"
        >
          {/* Arboreal Atlas title — lands at top of viewport */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 1.2, ease: "easeOut" }}
            className="font-serif text-2xl md:text-3xl text-center tracking-wide"
            style={{ color: "hsl(var(--foreground) / 0.85)" }}
          >
            Arboreal Atlas
          </motion.h2>

          {/* TEOTAG face — masculine / elder, large and prominent */}
          <div className="relative">
            {/* Earthy glow behind face */}
            <div
              className="absolute inset-0 -inset-x-8 -inset-y-6 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 55%, hsl(30 40% 25% / 0.18), transparent 70%)",
                filter: "blur(20px)",
              }}
              aria-hidden
            />
            <TeotagFace variant="masculine" size="lg" delay={2.2} className="[&_div]:w-36 [&_div]:h-36 md:[&_div]:w-44 md:[&_div]:h-44" />
          </div>

          {/* Invitation text */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 1, ease: "easeOut" }}
            className="font-serif text-base md:text-lg text-center max-w-xs leading-relaxed italic"
            style={{ color: "hsl(var(--muted-foreground) / 0.55)" }}
          >
            The forest opens in two directions
          </motion.p>

          {/* Two pathways */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.4, duration: 1 }}
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mt-1"
          >
            {/* DOWN — Explore the Roots (primary) */}
            <button
              onClick={scrollToRoots}
              className="group flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer transition-all duration-300"
            >
              <span
                className="font-serif text-sm tracking-wide transition-colors duration-300 group-hover:text-primary"
                style={{ color: "hsl(var(--foreground) / 0.7)" }}
              >
                Explore the roots
              </span>
              <span
                className="font-serif text-[10px] max-w-[180px] text-center leading-relaxed"
                style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
              >
                Discover Ancient Friends and the Arboreal Atlas
              </span>
              <motion.div
                animate={reducedMotion ? {} : { y: [0, 4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-4 h-4 text-primary/40 group-hover:text-primary/70 transition-colors" />
              </motion.div>
            </button>

            {/* Divider */}
            <div
              className="hidden sm:block w-px h-12"
              style={{ background: "hsl(var(--border) / 0.15)" }}
              aria-hidden
            />
            <div
              className="sm:hidden w-12 h-px"
              style={{ background: "hsl(var(--border) / 0.15)" }}
              aria-hidden
            />

            {/* UP — Climb into the Tree */}
            <button
              onClick={() => navigate("/library")}
              className="group flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer transition-all duration-300"
            >
              <motion.div
                animate={reducedMotion ? {} : { y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronUp className="w-4 h-4 text-primary/30 group-hover:text-primary/60 transition-colors" />
              </motion.div>
              <span
                className="font-serif text-sm tracking-wide transition-colors duration-300 group-hover:text-primary"
                style={{ color: "hsl(var(--foreground) / 0.55)" }}
              >
                Enter the Library &amp; Council
              </span>
              <span
                className="font-serif text-[10px] max-w-[180px] text-center leading-relaxed"
                style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}
              >
                Step into Heartwood, the Council of Life, and your Hearth
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default GroundSection;

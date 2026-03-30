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




  

  return (
    <section id="ground" className="relative">
      <SectionAtmosphere theme="ground" />
      <Hero />

      {/* ── Identity statement — above TEOTAG guide ── */}
      <div className="relative z-20 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground/90 italic"
          >
            A living atlas of the world's most remarkable trees — mapped by people who walk among them.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto"
          >
            S33D maps ancient trees worldwide, gathers stories from those who visit them,
            and rewards care with Hearts — tokens of stewardship earned by contributing to the grove.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 pt-4"
          >
            {[
              { icon: MapPin, text: "Map trees" },
              { icon: ScrollText, text: "Share stories" },
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
      </div>

      {/* ── Soil-Level TEOTAG Guide ── */}
      <div id="teotag-guide" className="relative z-20 -mt-4 md:-mt-8 pb-8 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 pointer-events-auto px-4"
        >
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

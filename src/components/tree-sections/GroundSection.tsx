/**
 * GroundSection — the landing anchor of the Living Tree scroll.
 * Ground = the surface, where the Ancient Friend greets you.
 */
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Hero from "../Hero";
import SectionAtmosphere from "./SectionAtmosphere";

const GroundSection = () => (
  <section id="ground" className="relative">
    {/* Atmospheric ground skin — subtle earth framing behind Hero */}
    <SectionAtmosphere theme="ground" />

    {/* The existing Ancient Friend hero landing */}
    <Hero />

    {/* S33D seed halo — center anchor point with Ensō nudge */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[15] pointer-events-none"
      aria-hidden="true"
    >
      <EnsoNudge size={160}>
        <motion.div
          className="w-32 h-32 md:w-48 md:h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(42 80% 55% / 0.06), transparent 70%)",
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </EnsoNudge>
    </div>

    {/* Scroll direction indicators */}
    {/* UP cue — "Climb the Tree" */}
    <motion.div
      className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronUp className="w-4 h-4 text-primary/30" />
      </motion.div>
      <span className="text-[8px] uppercase tracking-[0.35em] font-serif text-muted-foreground/30 select-none">
        Climb the Tree
      </span>
    </motion.div>

    {/* DOWN cue — "Explore the Roots" */}
    <motion.div
      className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.5, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="text-[8px] uppercase tracking-[0.35em] font-serif text-muted-foreground/30 select-none">
        Explore the Roots
      </span>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-4 h-4 text-primary/30" />
      </motion.div>
    </motion.div>
  </section>
);

export default GroundSection;

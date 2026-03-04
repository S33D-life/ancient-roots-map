/**
 * GroundSection — the landing anchor of the Living Tree scroll.
 * Ground = the surface, where the Ancient Friend greets you.
 * The S33D seed sits at the threshold between roots below and tree above.
 *
 * Scroll cues invite exploration in both directions.
 */
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Hero from "../Hero";

const GroundSection = () => (
  <section id="ground" className="relative">
    {/* The existing Ancient Friend hero landing */}
    <Hero />

    {/* Scroll direction indicators — overlaid at top and bottom */}
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
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
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

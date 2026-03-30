/**
 * ForestInteractionLayers — introduces Offerings, Whispers, and Tree Radio
 * as the three core ways to engage with the forest.
 * Styled as embedded openings into the tree, not floating cards.
 */
import { motion } from "framer-motion";
import { Leaf, Bird, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";

const layers = [
  {
    icon: Leaf,
    title: "Offerings",
    description: "Leave something of yourself with a tree — a word, a song, a gesture.",
    subtext: "Offerings grow into S33D Hearts when another wanderer finds them.",
    cta: "Make an offering",
    to: "/map",
  },
  {
    icon: Bird,
    title: "Whispers",
    description: "Messages left beneath the canopy — only revealed when you are near.",
    subtext: "A quiet network of presence, shared between wanderers and trees.",
    cta: "Listen for whispers",
    to: "/map",
  },
  {
    icon: Radio,
    title: "Tree Radio",
    description: "Each tree holds a living stream of sound — shaped by what has been offered.",
    subtext: "Tune into a tree, a grove, or a whole species.",
    cta: "Tune in",
    to: "/library/music-room",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function ForestInteractionLayers() {
  const navigate = useNavigate();

  return (
    <section className="relative py-12 md:py-16 px-4">
      {/* Section header */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1 }}
        className="text-center font-serif text-[9px] tracking-[0.35em] uppercase mb-8 text-muted-foreground/35"
      >
        Ways to meet the forest
      </motion.p>

      {/* Cards — embedded doorways */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
        {layers.map((layer, i) => (
          <motion.button
            key={layer.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            whileHover={{ y: -2 }}
            onClick={() => navigate(layer.to)}
            className="group relative flex flex-col items-start text-left rounded-lg p-5 transition-all duration-500 hover:bg-foreground/[0.03] cursor-pointer"
          >
            {/* Icon */}
            <layer.icon className="w-4 h-4 text-foreground/25 group-hover:text-primary/50 transition-colors mb-3" />

            {/* Title */}
            <h3 className="font-serif text-base text-foreground/70 mb-2 tracking-wide group-hover:text-foreground/90 transition-colors">
              {layer.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-foreground/50 leading-relaxed mb-1.5 font-serif">
              {layer.description}
            </p>

            {/* Subtext */}
            <p className="text-xs text-muted-foreground/35 leading-relaxed mb-3 font-serif italic">
              {layer.subtext}
            </p>

            {/* CTA */}
            <span className="mt-auto text-xs font-serif tracking-wide text-primary/35 group-hover:text-primary/65 transition-colors">
              {layer.cta} →
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

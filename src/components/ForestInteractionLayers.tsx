/**
 * ForestInteractionLayers — introduces Offerings, Whispers, and Tree Radio
 * as the three core ways to engage with the forest.
 */
import { motion } from "framer-motion";
import { Leaf, Bird, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";

const layers = [
  {
    emoji: "🌿",
    icon: Leaf,
    title: "Offerings",
    description: "Leave something of yourself with a tree — a word, a song, a gesture.",
    subtext: "Offerings grow into S33D Hearts when another wanderer finds them.",
    cta: "Make an offering",
    to: "/map",
  },
  {
    emoji: "🕊️",
    icon: Bird,
    title: "Whispers",
    description: "Messages left beneath the canopy — only revealed when you are near.",
    subtext: "A quiet network of presence, shared between wanderers and trees.",
    cta: "Listen for whispers",
    to: "/map",
  },
  {
    emoji: "🎶",
    icon: Radio,
    title: "Tree Radio",
    description: "Each tree holds a living stream of sound — shaped by what has been offered.",
    subtext: "Tune into a tree, a grove, or a whole species.",
    cta: "Tune in",
    to: "/library/music-room",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function ForestInteractionLayers() {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 px-4">
      {/* Section header */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1 }}
        className="text-center font-serif text-xs tracking-[0.35em] uppercase mb-10 text-muted-foreground/50"
      >
        Ways to meet the forest
      </motion.p>

      {/* Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {layers.map((layer, i) => (
          <motion.button
            key={layer.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            whileHover={{ y: -4, boxShadow: "0 8px 30px hsl(var(--primary) / 0.08)" }}
            onClick={() => navigate(layer.to)}
            className="group relative flex flex-col items-start text-left rounded-2xl p-6 border border-border/20 bg-card/40 backdrop-blur-sm transition-colors duration-300 hover:border-primary/20 hover:bg-card/60 cursor-pointer"
          >
            {/* Icon row */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl" aria-hidden>{layer.emoji}</span>
              <layer.icon className="w-4 h-4 text-primary/40 group-hover:text-primary/70 transition-colors" />
            </div>

            {/* Title */}
            <h3 className="font-serif text-lg text-foreground/90 mb-2 tracking-wide">
              {layer.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-foreground/70 leading-relaxed mb-2 font-serif">
              {layer.description}
            </p>

            {/* Subtext */}
            <p className="text-xs text-muted-foreground/50 leading-relaxed mb-4 font-serif italic">
              {layer.subtext}
            </p>

            {/* CTA */}
            <span className="mt-auto text-xs font-serif tracking-wide text-primary/50 group-hover:text-primary/80 transition-colors">
              {layer.cta} →
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

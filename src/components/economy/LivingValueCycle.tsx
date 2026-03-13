/**
 * LivingValueCycle — Visual cycle diagram: Breath → Encounter → Contribution → Harvest → Exchange
 * Used on the Value Tree page as the economic system map.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Wind, Eye, HandHeart, Wheat, ArrowLeftRight, ArrowRight } from "lucide-react";

const CYCLE_STEPS = [
  {
    id: "breath",
    label: "Breath",
    icon: <Wind className="w-5 h-5" />,
    color: "hsl(200 40% 60%)",
    description: "Presence is the seed of all value",
    links: [],
  },
  {
    id: "encounter",
    label: "Encounter",
    icon: <Eye className="w-5 h-5" />,
    color: "hsl(150 50% 45%)",
    description: "Meet the Ancient Friends",
    links: [
      { label: "Map of Ancient Friends", to: "/map" },
      { label: "Whispers", to: "/map" },
      { label: "Companion Mode", to: "/map" },
      { label: "Tree Stories", to: "/library/gallery" },
    ],
  },
  {
    id: "contribution",
    label: "Contribution",
    icon: <HandHeart className="w-5 h-5" />,
    color: "hsl(30 70% 50%)",
    description: "Give back to the commons",
    links: [
      { label: "Leave Offerings", to: "/map" },
      { label: "Map Trees", to: "/add-tree" },
      { label: "Verify Trees", to: "/map" },
      { label: "Council of Life", to: "/council-of-life" },
      { label: "Seed Library", to: "/library/seed-cellar" },
    ],
  },
  {
    id: "harvest",
    label: "Harvest",
    icon: <Wheat className="w-5 h-5" />,
    color: "hsl(42 80% 50%)",
    description: "Accumulate living knowledge",
    links: [
      { label: "Heartwood Library", to: "/library" },
      { label: "Tree Records", to: "/library/gallery" },
      { label: "Cultural Memory", to: "/library/bookshelf" },
      { label: "Seed Records", to: "/library/seed-cellar" },
    ],
  },
  {
    id: "exchange",
    label: "Exchange",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    color: "hsl(0 65% 55%)",
    description: "Circulate value through the Vault",
    links: [
      { label: "Heartwood Vault", to: "/vault" },
      { label: "S33D Hearts", to: "/value-tree" },
      { label: "NFTrees", to: "/library/gallery" },
      { label: "Rewards & Gifting", to: "/vault" },
    ],
  },
];

const LivingValueCycle = () => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h2 className="text-xl md:text-2xl font-serif text-foreground tracking-wide">
        The Living Value Cycle
      </h2>
      <p className="text-xs text-muted-foreground font-serif max-w-md mx-auto leading-relaxed">
        Value in S33D begins with encounter, not consumption. Every breath leads to participation, every participation grows the commons.
      </p>
    </div>

    {/* Horizontal cycle flow */}
    <div className="flex flex-wrap items-start justify-center gap-1 md:gap-0">
      {CYCLE_STEPS.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start"
        >
          <div className="flex flex-col items-center w-[120px] md:w-[140px]">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 mb-2"
              style={{
                borderColor: step.color,
                background: `${step.color}15`,
                boxShadow: `0 0 20px ${step.color}20`,
              }}
            >
              <span style={{ color: step.color }}>{step.icon}</span>
            </div>
            <span className="text-xs font-serif font-medium mb-1" style={{ color: step.color }}>
              {step.label}
            </span>
            <p className="text-[9px] text-muted-foreground font-serif text-center leading-relaxed mb-2">
              {step.description}
            </p>
            {step.links.length > 0 && (
              <div className="space-y-0.5">
                {step.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block text-[9px] font-serif text-primary/60 hover:text-primary transition-colors text-center"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            )}
          </div>
          {i < CYCLE_STEPS.length - 1 && (
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 mt-5 mx-0.5 shrink-0 hidden sm:block" />
          )}
        </motion.div>
      ))}
    </div>

    {/* Closing loop */}
    <div className="text-center">
      <p className="text-[10px] font-serif text-muted-foreground/60 italic">
        Exchange fuels new encounters — the cycle continues ∞
      </p>
      <Link
        to="/golden-dream#encounter-economy"
        className="inline-block mt-2 text-[11px] font-serif text-primary/70 hover:text-primary transition-colors"
      >
        Read the deeper philosophy →
      </Link>
    </div>
  </div>
);

export default LivingValueCycle;

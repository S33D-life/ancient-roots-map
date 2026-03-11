/**
 * EcosystemOverview — a visual map of how S33D systems connect.
 *
 * Shows the four TETOL layers with their subsystems and mycelial
 * connections between them. Used on the homepage and linkable
 * from the roadmap.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TreeDeciduous, BookOpen, Leaf, Sparkles, Heart,
  Hexagon, MapPin, Gift, Globe, Music, ArrowRight,
} from "lucide-react";

const LAYERS = [
  {
    id: "roots",
    label: "Roots",
    subtitle: "Ancient Friends · Living Atlas",
    icon: TreeDeciduous,
    accent: "120 45% 45%",
    features: [
      { name: "Map", icon: MapPin, to: "/map" },
      { name: "Hives", icon: Hexagon, to: "/hives" },
      { name: "Bio-Regions", icon: Globe, to: "/atlas/bio-regions" },
    ],
  },
  {
    id: "trunk",
    label: "Trunk",
    subtitle: "Heartwood Library · Knowledge",
    icon: BookOpen,
    accent: "28 70% 50%",
    features: [
      { name: "Library", icon: BookOpen, to: "/library" },
      { name: "Offerings", icon: Gift, to: "/library" },
      { name: "Wisdom", icon: Music, to: "/library" },
    ],
  },
  {
    id: "canopy",
    label: "Canopy",
    subtitle: "Council of Life · Governance",
    icon: Leaf,
    accent: "195 60% 50%",
    features: [
      { name: "Councils", icon: Leaf, to: "/council-of-life" },
      { name: "Companions", icon: Heart, to: "/council-of-life" },
    ],
  },
  {
    id: "crown",
    label: "Crown",
    subtitle: "Golden Dream · Vision",
    icon: Sparkles,
    accent: "45 100% 60%",
    features: [
      { name: "Dream", icon: Sparkles, to: "/golden-dream" },
      { name: "Roadmap", icon: TreeDeciduous, to: "/roadmap" },
    ],
  },
];

const CONNECTIONS = [
  { from: "Map", to: "Hives", label: "species clustering" },
  { from: "Offerings", to: "Map", label: "gifts to trees" },
  { from: "Councils", to: "Offerings", label: "community voice" },
  { from: "Hearts", to: "Map", label: "reward stewardship" },
];

const EcosystemOverview = () => (
  <section className="py-14 md:py-20">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-xl md:text-2xl font-serif text-foreground mb-2">
          How the Ecosystem Connects
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          S33D is a living tree. Each layer serves a purpose, and mycelial threads connect them all.
        </p>
      </motion.div>

      {/* Layers */}
      <div className="space-y-3">
        {LAYERS.map((layer, i) => {
          const LayerIcon = layer.icon;
          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-xl border border-border/25 bg-card/30 backdrop-blur-sm px-4 py-3.5"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${layer.accent} / 0.12)` }}
                >
                  <LayerIcon className="w-4.5 h-4.5" style={{ color: `hsl(${layer.accent})` }} />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground/90">{layer.label}</p>
                  <p className="text-[10px] text-muted-foreground/55">{layer.subtitle}</p>
                </div>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-1.5 pl-12">
                {layer.features.map((feat) => {
                  const FeatIcon = feat.icon;
                  return (
                    <Link
                      key={feat.name}
                      to={feat.to}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-sans
                                 border border-border/20 bg-card/50 text-muted-foreground/70
                                 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      <FeatIcon className="w-3 h-3" />
                      {feat.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mycelial connections legend */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-3 font-sans">
          Mycelial threads
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CONNECTIONS.map((c) => (
            <span
              key={`${c.from}-${c.to}`}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                         border border-primary/10 text-muted-foreground/50 font-sans"
            >
              {c.from}
              <ArrowRight className="w-2.5 h-2.5 text-primary/30" />
              {c.to}
            </span>
          ))}
        </div>

        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 mt-5 text-xs text-primary/70 hover:text-primary transition-colors font-serif"
        >
          See the full Living Forest Roadmap
          <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default EcosystemOverview;

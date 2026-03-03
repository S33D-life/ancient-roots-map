/**
 * TreeHeartRewards — Elegant, non-cluttered display of heart reward mechanics.
 * Shows what actions earn hearts beneath the tree.
 */
import { motion } from "framer-motion";
import { Heart, MapPin, Sparkles, Star, BookOpen, Eye } from "lucide-react";

const ACTIONS = [
  { icon: <MapPin className="w-4 h-4" />, label: "Mapping", desc: "Add a tree to the atlas" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Offering", desc: "Share songs, poems, stories" },
  { icon: <Star className="w-4 h-4" />, label: "Wishing", desc: "Leave a wish in the canopy" },
  { icon: <BookOpen className="w-4 h-4" />, label: "Research", desc: "Contribute verified sources" },
  { icon: <Eye className="w-4 h-4" />, label: "Visiting", desc: "Check in at the tree" },
];

const TreeHeartRewards = () => {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-serif text-muted-foreground italic">
          Actions that grow the forest earn <Heart className="w-3.5 h-3.5 inline text-primary pulse-live" /> Hearts.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {ACTIONS.map((action) => (
          <motion.div
            key={action.label}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/20 bg-card/30 text-center"
          >
            <div className="text-primary/60">{action.icon}</div>
            <p className="text-xs font-serif text-foreground/80">{action.label}</p>
            <p className="text-[10px] text-muted-foreground/50 font-serif leading-tight">{action.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default TreeHeartRewards;

import { motion } from "framer-motion";
import { Heart, Users, Droplets, Shield } from "lucide-react";

interface WishTagSigilsProps {
  tags: string[];
}

const TAG_CONFIG: Record<string, { icon: React.ReactNode; hsl: string }> = {
  "Healing": { icon: <Heart className="w-3 h-3" />, hsl: "0 60% 55%" },
  "Unity": { icon: <Users className="w-3 h-3" />, hsl: "42 95% 55%" },
  "Safe Gathering": { icon: <Shield className="w-3 h-3" />, hsl: "120 40% 45%" },
  "Water Blessing": { icon: <Droplets className="w-3 h-3" />, hsl: "200 70% 55%" },
};

/**
 * Renders wish tags as soft gold leaf sigils arranged in a
 * gentle arc formation, echoing the heart-shaped canopy cluster.
 */
const WishTagSigils = ({ tags }: WishTagSigilsProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap py-2">
      {tags.map((tag, i) => {
        const config = TAG_CONFIG[tag] || { icon: <Heart className="w-3 h-3" />, hsl: "42 95% 55%" };
        return (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif tracking-wider border"
            style={{
              borderColor: `hsl(${config.hsl} / 0.3)`,
              color: `hsl(${config.hsl})`,
              background: `hsl(${config.hsl} / 0.08)`,
            }}
          >
            {config.icon}
            {tag}
          </motion.span>
        );
      })}
    </div>
  );
};

export default WishTagSigils;

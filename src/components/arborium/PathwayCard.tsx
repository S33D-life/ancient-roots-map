/**
 * PathwayCard — Large calm pathway tile for The Arborium landing.
 * Botanical, daylight-toned. Used for the four main Arborium pathways.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface PathwayCardProps {
  to: string;
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  hue?: number;
  index?: number;
  comingSoon?: boolean;
}

export default function PathwayCard({
  to, icon: Icon, emoji, title, description, hue = 95, index = 0, comingSoon,
}: PathwayCardProps) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="group relative h-full rounded-2xl p-5 overflow-hidden border transition-all"
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 40% 95%) 0%, hsl(${hue - 10} 30% 92%) 60%, hsl(${hue + 10} 35% 94%) 100%)`,
        borderColor: `hsl(${hue} 30% 70% / 0.35)`,
        boxShadow: `0 1px 0 hsl(${hue} 35% 80% / 0.6) inset, 0 8px 24px -16px hsl(${hue} 40% 25% / 0.25)`,
      }}
    >
      <div
        className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-40 blur-2xl pointer-events-none"
        style={{ background: `hsl(${hue} 50% 70% / 0.5)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="text-3xl select-none leading-none"
            aria-hidden
            style={{ filter: "drop-shadow(0 1px 0 hsl(40 30% 100% / 0.6))" }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-base md:text-lg text-[hsl(95_30%_18%)] leading-tight">
              {title}
            </h3>
            <p className="text-xs font-serif text-[hsl(95_15%_30%)]/75 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <Icon className="w-4 h-4 mt-1 shrink-0 text-[hsl(95_30%_30%)]/50 group-hover:text-[hsl(95_45%_30%)] transition-colors" />
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[10px] font-serif uppercase tracking-[0.18em] text-[hsl(95_20%_30%)]/55">
          {comingSoon ? "Opening soon" : "Enter"}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-[hsl(95_30%_30%)]/60 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );

  if (comingSoon) return <div aria-disabled className="opacity-90 cursor-default">{inner}</div>;
  return <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">{inner}</Link>;
}

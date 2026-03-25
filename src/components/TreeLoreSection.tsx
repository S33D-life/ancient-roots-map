import { motion } from "framer-motion";
import { Droplets, Mountain, Heart, Sparkles } from "lucide-react";

interface TreeLoreSectionProps {
  loreText: string | null;
  elementalSignature: string[] | null;
  archetype: string | null;
  seasonalTone: string | null;
}

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  Water: <Droplets className="w-3.5 h-3.5" />,
  Earth: <Mountain className="w-3.5 h-3.5" />,
  Heartwood: <Heart className="w-3.5 h-3.5" />,
  Fire: <Sparkles className="w-3.5 h-3.5" />,
};

const ELEMENT_COLORS: Record<string, string> = {
  Water: "200 70% 55%",
  Earth: "30 50% 45%",
  Heartwood: "0 60% 55%",
  Fire: "25 90% 55%",
};

const TreeLoreSection = ({ loreText, elementalSignature, archetype, seasonalTone }: TreeLoreSectionProps) => {
  if (!loreText && !elementalSignature?.length && !archetype) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-xl border border-border/40 overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.6))" }}
    >
      {/* Decorative top line */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), hsl(200 70% 55% / 0.3), transparent)" }} />

      <div className="p-5 md:p-6 space-y-4">
        {/* Archetype */}
        {archetype && (
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-serif">Archetype</span>
            <p className="text-lg font-serif text-primary tracking-wide mt-0.5">{archetype}</p>
          </div>
        )}

        {/* Elemental Signature */}
        {elementalSignature && elementalSignature.length > 0 && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {elementalSignature.map((el) => (
              <span
                key={el}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif tracking-wider border"
                style={{
                  borderColor: `hsl(${ELEMENT_COLORS[el] || "var(--border)"} / 0.4)`,
                  color: `hsl(${ELEMENT_COLORS[el] || "var(--foreground)"})`,
                  background: `hsl(${ELEMENT_COLORS[el] || "var(--muted)"} / 0.1)`,
                }}
              >
                {ELEMENT_ICONS[el] || <Sparkles className="w-3.5 h-3.5" />}
                {el}
              </span>
            ))}
          </div>
        )}

        {/* Lore Text */}
        {loreText && (
          <blockquote className="border-l-2 border-primary/30 pl-4 py-2">
            {loreText.split("\n").map((line, i) => (
              <p key={i} className="text-foreground/70 font-serif text-sm leading-relaxed italic">
                {line || <br />}
              </p>
            ))}
          </blockquote>
        )}

        {/* Seasonal Tone */}
        {seasonalTone && (
          <p className="text-center text-xs text-muted-foreground/70 font-serif tracking-wider">
            🍃 {seasonalTone}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default TreeLoreSection;

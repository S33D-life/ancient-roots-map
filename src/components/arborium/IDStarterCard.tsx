/**
 * IDStarterCard — One of six "what clue can you see?" cards for the
 * Tree ID Starter section of The Arborium.
 *
 * Practical, mobile-first. One prompt per card. No taxonomy — just observation.
 * When onClick is provided, renders as a keyboard-accessible button with active state.
 */
import { motion } from "framer-motion";

interface IDStarterCardProps {
  clueKey: string;
  emoji: string;
  title: string;
  prompt: string;
  index?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function IDStarterCard({
  emoji,
  title,
  prompt,
  index = 0,
  isActive = false,
  onClick,
}: IDStarterCardProps) {
  const interactive = Boolean(onClick);

  const inner = (
    <>
      {/* faint parchment dot */}
      <div
        className="absolute inset-0 rounded-2xl opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 10%, hsl(35 40% 30%) 0 1px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />

      <span
        className="text-2xl select-none leading-none shrink-0 mt-0.5"
        aria-hidden
        style={{ filter: "drop-shadow(0 1px 0 hsl(40 30% 100% / 0.6))" }}
      >
        {emoji}
      </span>

      <div className="min-w-0">
        <h4 className="font-serif text-sm text-foreground leading-tight">{title}</h4>
        <p className="text-[11px] font-serif text-muted-foreground/80 mt-1 leading-relaxed">{prompt}</p>
      </div>
    </>
  );

  const baseClass = [
    "relative rounded-2xl border p-4 flex items-start gap-3 w-full text-left transition-all duration-200",
    isActive
      ? "border-amber-600/45 dark:border-amber-400/45 bg-[hsl(45_50%_94%)]/90 dark:bg-[hsl(80_18%_16%)]/90"
      : "border-amber-900/15 dark:border-amber-200/12 bg-[hsl(45_40%_96%)]/80 dark:bg-[hsl(80_16%_13%)]/75",
  ].join(" ");

  const style = {
    boxShadow: isActive
      ? "inset 0 1px 0 hsl(48 40% 98% / 0.85), 0 0 0 3px hsl(40 55% 60% / 0.2), 0 4px 16px -8px hsl(40 30% 25% / 0.18)"
      : "inset 0 1px 0 hsl(48 40% 98% / 0.8), 0 4px 16px -8px hsl(40 30% 25% / 0.12)",
  };

  if (interactive) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05 }}
        whileHover={isActive ? {} : { y: -1 }}
        className={`${baseClass} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        style={style}
        onClick={onClick}
        aria-pressed={isActive}
      >
        {inner}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={baseClass}
      style={style}
    >
      {inner}
    </motion.div>
  );
}

/** The six standard ID starter clues. */
export const ID_STARTER_CLUES: IDStarterCardProps[] = [
  {
    clueKey: "leaf",
    emoji: "🍃",
    title: "Leaf shape",
    prompt: "Are the leaves lobed, toothed, needle-like, heart-shaped, or long and narrow?",
  },
  {
    clueKey: "bark",
    emoji: "🪵",
    title: "Bark texture",
    prompt: "Is the bark smooth and grey, deeply furrowed, papery, scaly, or peeling in strips?",
  },
  {
    clueKey: "buds",
    emoji: "🌿",
    title: "Buds & twigs",
    prompt: "Are the buds opposite each other or alternate? Round or pointed? Sticky, hairy, or smooth?",
  },
  {
    clueKey: "seeds",
    emoji: "🌰",
    title: "Seeds & fruits",
    prompt: "Acorns, winged seeds, cones, berries, or pods — seeds reveal the family clearly.",
  },
  {
    clueKey: "flowers",
    emoji: "🌸",
    title: "Flowers & catkins",
    prompt: "Does it carry dangling catkins in early spring, white clusters in May, or cup-shaped flowers?",
  },
  {
    clueKey: "silhouette",
    emoji: "🌲",
    title: "Whole-tree shape",
    prompt: "Weeping, upright, spreading, or narrow? Step back — the silhouette tells a story.",
  },
];

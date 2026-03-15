import { Link } from "react-router-dom";
import { TreeDeciduous, BookOpen, Leaf, Sparkles, Sprout, ArrowRight } from "lucide-react";
import type { TetolLevel } from "@/contexts/TetolLevelContext";
import { useTetolLevel } from "@/contexts/TetolLevelContext";
import { ROUTES } from "@/lib/routes";

interface BridgeTarget {
  level: TetolLevel;
  label: string;
  prompt: string;
  route: string;
  icon: React.ElementType;
}

const BRIDGES: Record<string, BridgeTarget[]> = {
  s33d: [
    { level: "roots", label: "The Roots", prompt: "Begin your journey on the Atlas", route: ROUTES.MAP, icon: TreeDeciduous },
  ],
  roots: [
    { level: "heartwood", label: "The Heartwood", prompt: "Rise to the Library — explore offerings and lore", route: ROUTES.LIBRARY, icon: BookOpen },
  ],
  heartwood: [
    { level: "canopy", label: "The Canopy", prompt: "Ascend to the Council — gather with the grove", route: ROUTES.COUNCIL, icon: Leaf },
  ],
  canopy: [
    { level: "crown", label: "The Crown", prompt: "Reach for the Golden Dream — shape the vision", route: "/golden-dream", icon: Sparkles },
  ],
  crown: [
    { level: "s33d", label: "S33D", prompt: "Return to the seed — the cycle begins again", route: ROUTES.S33D, icon: Sprout },
  ],
};

const TetolBridge = () => {
  const { level } = useTetolLevel();
  const targets = BRIDGES[level];

  if (!targets || level === "hearth") return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative">
        {/* Decorative line */}
        <div className="absolute left-1/2 -top-8 w-px h-8 bg-gradient-to-b from-transparent to-border/40" />

        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-serif">
            Continue the journey
          </p>
          {targets.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.level}
                to={t.route}
                className="group flex items-center gap-3 px-5 py-3 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm hover:border-[hsl(var(--level-accent)_/_0.5)] hover:bg-card/50 transition-all duration-300 max-w-md w-full"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--level-accent) / 0.15)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "hsl(var(--level-accent))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground/60 truncate">{t.prompt}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TetolBridge;

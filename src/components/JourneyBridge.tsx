/**
 * JourneyBridge — A contextual "next step" navigation component that
 * threads the four core sections into a continuous journey:
 *   Hearth (Legend) → Creator's Path → Staff Room → Map Room
 *
 * Place at the bottom of each section to guide wanderers forward.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScrollText, Footprints, Wand2, Map as MapIcon,
  ChevronRight, Heart, Lock, TreeDeciduous,
} from "lucide-react";

type JourneyStep = "hearth" | "path" | "staff" | "map";

interface StepDef {
  key: JourneyStep;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  to: string;
  accentHsl: string;
  requiresStaff?: boolean;
  heartsAction?: string;
}

const STEPS: StepDef[] = [
  {
    key: "hearth",
    label: "Hearth",
    sublabel: "Your Legend & Identity",
    icon: ScrollText,
    to: "/dashboard",
    accentHsl: "15 80% 55%",
  },
  {
    key: "path",
    label: "Creator's Path",
    sublabel: "Journey Timeline",
    icon: Footprints,
    to: "/library/creators-path",
    accentHsl: "28 70% 50%",
    heartsAction: "Review offerings, songs, ceremonies",
  },
  {
    key: "staff",
    label: "Staff Room",
    sublabel: "144 Sacred Staffs",
    icon: Wand2,
    to: "/library/staff-room",
    accentHsl: "280 60% 55%",
    heartsAction: "Bind a Staff to unlock ceremonies",
  },
  {
    key: "map",
    label: "Map Room",
    sublabel: "The Arboreal Atlas",
    icon: MapIcon,
    to: "/map",
    accentHsl: "120 45% 45%",
    heartsAction: "+10 Hearts per tree mapped",
  },
];

interface JourneyBridgeProps {
  /** Which section the user is currently in */
  current: JourneyStep;
  /** Whether the user has a linked staff */
  hasStaff?: boolean;
  /** Optional extra className */
  className?: string;
}

export default function JourneyBridge({ current, hasStaff = false, className }: JourneyBridgeProps) {
  const currentIdx = STEPS.findIndex(s => s.key === current);

  // Show previous and next steps
  const prev = currentIdx > 0 ? STEPS[currentIdx - 1] : null;
  const next = currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null;

  // Show the full journey progression as dots
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`mt-10 pt-6 border-t border-border/20 ${className || ""}`}
    >
      {/* Journey progression dots */}
      <div className="flex items-center justify-center gap-1 mb-4">
        {STEPS.map((step, i) => {
          const isActive = step.key === current;
          const isPast = i < currentIdx;
          return (
            <Link
              key={step.key}
              to={step.to}
              className="flex items-center gap-1 group"
              title={step.label}
            >
              <div
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  background: isActive
                    ? `hsl(${step.accentHsl})`
                    : isPast
                      ? `hsl(${step.accentHsl} / 0.4)`
                      : "hsl(var(--muted-foreground) / 0.2)",
                  boxShadow: isActive ? `0 0 8px hsl(${step.accentHsl} / 0.5)` : "none",
                }}
              />
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px" style={{
                  background: i < currentIdx
                    ? `hsl(${step.accentHsl} / 0.3)`
                    : "hsl(var(--muted-foreground) / 0.1)",
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/50 font-serif mb-6">
        {STEPS.map(step => (
          <span key={step.key} className={step.key === current ? "text-foreground/70" : ""}>
            {step.label}
          </span>
        ))}
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {prev && (
          <Link to={prev.to} className="group">
            <div
              className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                borderColor: `hsl(${prev.accentHsl} / 0.2)`,
                background: `hsl(${prev.accentHsl} / 0.05)`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `hsl(${prev.accentHsl} / 0.15)` }}
              >
                <prev.icon className="w-4 h-4" style={{ color: `hsl(${prev.accentHsl})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-muted-foreground/60">← Back to</p>
                <p className="text-sm font-serif text-foreground/80 truncate">{prev.label}</p>
              </div>
            </div>
          </Link>
        )}

        {next && (
          <Link to={next.to} className="group">
            <div
              className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                borderColor: `hsl(${next.accentHsl} / 0.25)`,
                background: `hsl(${next.accentHsl} / 0.08)`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `hsl(${next.accentHsl} / 0.15)` }}
              >
                <next.icon className="w-4 h-4" style={{ color: `hsl(${next.accentHsl})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-muted-foreground/60">Continue to →</p>
                <p className="text-sm font-serif text-foreground/80 truncate">{next.label}</p>
                {next.heartsAction && (
                  <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                    <Heart className="w-2.5 h-2.5" /> {next.heartsAction}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 group-hover:text-foreground/50 transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {/* Permission hint */}
      {current === "staff" && !hasStaff && (
        <p className="text-center text-[10px] text-muted-foreground/40 mt-3 flex items-center justify-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          Binding a Staff unlocks ceremonies, seals offerings, and deepens your legend.
        </p>
      )}

      {current === "map" && (
        <p className="text-center text-[10px] text-muted-foreground/40 mt-3 flex items-center justify-center gap-1">
          <TreeDeciduous className="w-2.5 h-2.5" />
          Each tree mapped earns 10 S33D Hearts + 3 Species Hearts + 2 Influence
        </p>
      )}
    </motion.div>
  );
}

/**
 * HearthDoorways — three calm doorways leading deeper from the Hearth.
 *
 * The Hearth is the human centre — these doorways gracefully point toward
 * the rooms where deeper systems live, without dragging those systems into
 * the living room.
 *
 *   Quest Cave       → unfolding paths and adventures below
 *   Heartwood Vault  → the flow of hearts, memory, and exchange
 *   Taproot          → systems, diagnostics, stewardship (keepers only)
 */
import { Link } from "react-router-dom";
import { Flame, BookHeart, Sprout, ArrowRight } from "lucide-react";
import { useHasRole } from "@/hooks/use-role";

interface Doorway {
  to: string;
  icon: React.ElementType;
  label: string;
  whisper: string;
  tint: string;       // hsl tone for soft glow
  atmosphere: "ember" | "archive" | "roots";
  keeperOnly?: boolean;
}

const DOORWAYS: Doorway[] = [
  {
    to: "/heartwood/quest-room",
    icon: Flame,
    label: "Quest Cave",
    whisper: "An adventure waits below",
    tint: "18 85% 55%",
    atmosphere: "ember",
  },
  {
    to: "/vault?from=hearth",
    icon: BookHeart,
    label: "Heartwood Vault",
    whisper: "Where memories are kept warm",
    tint: "35 65% 50%",
    atmosphere: "archive",
  },
  {
    to: "/admin/room",
    icon: Sprout,
    label: "Taproot",
    whisper: "Tend the roots of the grove",
    tint: "150 35% 42%",
    atmosphere: "roots",
    keeperOnly: true,
  },
];

export default function HearthDoorways() {
  const { hasRole: isKeeper } = useHasRole("keeper");

  const visible = DOORWAYS.filter((d) => !d.keeperOnly || isKeeper);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {visible.map((d) => (
        <Link
          key={d.to}
          to={d.to}
          className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-5 py-5 transition-all hover:border-primary/40 hover:bg-card/60"
        >
          {/* atmosphere — a quiet, persistent tint that warms on hover */}
          <div
            className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background:
                d.atmosphere === "ember"
                  ? `radial-gradient(ellipse 90% 70% at 30% 110%, hsl(${d.tint} / 0.22), transparent 70%)`
                  : d.atmosphere === "archive"
                  ? `radial-gradient(ellipse 100% 80% at 50% 0%, hsl(${d.tint} / 0.14), transparent 75%)`
                  : `radial-gradient(ellipse 80% 90% at 50% 110%, hsl(${d.tint} / 0.16), transparent 70%)`,
            }}
          />
          <div className="relative flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border border-border/40 shrink-0 ${
                d.atmosphere === "ember" ? "group-hover:animate-pulse" : ""
              }`}
              style={{ background: `hsl(${d.tint} / 0.10)` }}
            >
              <d.icon className="w-4 h-4" style={{ color: `hsl(${d.tint})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif text-base text-foreground/90 leading-tight">
                  {d.label}
                </h4>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-serif italic text-muted-foreground/70 mt-0.5 leading-snug">
                {d.whisper}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

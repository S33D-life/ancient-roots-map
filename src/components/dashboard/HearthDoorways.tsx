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
import { Mountain, Archive, Wrench, ArrowRight } from "lucide-react";
import { useHasRole } from "@/hooks/use-role";

interface Doorway {
  to: string;
  icon: React.ElementType;
  label: string;
  whisper: string;
  tint: string; // hsl tone for soft glow
  keeperOnly?: boolean;
}

const DOORWAYS: Doorway[] = [
  {
    to: "/heartwood/quest-room",
    icon: Mountain,
    label: "Quest Cave",
    whisper: "Your unfolding path",
    tint: "30 70% 55%",
  },
  {
    to: "/vault?from=hearth",
    icon: Archive,
    label: "Heartwood Vault",
    whisper: "Hearts, memory, and exchange",
    tint: "140 40% 50%",
  },
  {
    to: "/admin/room",
    icon: Wrench,
    label: "Taproot",
    whisper: "Systems and stewardship",
    tint: "260 35% 55%",
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
          {/* soft tinted glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 30% 100%, hsl(${d.tint} / 0.18), transparent 70%)`,
            }}
          />
          <div className="relative flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 shrink-0"
              style={{ background: `hsl(${d.tint} / 0.08)` }}
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

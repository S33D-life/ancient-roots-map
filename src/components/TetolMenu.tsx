import { Link } from "react-router-dom";
import { Sprout, Heart, BookOpen, TreeDeciduous, Sparkles } from "lucide-react";

interface TetolMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { to: "/golden-dream", label: "yOur Golden Dream", icon: Sparkles },
  { to: "/council-of-life", label: "Council of Life", icon: Sprout },
  { to: "/gallery", label: "Heartwood", icon: Heart },
  { to: "/map", label: "Ancient Friends", icon: TreeDeciduous },
  { to: "/", label: "S33D", icon: Sprout, isRoot: true },
];

const TetolMenu = ({ open, onClose }: TetolMenuProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
      style={{ background: "linear-gradient(180deg, hsl(100 40% 85% / 0.97), hsl(120 35% 30% / 0.97))" }}
    >
      <div className="flex flex-col items-center gap-0 relative" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <h1
          className="text-4xl md:text-5xl font-serif tracking-[0.15em] mb-1"
          style={{ color: "hsl(42 75% 45%)" }}
        >
          TETOL
        </h1>
        <p
          className="text-sm md:text-base font-serif tracking-widest mb-8 text-center"
          style={{ color: "hsl(42 65% 40%)" }}
        >
          THE ETHEREAL TREE OF LIFE
        </p>

        {/* Tree trunk line */}
        <div className="relative flex flex-col items-center">
          {/* Vertical trunk */}
          <div
            className="absolute top-0 bottom-0 w-1 rounded-full"
            style={{ background: "linear-gradient(180deg, hsl(120 30% 45% / 0.5), hsl(120 30% 30% / 0.8))" }}
          />

          {/* Menu items along the trunk */}
          <div className="flex flex-col items-center gap-6 relative z-10">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 group transition-all duration-300 hover:scale-110"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:shadow-[0_0_25px_hsl(42_80%_50%_/_0.5)]"
                    style={{
                      borderColor: "hsl(42 70% 45%)",
                      background: `hsl(120 ${35 - i * 3}% ${35 + i * 4}% / 0.7)`,
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: "hsl(42 75% 50%)" }} />
                  </div>
                  <span
                    className="font-serif text-sm md:text-base tracking-wider text-center font-semibold uppercase"
                    style={{ color: "hsl(42 75% 45%)" }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tap to close hint */}
        <p className="mt-10 text-xs font-serif opacity-50" style={{ color: "hsl(42 60% 40%)" }}>
          tap anywhere to close
        </p>
      </div>
    </div>
  );
};

export default TetolMenu;

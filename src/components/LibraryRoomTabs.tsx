import { useRef, useEffect, useState } from "react";
import {
  Wand2, Globe, Music, Sprout, Star, Archive, Paintbrush, BookOpen, ScrollText, Lock, Activity,
} from "lucide-react";

interface RoomTab {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const ROOMS: RoomTab[] = [
  { value: "gallery", label: "Ancient Friends", icon: <Globe className="w-4 h-4" /> },
  { value: "bookshelf", label: "Bookshelf", icon: <BookOpen className="w-4 h-4" /> },
  { value: "staff-room", label: "Staff Room", icon: <Wand2 className="w-4 h-4" /> },
  { value: "music-room", label: "Music Room", icon: <Music className="w-4 h-4" /> },
  { value: "greenhouse", label: "Greenhouse", icon: <Sprout className="w-4 h-4" /> },
  { value: "wishlist", label: "Wishing Tree", icon: <Star className="w-4 h-4" /> },
  { value: "seed-cellar", label: "Seed Cellar", icon: <Archive className="w-4 h-4" /> },
  { value: "creators-path", label: "Creator's Path", icon: <Paintbrush className="w-4 h-4" /> },
  { value: "rhythms", label: "Rhythms", icon: <Activity className="w-4 h-4" /> },
  { value: "scrolls", label: "Scrolls & Records", icon: <ScrollText className="w-4 h-4" /> },
  { value: "vault", label: "Vaults", icon: <Lock className="w-4 h-4" /> },
];

interface LibraryRoomTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  vaultRevealed: boolean;
}

const LibraryRoomTabs = ({ activeTab, onTabChange, vaultRevealed }: LibraryRoomTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  // Scroll active tab into view & position the sliding indicator
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

      const container = scrollRef.current.getBoundingClientRect();
      const el = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: el.left - container.left + scrollRef.current.scrollLeft,
        width: el.width,
      });
    }
  }, [activeTab]);

  const visibleRooms = ROOMS.filter(
    (r) => r.value !== "vault" || vaultRevealed
  );

  return (
    <div className="relative w-full">
      {/* Track rail */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide relative"
        role="tablist"
        aria-label="Library rooms"
      >
        {/* Sliding glow indicator */}
        <div
          className="absolute bottom-0 h-[2px] rounded-full transition-all duration-500 ease-out"
          style={{
            ...indicatorStyle,
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
          }}
        />

        <div className="inline-flex gap-1 p-1 min-w-full">
          {visibleRooms.map((room) => {
            const isActive = activeTab === room.value;

            return (
              <button
                key={room.value}
                ref={isActive ? activeRef : undefined}
                role="tab"
                aria-selected={isActive}
                aria-controls={`room-${room.value}`}
                onClick={() => onTabChange(room.value)}
                className={`
                  group relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg
                  text-xs md:text-sm font-serif whitespace-nowrap
                  transition-all duration-300 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                  ${isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                style={isActive ? {
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.1))",
                  boxShadow: "0 0 16px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--primary) / 0.15)",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                } : {
                  background: "transparent",
                  border: "1px solid transparent",
                }}
              >
                {/* Icon with glow on active */}
                <span
                  className={`transition-all duration-300 ${
                    isActive
                      ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                      : "text-muted-foreground group-hover:text-foreground/70"
                  }`}
                >
                  {room.icon}
                </span>

                {/* Label */}
                <span className={`transition-colors duration-300 ${
                  isActive ? "text-primary" : ""
                }`}>
                  {room.label}
                </span>

                {/* Active doorway glow — top edge light */}
                {isActive && (
                  <span
                    className="absolute inset-x-2 -top-px h-px rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll fade hints */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none md:hidden" />
      <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-background/60 to-transparent pointer-events-none md:hidden" />
    </div>
  );
};

export default LibraryRoomTabs;

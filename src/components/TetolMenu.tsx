import { useNavigate } from "react-router-dom";
import { Sprout, Heart, TreeDeciduous, Sparkles, Crown, Leaf, Search, MapPin, BookOpen, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TetolMenuProps {
  open: boolean;
  onClose: () => void;
}

const treeItems = [
  {
    to: "/map",
    label: "Ancient Friends",
    subtitle: "The Roots",
    icon: TreeDeciduous,
    zone: "roots",
  },
  {
    to: "/library",
    label: "HeARTwood Library",
    subtitle: "The Trunk",
    icon: Heart,
    zone: "trunk",
  },
  {
    to: "/council-of-life",
    label: "Council of Life",
    subtitle: "The Canopy",
    icon: Leaf,
    zone: "canopy",
  },
  {
    to: "/golden-dream",
    label: "yOur Golden Dream",
    subtitle: "The Crown",
    icon: Crown,
    zone: "crown",
  },
];

const STATIC_PAGES = [
  { id: "page-atlas", title: "Ancient Friends Atlas", subtitle: "Map of ancient trees", icon: MapPin, route: "/map" },
  { id: "page-library", title: "HeARTwood Library", subtitle: "Rooms & scrolls", icon: BookOpen, route: "/library" },
  { id: "page-council", title: "Council of Life", subtitle: "Community council", icon: Leaf, route: "/council-of-life" },
  { id: "page-dream", title: "yOur Golden Dream", subtitle: "Vision & offerings", icon: Sparkles, route: "/golden-dream" },
  { id: "page-dashboard", title: "My Grove (Hearth)", subtitle: "Dashboard & profile", icon: Sprout, route: "/dashboard" },
  { id: "page-groves", title: "Groves & Projects", subtitle: "Tree projects", icon: TreeDeciduous, route: "/groves" },
];

const TetolMenu = ({ open, onClose }: TetolMenuProps) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeResults, setTreeResults] = useState<{ id: string; name: string; species: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setSearchQuery("");
      setTreeResults([]);
    }
  }, [open]);

  // Search trees from DB
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTreeResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase
        .from("trees")
        .select("id, name, species")
        .or(`name.ilike.%${searchQuery}%,species.ilike.%${searchQuery}%`)
        .limit(5);
      setTreeResults(data || []);
      setSearchLoading(false);
    }, 300);
  }, [searchQuery]);

  const filteredPages = searchQuery.trim()
    ? STATIC_PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (!open) return null;

  const handleItemClick = (to: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(to);
    setTimeout(() => onClose(), 150);
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-[90] flex items-start justify-center overflow-y-auto"
      style={{
        top: '60px',
        background: visible
          ? "radial-gradient(ellipse at 50% 30%, hsl(80 25% 12% / 0.97), hsl(80 15% 6% / 0.98))"
          : "transparent",
        opacity: visible ? 1 : 0,
        backdropFilter: visible ? "blur(20px)" : "none",
        WebkitBackdropFilter: visible ? "blur(20px)" : "none",
        transition: "opacity 0.5s ease-out, backdrop-filter 0.5s ease-out",
        paddingTop: '2rem',
      }}
      onClick={onClose}
    >
      {/* Floating leaves */}
      <FloatingLeaves visible={visible} />
      <div
        className="flex flex-col items-center relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: visible ? "scale(1)" : "scale(0.9)",
          opacity: visible ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-serif tracking-[0.25em] mb-0"
          style={{ color: "hsl(var(--primary))" }}
        >
          TETOL
        </h1>
        <p
          className="text-[10px] md:text-xs font-serif tracking-[0.35em] mb-4 text-center uppercase"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          The Ethereal Tree of Life
        </p>

        {/* Search bar */}
        <div className="w-72 md:w-80 mb-6 relative" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trees, pages…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-serif bg-background/20 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              style={{ borderColor: "hsl(var(--border) / 0.4)" }}
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: "hsl(var(--primary))" }} />
            )}
          </div>

          {/* Search results */}
          {searchQuery.trim() && (filteredPages.length > 0 || treeResults.length > 0) && (
            <div className="absolute top-full mt-2 w-full rounded-xl border shadow-xl overflow-hidden z-50" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border) / 0.4)" }}>
              {filteredPages.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-serif tracking-widest uppercase px-2 py-1" style={{ color: "hsl(var(--muted-foreground))" }}>Pages</p>
                  {filteredPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.id}
                        onClick={(e) => handleItemClick(page.route, e)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-primary/10 transition-colors"
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                        <div>
                          <p className="text-sm font-serif" style={{ color: "hsl(var(--foreground))" }}>{page.title}</p>
                          <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{page.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {treeResults.length > 0 && (
                <div className="p-2 border-t" style={{ borderColor: "hsl(var(--border) / 0.3)" }}>
                  <p className="text-[10px] font-serif tracking-widest uppercase px-2 py-1" style={{ color: "hsl(var(--muted-foreground))" }}>Trees</p>
                  {treeResults.map((tree) => (
                    <button
                      key={tree.id}
                      onClick={(e) => handleItemClick(`/tree/${tree.id}`, e)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-primary/10 transition-colors"
                    >
                      <TreeDeciduous className="w-4 h-4 shrink-0" style={{ color: "hsl(80 35% 50%)" }} />
                      <div>
                        <p className="text-sm font-serif" style={{ color: "hsl(var(--foreground))" }}>{tree.name}</p>
                        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{tree.species}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tree visualization */}
        <div className="relative flex flex-col items-center w-64 md:w-72">
          {/* Living trunk line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full"
            style={{
              top: "0",
              bottom: "0",
              background: "linear-gradient(180deg, hsl(42 80% 55% / 0.6) 0%, hsl(30 35% 30% / 0.8) 50%, hsl(25 30% 22% / 0.6) 100%)",
              opacity: visible ? 1 : 0,
              transition: "opacity 1s ease-out 0.3s",
            }}
          />

        {/* Crown - Golden Dream (index 3 in array) */}
        <TreeNode
          item={treeItems[3]}
          index={0}
          visible={visible}
          onClick={handleItemClick}
          glowColor="hsl(42 90% 55% / 0.4)"
          nodeStyle="crown"
        />

        {/* Branch connectors - canopy */}
        <BranchLines visible={visible} delay={0.35} side="both" />

        {/* Canopy - Council of Life (index 2 in array) */}
        <TreeNode
          item={treeItems[2]}
          index={1}
          visible={visible}
          onClick={handleItemClick}
          glowColor="hsl(120 40% 40% / 0.3)"
          nodeStyle="canopy"
        />

        {/* Trunk - Heartwood Library (index 1 in array) */}
        <TreeNode
          item={treeItems[1]}
          index={2}
          visible={visible}
          onClick={handleItemClick}
          glowColor="hsl(30 40% 35% / 0.3)"
          nodeStyle="trunk"
        />

        {/* Root tendrils */}
        <BranchLines visible={visible} delay={0.65} side="roots" />

        {/* S33D home link — just above the roots */}
        <button
          onClick={(e) => handleItemClick("/", e)}
          className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none py-3 w-full"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s ease-out 0.7s",
          }}
        >
          <Sprout
            className="w-6 h-6 transition-all duration-300 group-hover:scale-110"
            style={{ color: "hsl(var(--primary))" }}
          />
          <span
            className="font-serif text-xs tracking-[0.3em] uppercase transition-all duration-300 group-hover:tracking-[0.4em]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            S33D
          </span>
        </button>

        {/* Roots - Ancient Friends (index 0 in array) */}
        <TreeNode
          item={treeItems[0]}
          index={3}
          visible={visible}
          onClick={handleItemClick}
          glowColor="hsl(80 30% 30% / 0.3)"
          nodeStyle="roots"
        />
        </div>

        {/* Close hint */}
        <p
          className="mt-6 text-[10px] font-serif tracking-widest"
          style={{
            color: "hsl(var(--muted-foreground) / 0.4)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease-out 1.2s",
          }}
        >
          tap anywhere to close
        </p>
      </div>
    </div>
  );
};

interface TreeNodeProps {
  item: (typeof treeItems)[0];
  index: number;
  visible: boolean;
  onClick: (to: string, e: React.MouseEvent) => void;
  glowColor: string;
  nodeStyle: "crown" | "canopy" | "trunk" | "roots";
}

const nodeColors: Record<string, { bg: string; border: string; iconColor: string }> = {
  crown: {
    bg: "hsl(42 60% 18% / 0.6)",
    border: "hsl(42 80% 50% / 0.7)",
    iconColor: "hsl(42 90% 60%)",
  },
  canopy: {
    bg: "hsl(120 25% 18% / 0.6)",
    border: "hsl(120 35% 40% / 0.6)",
    iconColor: "hsl(120 45% 55%)",
  },
  trunk: {
    bg: "hsl(30 25% 18% / 0.6)",
    border: "hsl(30 35% 40% / 0.5)",
    iconColor: "hsl(30 50% 55%)",
  },
  roots: {
    bg: "hsl(80 20% 16% / 0.6)",
    border: "hsl(80 30% 35% / 0.5)",
    iconColor: "hsl(80 35% 50%)",
  },
};

const TreeNode = ({ item, index, visible, onClick, glowColor, nodeStyle }: TreeNodeProps) => {
  const Icon = item.icon;
  const colors = nodeColors[nodeStyle];
  const delay = index * 0.15 + 0.2;

  return (
    <button
      onClick={(e) => onClick(item.to, e)}
      className="relative z-10 flex items-center gap-4 group cursor-pointer bg-transparent border-none py-4 w-full"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(15px)",
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {/* Left label */}
      <div className="flex-1 text-right">
        <p
          className="font-serif text-sm md:text-base tracking-wider transition-all duration-300 group-hover:tracking-widest"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {item.label}
        </p>
        <p
          className="text-[10px] tracking-[0.2em] uppercase font-serif"
          style={{ color: colors.iconColor, opacity: 0.7 }}
        >
          {item.subtitle}
        </p>
      </div>

      {/* Center node */}
      <div
        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border shrink-0 transition-all duration-500 group-hover:scale-110"
        style={{
          background: colors.bg,
          borderColor: colors.border,
          boxShadow: `0 0 0px ${glowColor}`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${glowColor}`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px ${glowColor}`;
        }}
      >
        <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: colors.iconColor }} />
      </div>

      {/* Right spacer for symmetry */}
      <div className="flex-1" />
    </button>
  );
};

interface BranchLinesProps {
  visible: boolean;
  delay: number;
  side: "both" | "roots";
}

const BranchLines = ({ visible, delay, side }: BranchLinesProps) => (
  <div
    className="relative w-full h-2 flex items-center justify-center"
    style={{
      opacity: visible ? 1 : 0,
      transition: `opacity 0.8s ease-out ${delay}s`,
    }}
  >
    {side === "both" ? (
      <>
        <div
          className="absolute left-[15%] right-1/2 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.4))" }}
        />
        <div
          className="absolute right-[15%] left-1/2 h-[1px]"
          style={{ background: "linear-gradient(270deg, transparent, hsl(var(--border) / 0.4))" }}
        />
      </>
    ) : (
      <>
        <div
          className="absolute left-[20%] right-1/2 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.3))" }}
        />
        <div
          className="absolute right-[20%] left-1/2 h-[1px]"
          style={{ background: "linear-gradient(270deg, transparent, hsl(var(--border) / 0.3))" }}
        />
        {/* Extra root tendrils */}
        <div
          className="absolute left-[10%] right-[55%] h-[1px] translate-y-1"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.2))" }}
        />
        <div
          className="absolute right-[10%] left-[55%] h-[1px] translate-y-1"
          style={{ background: "linear-gradient(270deg, transparent, hsl(var(--border) / 0.2))" }}
        />
      </>
    )}
  </div>
);

const LEAF_SHAPES = ["🍃", "🍂", "🌿", "✦"] as const;

const FloatingLeaves = ({ visible }: { visible: boolean }) => {
  const leaves = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        char: LEAF_SHAPES[i % LEAF_SHAPES.length],
        left: `${5 + Math.random() * 90}%`,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 7,
        size: 10 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 60,
        startRotation: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {leaves.map((l) => (
        <span
          key={l.id}
          className="absolute"
          style={{
            left: l.left,
            top: "-20px",
            fontSize: `${l.size}px`,
            opacity: visible ? 0.25 : 0,
            animation: visible
              ? `tetol-fall ${l.duration}s linear ${l.delay}s infinite`
              : "none",
            "--drift": `${l.drift}px`,
            "--start-rot": `${l.startRotation}deg`,
          } as React.CSSProperties}
        >
          {l.char}
        </span>
      ))}
    </div>
  );
};

export default TetolMenu;

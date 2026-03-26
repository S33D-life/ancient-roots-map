/**
 * TetolHomePage — The TETOL tree diagram as the site homepage / navigation compass.
 * Users navigate the ecosystem by clicking tree nodes.
 * Light mode: warm botanical canopy experience with layered leaves and sunlight.
 */
import { useNavigate, Link } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Sprout, Heart, TreeDeciduous, Sparkles, Crown, Leaf,
  Hexagon, Apple, CalendarDays, TreePine, Map, Smartphone,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BetaGardenBanner from "@/components/BetaGardenBanner";
import EnsoNudge from "@/components/EnsoNudge";
import teotag from "@/assets/teotag-small.webp";
import { useIsNewUser } from "@/hooks/use-is-new-user";

const treeItems = [
  { to: "/map", label: "Ancient Friends", subtitle: "The Roots", icon: TreeDeciduous, zone: "roots" },
  { to: "/library", label: "HeARTwood Library", subtitle: "The Trunk", icon: Heart, zone: "trunk" },
  { to: "/council-of-life", label: "Council of Life", subtitle: "The Canopy", icon: Leaf, zone: "canopy" },
  { to: "/golden-dream", label: "yOur Golden Dream", subtitle: "The Crown", icon: Crown, zone: "crown" },
];

const quickLinks = [
  { to: "/library/music-room", label: "Tree Radio", icon: Smartphone },
  { to: "/library/staff-room", label: "Staff Room", icon: TreePine },
  { to: "/hives", label: "Species Hives", icon: Hexagon },
  { to: "/value-tree", label: "Value Tree", icon: TreePine },
  { to: "/support", label: "Support", icon: Heart },
  { to: "/vault", label: "Vault", icon: Sparkles },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

/* Dark mode node colors (unchanged) */
const nodeColorsDark: Record<string, { bg: string; border: string; iconColor: string; glow: string }> = {
  crown: {
    bg: "hsl(42 60% 18% / 0.6)",
    border: "hsl(42 80% 50% / 0.7)",
    iconColor: "hsl(42 90% 60%)",
    glow: "hsl(42 90% 55% / 0.4)",
  },
  canopy: {
    bg: "hsl(120 25% 18% / 0.6)",
    border: "hsl(120 35% 40% / 0.6)",
    iconColor: "hsl(120 45% 55%)",
    glow: "hsl(120 40% 40% / 0.3)",
  },
  trunk: {
    bg: "hsl(30 25% 18% / 0.6)",
    border: "hsl(30 35% 40% / 0.5)",
    iconColor: "hsl(30 50% 55%)",
    glow: "hsl(30 40% 35% / 0.3)",
  },
  roots: {
    bg: "hsl(80 20% 16% / 0.6)",
    border: "hsl(80 30% 35% / 0.5)",
    iconColor: "hsl(80 35% 50%)",
    glow: "hsl(80 30% 30% / 0.3)",
  },
};

/* Light mode node colors — warm botanical tones */
const nodeColorsLight: Record<string, { bg: string; border: string; iconColor: string; glow: string }> = {
  crown: {
    bg: "hsl(42 40% 94% / 0.85)",
    border: "hsl(42 50% 65% / 0.6)",
    iconColor: "hsl(42 65% 42%)",
    glow: "hsl(42 55% 50% / 0.2)",
  },
  canopy: {
    bg: "hsl(110 20% 93% / 0.85)",
    border: "hsl(120 25% 60% / 0.5)",
    iconColor: "hsl(120 35% 38%)",
    glow: "hsl(120 30% 45% / 0.15)",
  },
  trunk: {
    bg: "hsl(30 25% 93% / 0.85)",
    border: "hsl(30 30% 65% / 0.5)",
    iconColor: "hsl(30 45% 38%)",
    glow: "hsl(30 35% 45% / 0.15)",
  },
  roots: {
    bg: "hsl(80 18% 92% / 0.85)",
    border: "hsl(80 22% 60% / 0.5)",
    iconColor: "hsl(80 30% 36%)",
    glow: "hsl(80 25% 42% / 0.15)",
  },
};

const LEAF_SHAPES = ["🍃", "🍂", "🌿", "✦"] as const;

/** Depth layers for parallax-like leaf variation */
type LeafDepth = "near" | "mid" | "far";

const TetolHomePage = () => {
  useDocumentTitle("S33D — Explore the Living System");
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const { isNewUser } = useIsNewUser();

  const isLight = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("light");
  }, []);

  const nodeColors = isLight ? nodeColorsLight : nodeColorsDark;

  const handleItemClick = useCallback((to: string) => {
    setActiveNode(to);
    setTimeout(() => navigate(to), 120);
  }, [navigate]);

  const leaves = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const depth: LeafDepth = i < 3 ? "near" : i < 9 ? "mid" : "far";
        const sizeMap = { near: 16 + Math.random() * 6, mid: 10 + Math.random() * 8, far: 8 + Math.random() * 5 };
        const durationMap = { near: 14 + Math.random() * 6, mid: 10 + Math.random() * 8, far: 18 + Math.random() * 10 };
        return {
          id: i,
          char: LEAF_SHAPES[i % LEAF_SHAPES.length],
          left: `${5 + Math.random() * 90}%`,
          delay: Math.random() * 8,
          duration: durationMap[depth],
          size: sizeMap[depth],
          drift: (Math.random() - 0.5) * (depth === "near" ? 80 : depth === "mid" ? 60 : 40),
          startRotation: Math.random() * 360,
          depth,
        };
      }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Header />
      <BetaGardenBanner />

      <main
        className="flex-1 flex flex-col items-center relative overflow-hidden pt-content px-safe"
        style={{
          background: isLight
            ? "linear-gradient(180deg, hsl(38 35% 95%) 0%, hsl(40 30% 92%) 40%, hsl(36 28% 94%) 100%)"
            : "radial-gradient(ellipse at 50% 30%, hsl(80 25% 12% / 0.97), hsl(80 15% 6% / 0.98))",
        }}
      >
        {/* Layer 1: Canopy silhouette overlay (light only) */}
        {isLight && <div className="tetol-canopy-overlay" />}

        {/* Layer 1.5: Sunlight shifting layer (light only) */}
        {isLight && <div className="tetol-sunlight-layer" />}

        {/* Layer 3: Floating leaves — with depth classes in light mode */}
        <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
          {leaves.map((l) => (
            <span
              key={l.id}
              className={`absolute ${isLight ? `tetol-leaf-organic tetol-leaf-${l.depth}` : ""}`}
              style={{
                left: l.left,
                top: "-20px",
                fontSize: `${l.size}px`,
                opacity: 0.2,
                animation: `tetol-fall ${l.duration}s linear ${l.delay}s infinite`,
                "--drift": `${l.drift}px`,
                "--start-rot": `${l.startRotation}deg`,
                "--leaf-peak-opacity": l.depth === "near" ? "0.35" : l.depth === "mid" ? "0.22" : "0.1",
                "--leaf-fade-opacity": l.depth === "near" ? "0.2" : l.depth === "mid" ? "0.12" : "0.05",
              } as React.CSSProperties}
            >
              {l.char}
            </span>
          ))}
        </div>

        {/* Layer 2: Navigation content */}
        <div className="flex flex-col items-center relative z-10 py-12 md:py-16 pb-16 md:pb-20">
          {/* Title with TEOTAG hover */}
          <div className="relative group/title flex flex-col items-center">
            <h1
              className="text-4xl md:text-5xl font-serif tracking-[0.25em] mb-0 cursor-default"
              style={{
                color: "hsl(var(--primary))",
                textShadow: isLight
                  ? "0 1px 8px hsl(var(--primary) / 0.15)"
                  : "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.25)",
              }}
            >
              TETOL
            </h1>
            <p
              className="text-[10px] md:text-xs font-serif tracking-[0.35em] mb-8 text-center uppercase"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              The Ethereal Tree of Life
            </p>

            {!isNewUser && <div className="mb-8" />}
            {isNewUser && <div className="mb-6" />}
            {/* TEOTAG hover tooltip — hidden for new users */}
            {!isNewUser && (
            <div className="absolute top-full mt-1 opacity-0 group-hover/title:opacity-100 pointer-events-none group-hover/title:pointer-events-auto transition-all duration-300 z-50 scale-95 group-hover/title:scale-100">
              <div
                className="flex items-start gap-3 rounded-xl border p-3 max-w-[260px] backdrop-blur-md"
                style={{
                  background: "hsl(var(--card) / 0.95)",
                  borderColor: "hsl(var(--primary) / 0.3)",
                  boxShadow: "0 8px 32px hsl(var(--primary) / 0.15)",
                }}
              >
                <img src={teotag} alt="TEOTAG" className="w-10 h-10 rounded-full border border-primary/40 shrink-0" />
                <p className="text-xs font-serif leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                  I am <span className="text-primary font-bold">TEOTAG</span> — The Echo of the Ancient Groves and your guide around The Ethereal Tree of Life.
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Tree visualization */}
          <div className="relative flex flex-col items-center w-72 md:w-80">
            {/* Living trunk line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full"
              style={{
                top: "0",
                bottom: "0",
                background: isLight
                  ? "linear-gradient(180deg, hsl(42 50% 60% / 0.35) 0%, hsl(30 30% 50% / 0.5) 50%, hsl(25 25% 45% / 0.35) 100%)"
                  : "linear-gradient(180deg, hsl(42 80% 55% / 0.6) 0%, hsl(30 35% 30% / 0.8) 50%, hsl(25 30% 22% / 0.6) 100%)",
              }}
            />

            {/* Crown — Golden Dream */}
            <TreeNode item={treeItems[3]} onClick={handleItemClick} nodeStyle="crown" active={activeNode === treeItems[3].to} colors={nodeColors} isLight={isLight} />

            {/* Branch connectors */}
            <BranchLines side="both" />

            {/* Canopy — Council of Life */}
            <TreeNode item={treeItems[2]} onClick={handleItemClick} nodeStyle="canopy" active={activeNode === treeItems[2].to} colors={nodeColors} isLight={isLight} />

            {/* Trunk — Heartwood Library */}
            <TreeNode item={treeItems[1]} onClick={handleItemClick} nodeStyle="trunk" active={activeNode === treeItems[1].to} colors={nodeColors} isLight={isLight} />

            {/* Root tendrils */}
            <BranchLines side="roots" />

            {/* S33D gateway node — wrapped in Ensō nudge */}
            <div className="relative z-10 py-3 w-full flex flex-col items-center">
              {/* Start Here cue — new users only, points toward seed */}
              {isNewUser && (
                <span
                  className="absolute right-[calc(50%+42px)] top-1/2 -translate-y-1/2 font-serif text-[11px] tracking-[0.2em] uppercase whitespace-nowrap pointer-events-none select-none"
                  style={{
                    color: "hsl(42 70% 60% / 0.8)",
                    animation: "startHerePulse 3s ease-in-out infinite",
                  }}
                >
                  Start Here <span className="inline-block" style={{ fontSize: "13px" }}>→</span>
                </span>
              )}
              <EnsoNudge size={46} offsetY={-10}>
                <button
                  onClick={() => { setActiveNode("/s33d"); setTimeout(() => navigate({ pathname: "/s33d", hash: "#ground" }), 120); }}
                  className="flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none transition-all duration-200"
                  style={activeNode === "/s33d" ? { transform: "scale(1.08)", filter: "brightness(1.3)" } : {}}
                >
                  <Sprout
                    className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                  <span
                    className="font-serif text-xs tracking-[0.3em] uppercase transition-all duration-300 group-hover:tracking-[0.4em]"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    S33D
                  </span>
                </button>
              </EnsoNudge>
            </div>

            {/* Roots — Ancient Friends */}
            <TreeNode item={treeItems[0]} onClick={handleItemClick} nodeStyle="roots" active={activeNode === treeItems[0].to} colors={nodeColors} isLight={isLight} />
          </div>

          {/* Quick links — hidden for new users to reduce noise */}
          {!isNewUser && (
          <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-xs md:max-w-sm">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-serif transition-all hover:border-primary/50 hover:bg-primary/10 ${isLight ? "tetol-quick-link" : ""}`}
                  style={{
                    borderColor: "hsl(var(--border) / 0.3)",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
          })}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ── Tree Node ── */
interface TreeNodeProps {
  item: (typeof treeItems)[number];
  onClick: (to: string) => void;
  nodeStyle: "crown" | "canopy" | "trunk" | "roots";
  active?: boolean;
  colors: Record<string, { bg: string; border: string; iconColor: string; glow: string }>;
  isLight: boolean;
}

const TreeNode = ({ item, onClick, nodeStyle, active, colors, isLight }: TreeNodeProps) => {
  const Icon = item.icon;
  const c = colors[nodeStyle];

  return (
    <button
      onClick={() => onClick(item.to)}
      className="relative z-10 flex items-center gap-4 group cursor-pointer bg-transparent border-none py-4 w-full transition-all duration-200"
      style={active ? { transform: "scale(1.06)", filter: isLight ? "brightness(1.05)" : "brightness(1.2)" } : {}}
    >
      <div className="flex-1 text-right">
        <p
          className="font-serif text-sm md:text-base tracking-wider transition-all duration-300 group-hover:tracking-widest"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {item.label}
        </p>
        <p
          className="text-[10px] tracking-[0.2em] uppercase font-serif"
          style={{ color: c.iconColor, opacity: 0.7 }}
        >
          {item.subtitle}
        </p>
      </div>

      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border shrink-0 transition-all duration-500 group-hover:scale-110 ${isLight ? "tetol-node-circle" : ""}`}
        style={{
          background: c.bg,
          borderColor: c.border,
          boxShadow: `0 0 0px ${c.glow}`,
          ...(isLight ? { backdropFilter: "blur(8px)" } : {}),
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 ${isLight ? "16" : "25"}px ${c.glow}`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px ${c.glow}`;
        }}
      >
        <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: c.iconColor }} />
      </div>

      <div className="flex-1" />
    </button>
  );
};

/* ── Branch Lines ── */
const BranchLines = ({ side }: { side: "both" | "roots" }) => (
  <div className="relative w-full h-2 flex items-center justify-center">
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

export default TetolHomePage;

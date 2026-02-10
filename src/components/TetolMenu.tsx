import { useNavigate } from "react-router-dom";
import { Sprout, Heart, TreeDeciduous, Sparkles, Crown, Leaf } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface TetolMenuProps {
  open: boolean;
  onClose: () => void;
}

const treeItems = [
  {
    to: "/golden-dream",
    label: "yOur Golden Dream",
    subtitle: "The Crown",
    icon: Crown,
    zone: "crown",
  },
  {
    to: "/council-of-life",
    label: "Council of Life",
    subtitle: "The Canopy",
    icon: Leaf,
    zone: "canopy",
  },
  {
    to: "/library",
    label: "HeARTwood Library",
    subtitle: "The Trunk",
    icon: Heart,
    zone: "trunk",
  },
  {
    to: "/map",
    label: "Ancient Friends",
    subtitle: "The Roots",
    icon: TreeDeciduous,
    zone: "roots",
  },
];

const TetolMenu = ({ open, onClose }: TetolMenuProps) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleItemClick = (to: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(to);
    setTimeout(() => onClose(), 150);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      onClick={onClose}
      style={{
        background: visible
          ? "radial-gradient(ellipse at 50% 60%, hsl(80 25% 12% / 0.98), hsl(80 15% 6% / 0.99))"
          : "transparent",
        opacity: visible ? 1 : 0,
        backdropFilter: visible ? "blur(12px)" : "none",
        WebkitBackdropFilter: visible ? "blur(12px)" : "none",
        transition: "opacity 0.5s ease-out, backdrop-filter 0.5s ease-out",
      }}
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
          className="text-[10px] md:text-xs font-serif tracking-[0.35em] mb-8 text-center uppercase"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          The Ethereal Tree of Life
        </p>

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

          {/* Crown - Golden Dream */}
          <TreeNode
            item={treeItems[0]}
            index={0}
            visible={visible}
            onClick={handleItemClick}
            glowColor="hsl(42 90% 55% / 0.4)"
            nodeStyle="crown"
          />

          {/* Branch connectors - canopy */}
          <BranchLines visible={visible} delay={0.35} side="both" />

          {/* Canopy - Council of Life */}
          <TreeNode
            item={treeItems[1]}
            index={1}
            visible={visible}
            onClick={handleItemClick}
            glowColor="hsl(120 40% 40% / 0.3)"
            nodeStyle="canopy"
          />

          {/* Trunk - Heartwood */}
          <TreeNode
            item={treeItems[2]}
            index={2}
            visible={visible}
            onClick={handleItemClick}
            glowColor="hsl(30 40% 35% / 0.3)"
            nodeStyle="trunk"
          />

          {/* Root tendrils */}
          <BranchLines visible={visible} delay={0.65} side="roots" />

          {/* Roots - Ancient Friends */}
          <TreeNode
            item={treeItems[3]}
            index={3}
            visible={visible}
            onClick={handleItemClick}
            glowColor="hsl(80 30% 30% / 0.3)"
            nodeStyle="roots"
          />
        </div>

        {/* S33D home link at the very bottom */}
        <button
          onClick={(e) => handleItemClick("/", e)}
          className="mt-10 flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s ease-out 0.9s",
          }}
        >
          <Sprout
            className="w-5 h-5 transition-all duration-300 group-hover:scale-110"
            style={{ color: "hsl(var(--primary))" }}
          />
          <span
            className="font-serif text-xs tracking-[0.3em] uppercase transition-all duration-300 group-hover:tracking-[0.4em]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            S33D
          </span>
        </button>

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

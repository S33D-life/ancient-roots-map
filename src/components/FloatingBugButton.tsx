import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import BugReportDialog from "@/components/BugReportDialog";

const STORAGE_KEY = "bug-btn-pos";

const FloatingBugButton = () => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 0, y: 0 };
  });
  const [dragged, setDragged] = useState(false);

  const handleDragEnd = (_: any, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    const newPos = { x: pos.x + info.offset.x, y: pos.y + info.offset.y };
    setPos(newPos);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos)); } catch {}
  };

  return (
    <motion.div
      className="fixed bottom-[5.5rem] right-3 z-[65] md:bottom-4 touch-none"
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={pos}
      style={{ x: pos.x, y: pos.y }}
      onDragStart={() => setDragged(true)}
      onDragEnd={(e, info) => {
        handleDragEnd(e, info);
        setTimeout(() => setDragged(false), 100);
      }}
      whileDrag={{ scale: 1.15, cursor: "grabbing" }}
    >
      <BugReportDialog
        trigger={
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-grab"
            style={{
              background: "hsl(var(--card) / 0.9)",
              border: "1px solid hsl(var(--border) / 0.4)",
              backdropFilter: "blur(12px)",
              color: "hsl(var(--muted-foreground))",
            }}
            title="Bounty Hunter · drag to reposition"
            onClick={(e) => {
              if (dragged) e.preventDefault();
            }}
          >
            <Shield className="w-4 h-4" />
          </button>
        }
      />
    </motion.div>
  );
};

export default FloatingBugButton;

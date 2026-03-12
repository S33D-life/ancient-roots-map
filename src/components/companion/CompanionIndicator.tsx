import { Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCompanion } from "@/contexts/CompanionContext";
import PointerOrb from "./PointerOrb";

/**
 * Desktop-side indicator + pointer orb overlay.
 * Renders the "Companion" badge and the remote pointer orb when paired.
 */
export default function CompanionIndicator({ className }: { className?: string }) {
  const { pointer } = useCompanion();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          "bg-primary/10 border border-primary/20 text-primary",
          "text-[10px] font-serif backdrop-blur-md",
          className,
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Companion
      </motion.div>

      <PointerOrb x={pointer.x} y={pointer.y} visible={pointer.visible} />
    </>
  );
}

import { Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CaptureButtonProps {
  onClick: () => void;
  capturing?: boolean;
  className?: string;
}

/**
 * CaptureButton — subtle screenshot export button for fullscreen views.
 * Placed near the fullscreen toggle (top-right area).
 */
const CaptureButton = ({ onClick, capturing = false, className }: CaptureButtonProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      disabled={capturing}
      data-capture-exclude
      className={cn(
        "absolute z-[50] top-3 right-14 flex items-center gap-1.5 rounded-full backdrop-blur-md transition-all duration-200",
        "bg-card/65 border border-border/20 text-foreground/80",
        "hover:brightness-125 active:scale-95 disabled:opacity-50",
        "px-3 py-1.5",
        className,
      )}
      title="Capture view as image"
      aria-label="Capture screenshot"
    >
      {capturing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Camera className="w-4 h-4" />
      )}
      <span className="hidden md:inline text-xs font-serif">
        {capturing ? "Capturing…" : "Capture"}
      </span>
    </motion.button>
  );
};

export default CaptureButton;

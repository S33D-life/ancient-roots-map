/**
 * VaultSection — A toggleable accordion card for the Vault.
 * Supports expand/collapse with animated chevron, active glow,
 * and optional fullscreen focus mode.
 */
import { ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Maximize2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaultSectionProps {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string | number;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
  /** Accent color in hsl format for the glow, e.g. "var(--primary)" */
  accent?: string;
  allowFullscreen?: boolean;
}

const VaultSection = ({
  id,
  icon,
  title,
  subtitle,
  badge,
  isOpen,
  onToggle,
  children,
  accent = "var(--primary)",
  allowFullscreen = false,
}: VaultSectionProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFocused(true);
    document.body.style.overflow = "hidden";
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFocused(false);
    document.body.style.overflow = "";
  }, []);

  // Fullscreen focus mode
  if (isFocused) {
    return (
      <motion.div
        className="fixed inset-0 z-[90] overflow-y-auto"
        style={{ background: "hsl(var(--background))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border/20 backdrop-blur-sm"
          style={{ background: "hsl(var(--background) / 0.9)" }}
        >
          <button
            onClick={exitFullscreen}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Back to vault"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-foreground">
            {icon}
            <span className="font-serif text-sm">{title}</span>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 space-y-4">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden",
        isOpen
          ? "border-primary/30"
          : "border-border/20 hover:border-border/40"
      )}
      style={isOpen ? {
        background: "linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--card) / 0.85))",
        boxShadow: `0 0 20px hsl(${accent} / 0.08), inset 0 1px 0 hsl(${accent} / 0.1)`,
      } : {
        background: "hsl(var(--card) / 0.4)",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
        aria-expanded={isOpen}
        aria-controls={`vault-section-${id}`}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
            isOpen
              ? "bg-primary/15 text-primary"
              : "bg-secondary/40 text-muted-foreground group-hover:text-foreground"
          )}
          style={isOpen ? { boxShadow: `0 0 10px hsl(${accent} / 0.2)` } : {}}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-serif text-sm transition-colors duration-200",
            isOpen ? "text-foreground" : "text-foreground/80"
          )}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/60 font-serif truncate">{subtitle}</p>
          )}
        </div>

        {badge != null && (
          <span className="text-[10px] font-mono text-muted-foreground/70 bg-secondary/30 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}

        {/* Fullscreen button */}
        {allowFullscreen && isOpen && (
          <button
            onClick={handleFullscreen}
            className="p-1 rounded text-muted-foreground/40 hover:text-foreground/70 transition-colors"
            aria-label={`Focus on ${title}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Animated chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="text-muted-foreground/50"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`vault-section-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaultSection;

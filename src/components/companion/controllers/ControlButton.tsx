import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  size?: "sm" | "md";
  large?: boolean;
  className?: string;
}

/**
 * Touch-friendly control button for the companion controller surface.
 * Minimum 44px tap target for mobile ergonomics.
 */
export default function ControlButton({
  icon: Icon,
  label,
  onPress,
  size = "md",
  large = false,
  className,
}: ControlButtonProps) {
  return (
    <button
      onClick={onPress}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl transition-all",
        "bg-secondary/30 border border-border/30 text-foreground/80",
        "hover:bg-secondary/50 hover:border-primary/30 active:scale-90 active:bg-primary/20",
        size === "sm" ? "w-11 h-11" : large ? "w-16 h-16" : "w-13 h-13",
        "min-w-[44px] min-h-[44px]",
        className,
      )}
      title={label}
      aria-label={label}
    >
      <Icon className={cn(size === "sm" ? "w-4 h-4" : large ? "w-6 h-6" : "w-5 h-5")} />
      {size !== "sm" && (
        <span className="text-[8px] text-muted-foreground mt-0.5 leading-none">{label}</span>
      )}
    </button>
  );
}

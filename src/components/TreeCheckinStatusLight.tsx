/**
 * TreeCheckinStatusLight — a calm, living indicator dot
 * showing the user's relationship status with an Ancient Friend.
 *
 * red = never visited
 * orange = visited before, no active window
 * green = active offering window
 * flashing_green = <1 hour remaining
 */
import { cn } from "@/lib/utils";
import type { CheckinLight } from "@/hooks/use-tree-checkin-status";

interface TreeCheckinStatusLightProps {
  light: CheckinLight;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const LIGHT_CONFIG: Record<CheckinLight, { color: string; label: string; animate: boolean }> = {
  red: {
    color: "bg-destructive/70",
    label: "Not yet visited",
    animate: false,
  },
  orange: {
    color: "bg-[hsl(30,85%,55%)]",
    label: "Previously visited",
    animate: false,
  },
  green: {
    color: "bg-[hsl(142,60%,45%)]",
    label: "Active — offerings open",
    animate: false,
  },
  flashing_green: {
    color: "bg-[hsl(142,60%,45%)]",
    label: "Window closing soon",
    animate: true,
  },
};

const SIZE_MAP = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

const RING_SIZE_MAP = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export default function TreeCheckinStatusLight({
  light,
  size = "md",
  showLabel = false,
  className,
}: TreeCheckinStatusLightProps) {
  const config = LIGHT_CONFIG[light];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("relative flex items-center justify-center", RING_SIZE_MAP[size])}>
        {/* Outer glow ring for green states */}
        {(light === "green" || light === "flashing_green") && (
          <div
            className={cn(
              "absolute inset-0 rounded-full opacity-30",
              config.color,
              config.animate ? "animate-ping" : "animate-pulse"
            )}
          />
        )}
        {/* Core dot */}
        <div
          className={cn(
            "rounded-full relative z-10 shadow-sm",
            SIZE_MAP[size],
            config.color,
            config.animate && "animate-pulse"
          )}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-serif text-muted-foreground leading-tight">
          {config.label}
        </span>
      )}
    </div>
  );
}

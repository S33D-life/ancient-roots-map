import { useFullscreen } from "@/hooks/use-fullscreen";
import FullscreenShell from "@/components/FullscreenShell";
import FullscreenToggle from "@/components/FullscreenToggle";
import { cn } from "@/lib/utils";

interface FullscreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Background tone when fullscreen */
  tone?: "dark" | "page";
  /** Position of the toggle button */
  togglePosition?: "top-right" | "top-left" | "bottom-right";
  /** Hide the inline toggle (e.g. when parent controls it) */
  hideToggle?: boolean;
}

/**
 * FullscreenWrapper — drop-in container that adds an "Immerse" toggle
 * to any visual component. When activated, the children expand into
 * FullscreenShell with consistent enter/exit animation.
 *
 * Usage:
 *   <FullscreenWrapper tone="dark">
 *     <SpiralOfSpecies />
 *   </FullscreenWrapper>
 */
const FullscreenWrapper = ({
  children,
  className,
  tone = "dark",
  togglePosition = "top-right",
  hideToggle = false,
}: FullscreenWrapperProps) => {
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  return (
    <>
      {/* Normal inline view */}
      <div className={cn("relative", className)}>
        {children}
        {!hideToggle && !isFullscreen && (
          <FullscreenToggle
            isFullscreen={false}
            onToggle={toggleFullscreen}
            position={togglePosition}
            compact
          />
        )}
      </div>

      {/* Fullscreen overlay */}
      <FullscreenShell active={isFullscreen} tone={tone}>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <FullscreenToggle
          isFullscreen
          onToggle={exitFullscreen}
          position="top-right"
        />
      </FullscreenShell>
    </>
  );
};

export default FullscreenWrapper;

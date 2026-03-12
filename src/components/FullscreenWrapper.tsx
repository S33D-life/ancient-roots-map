import { useRef } from "react";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useCaptureView } from "@/hooks/use-capture-view";
import FullscreenShell from "@/components/FullscreenShell";
import FullscreenToggle from "@/components/FullscreenToggle";
import CaptureButton from "@/components/CaptureButton";
import ZoomPanLayer from "@/components/ZoomPanLayer";
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
  /** Enable zoom & pan in fullscreen mode (default true) */
  zoomable?: boolean;
  /** Enable screenshot capture button in fullscreen (default true) */
  capturable?: boolean;
  /** Filename prefix for captures */
  captureFilename?: string;
}

/**
 * FullscreenWrapper — drop-in container that adds immerse, zoom, and capture
 * to any visual component. In fullscreen, content becomes zoomable/pannable
 * with a capture button to export the view.
 */
const FullscreenWrapper = ({
  children,
  className,
  tone = "dark",
  togglePosition = "top-right",
  hideToggle = false,
  zoomable = true,
  capturable = true,
  captureFilename = "s33d-view",
}: FullscreenWrapperProps) => {
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();
  const { captureRef, capture, capturing } = useCaptureView();

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
        <div className="flex-1 overflow-hidden" ref={captureRef as any}>
          {zoomable ? (
            <ZoomPanLayer className="w-full h-full">
              {children}
            </ZoomPanLayer>
          ) : (
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          )}
        </div>

        {/* Controls toolbar — excluded from capture */}
        <div data-capture-exclude>
          {capturable && (
            <CaptureButton
              onClick={() => capture({ filename: captureFilename })}
              capturing={capturing}
            />
          )}
          <FullscreenToggle
            isFullscreen
            onToggle={exitFullscreen}
            position="top-right"
          />
        </div>
      </FullscreenShell>
    </>
  );
};

export default FullscreenWrapper;

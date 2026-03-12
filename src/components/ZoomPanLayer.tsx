import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useZoomPan, type UseZoomPanOptions } from "@/hooks/use-zoom-pan";

interface ZoomPanLayerProps extends UseZoomPanOptions {
  children: React.ReactNode;
  className?: string;
  /** Class applied to the inner transformable content */
  contentClassName?: string;
}

/**
 * ZoomPanLayer — wraps any visualisation in a zoomable, pannable container.
 *
 * Usage:
 *   <ZoomPanLayer>
 *     <SpiralVisualization />
 *   </ZoomPanLayer>
 */
const ZoomPanLayer = forwardRef<HTMLDivElement, ZoomPanLayerProps>(
  ({ children, className, contentClassName, ...zoomOpts }, _ref) => {
    const { containerProps, transformStyle, isZoomed, reset, state } = useZoomPan(zoomOpts);

    return (
      <div
        {...containerProps}
        className={cn(
          "relative overflow-hidden cursor-grab active:cursor-grabbing",
          className,
        )}
      >
        {/* Transformable content */}
        <div style={transformStyle} className={contentClassName}>
          {children}
        </div>

        {/* Zoom indicator — shows when zoomed, click to reset */}
        {isZoomed && (
          <button
            onClick={reset}
            data-capture-exclude
            className="absolute bottom-3 left-3 z-[50] px-2.5 py-1 rounded-full text-[10px] font-serif
              bg-card/65 border border-border/20 text-foreground/70 backdrop-blur-md
              hover:brightness-125 active:scale-95 transition-all"
            title="Reset zoom (press 0)"
            aria-label="Reset zoom"
          >
            {Math.round(state.scale * 100)}% · Reset
          </button>
        )}
      </div>
    );
  },
);

ZoomPanLayer.displayName = "ZoomPanLayer";

export default ZoomPanLayer;

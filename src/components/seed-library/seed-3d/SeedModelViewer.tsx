import { useState, useCallback, lazy, Suspense } from "react";
import { RotateCcw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEED_CONFIGS } from "./seed-configs";
import SeedSelector from "./SeedSelector";
import SeedInfoPanel from "./SeedInfoPanel";

// Lazy-load the heavy Three.js scene
const SeedScene = lazy(() => import("./SeedScene"));

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2 animate-pulse">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-serif">Gathering seed…</p>
      </div>
    </div>
  );
}

function WebGLUnavailable({ onFallback }: { onFallback: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-xs">
        <p className="font-serif text-foreground">3D viewer unavailable</p>
        <p className="text-xs text-muted-foreground">
          Your device or browser doesn't support WebGL. You can still explore seeds through the image gallery.
        </p>
        <Button variant="outline" size="sm" onClick={onFallback}>
          <ImageIcon className="w-4 h-4 mr-1" /> View images instead
        </Button>
      </div>
    </div>
  );
}

interface SeedModelViewerProps {
  /** If provided, start on this seed slug */
  initialSlug?: string;
  /** Called when user wants to exit 3D and go back to images */
  onFallbackToImages?: () => void;
}

export default function SeedModelViewer({
  initialSlug,
  onFallbackToImages,
}: SeedModelViewerProps) {
  const [selectedSlug, setSelectedSlug] = useState(
    initialSlug || SEED_CONFIGS[0].slug,
  );
  const [webglFailed, setWebglFailed] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      return !canvas.getContext("webgl2") && !canvas.getContext("webgl");
    } catch {
      return true;
    }
  });
  const [sceneKey, setSceneKey] = useState(0);

  const activeSeed = SEED_CONFIGS.find((s) => s.slug === selectedSlug) || SEED_CONFIGS[0];

  const resetView = useCallback(() => {
    setSceneKey((k) => k + 1);
  }, []);

  const handleFallback = useCallback(() => {
    onFallbackToImages?.();
  }, [onFallbackToImages]);

  if (webglFailed) {
    return (
      <div className="rounded-[1.75rem] border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="h-[20rem] md:h-[28rem]">
          <WebGLUnavailable onFallback={handleFallback} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeedSelector selected={selectedSlug} onSelect={setSelectedSlug} />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            title="Reset camera"
            aria-label="Reset 3D view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          {onFallbackToImages && (
            <Button variant="ghost" size="sm" onClick={handleFallback}>
              <ImageIcon className="w-4 h-4 mr-1" /> Images
            </Button>
          )}
        </div>
      </div>

      {/* Viewer + Info */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] items-start">
        {/* 3D Canvas */}
        <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-[#1a1a14] via-[#1e1d17] to-[#15170f] overflow-hidden">
          <div className="h-[20rem] md:h-[28rem] relative">
            <Suspense fallback={<LoadingFallback />}>
              <SeedScene key={`${activeSeed.slug}-${sceneKey}`} seed={activeSeed} />
            </Suspense>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/20 px-4 py-2.5 text-[11px] text-muted-foreground/60">
            <span>Drag to orbit · Scroll to zoom · Placeholder geometry — real models coming soon</span>
          </div>
        </div>

        {/* Info panel */}
        <div className="rounded-[1.75rem] border border-border/60 bg-card/40 backdrop-blur-sm p-4 md:p-5">
          <SeedInfoPanel seed={activeSeed} />
        </div>
      </div>
    </div>
  );
}

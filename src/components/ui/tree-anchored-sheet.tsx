/**
 * TreeAnchoredSheet — bottom-anchored sheet that never fully covers the tree.
 *
 * Movement 3 of the Convergence Phase: "never lose the tree".
 *
 * Unlike ResponsiveDialog (which centers a modal on desktop and uses an
 * opaque overlay on mobile), TreeAnchoredSheet:
 *   • Stays anchored to the bottom on BOTH mobile and desktop
 *   • Uses a faint overlay so the tree imagery / page above remains visible
 *   • Defaults to ~60% viewport height — the tree breathes above the sheet
 *   • Expands to ~95% only when the user drags up or the keyboard opens
 *
 * API is intentionally compatible with ResponsiveDialog so flows can migrate
 * with a single import change.
 */
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface TreeAnchoredSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  contentClassName?: string;
  /** Snap points for the sheet. Defaults to [0.6, 0.95] so tree stays visible at rest. */
  snapPoints?: number[];
  /** Default snap point index value. Defaults to first (0.6). */
  defaultSnapPoint?: number;
}

function useKeyboardVisible() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const threshold = 150;
    const check = () => setVisible(window.innerHeight - vv.height > threshold);
    vv.addEventListener("resize", check);
    vv.addEventListener("scroll", check);
    return () => {
      vv.removeEventListener("resize", check);
      vv.removeEventListener("scroll", check);
    };
  }, []);
  return visible;
}

const TreeAnchoredSheet = ({
  open,
  onOpenChange,
  children,
  title,
  subtitle,
  contentClassName,
  snapPoints = [0.6, 0.95],
  defaultSnapPoint,
}: TreeAnchoredSheetProps) => {
  const isMobile = useIsMobile();
  const keyboardOpen = useKeyboardVisible();
  const initialSnap = defaultSnapPoint ?? snapPoints[0];
  const [snap, setSnap] = React.useState<number | string | null>(initialSnap);

  // Reset to default snap when reopened
  React.useEffect(() => {
    if (open) setSnap(initialSnap);
  }, [open, initialSnap]);

  // Force highest snap when keyboard opens
  React.useEffect(() => {
    if (keyboardOpen && snapPoints.length) {
      setSnap(snapPoints[snapPoints.length - 1]);
    }
  }, [keyboardOpen, snapPoints]);

  // Desktop uses a tighter sheet anchored to bottom-right; mobile full-width
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        {/* Faint overlay — tree page remains visible through it */}
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]"
        />
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col border-t border-border/40 bg-background shadow-[0_-12px_40px_-12px_hsl(var(--primary)/0.25)]",
            "rounded-t-[14px] outline-none",
            isMobile
              ? "inset-x-0 bottom-0"
              : "left-1/2 -translate-x-1/2 bottom-0 w-full max-w-xl",
            contentClassName,
          )}
          style={{
            paddingBottom: keyboardOpen ? "8px" : "env(safe-area-inset-bottom, 0px)",
            transition: "padding-bottom 200ms ease",
          }}
        >
          {/* Breathing anchor handle — a hint of root/trunk connection */}
          <div
            className="mx-auto mt-2.5 mb-1 h-1 w-12 shrink-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.55), transparent)",
              boxShadow: "0 0 10px hsl(var(--primary) / 0.18)",
            }}
          />
          <div
            className="overflow-y-auto flex-1 overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {(title || subtitle) && (
              <div className="px-5 pt-2 pb-0 pr-12 relative">
                {title && (
                  <DrawerPrimitive.Title className="text-primary font-serif text-xl tracking-wide">
                    {title}
                  </DrawerPrimitive.Title>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center min-h-11 min-w-11 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="px-5 pt-3 pb-8">{children}</div>
          </div>

        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default TreeAnchoredSheet;

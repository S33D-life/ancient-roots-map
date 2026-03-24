/**
 * ResponsiveDialog — renders a Vaul Drawer on mobile, Radix Dialog on desktop.
 * Provides a single API so consumers don't need to branch.
 */
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Extra classes on the inner content wrapper */
  contentClassName?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Overlay content rendered above the scrollable body (e.g. celebration) */
  overlay?: React.ReactNode;
  /** Vaul snap points for the mobile drawer (e.g. [0.5, 0.92]) */
  snapPoints?: number[];
  /** Default snap point index value */
  defaultSnapPoint?: number;
}

const ResponsiveDialog = ({
  open,
  onOpenChange,
  children,
  contentClassName,
  title,
  subtitle,
  overlay,
}: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={`max-h-[92dvh] overflow-hidden ${contentClassName ?? ""}`}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {overlay}
          {/* Ambient glow bar */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)",
            }}
          />
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {(title || subtitle) && (
              <DrawerHeader className="px-5 pt-4 pb-0">
                {title && (
                  <DrawerTitle className="text-primary font-serif text-xl tracking-wide">
                    {title}
                  </DrawerTitle>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                    {subtitle}
                  </p>
                )}
              </DrawerHeader>
            )}
            <div className="px-5 pb-5">{children}</div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card border-border max-w-md max-h-[90vh] overflow-y-auto p-0 ${contentClassName ?? ""}`}
      >
        {overlay}
        {/* Ambient glow bar */}
        <div
          className="h-1 rounded-t-lg"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)",
          }}
        />
        {/* Ambient radial background */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.04), transparent 60%)",
          }}
        />
        {(title || subtitle) && (
          <div className="px-6 pt-5 pb-0 relative">
            <DialogHeader>
              {title && (
                <DialogTitle className="text-primary font-serif text-xl tracking-wide">
                  {title}
                </DialogTitle>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground/70 font-serif tracking-wider mt-1">
                  {subtitle}
                </p>
              )}
            </DialogHeader>
          </div>
        )}
        <div className="px-6 pb-6 relative">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;

/**
 * HeartwoodChamber — shared "chamber" primitive for inner-library spaces.
 *
 * Purpose: when a section opens, it should feel like entering a contained
 * chamber, not falling into an endless starfield void. Provides consistent
 * border/glow/parchment styling, header hierarchy, optional collapsible body,
 * loading skeleton, empty state, and ambient interior.
 *
 * Atmosphere is preserved via an optional inner starfield / amber glow —
 * never the global one bleeding through transparent gaps.
 */
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface HeartwoodChamberProps {
  /** Title shown in the chamber header. */
  title: string;
  /** Short caption/subtitle under the title. */
  caption?: string;
  /** Optional icon, rendered to the left of the title. */
  icon?: ReactNode;
  /** Optional trailing actions (buttons, links). */
  actions?: ReactNode;
  /** When true, the body collapses behind a chevron trigger. */
  collapsible?: boolean;
  /** Initial open state for collapsible chambers. */
  defaultOpen?: boolean;
  /** Controlled open state (optional). */
  open?: boolean;
  /** Controlled change handler. */
  onOpenChange?: (open: boolean) => void;
  /** When true, paint a subtle starfield/amber glow inside the chamber. */
  ambient?: boolean;
  /** When true, render the loading skeleton instead of children. */
  loading?: boolean;
  /** Optional empty-state node — shown when not loading and no children resolve. */
  empty?: ReactNode;
  /** Tone variant (defaults to "warm"). */
  tone?: "warm" | "cool" | "muted";
  /** Extra classes applied to the outer chamber. */
  className?: string;
  /** Extra classes applied to the body wrapper. */
  bodyClassName?: string;
  /** Body content. */
  children?: ReactNode;
}

const TONE_BG: Record<NonNullable<HeartwoodChamberProps["tone"]>, string> = {
  warm:
    "bg-gradient-to-br from-amber-100/35 via-card/55 to-emerald-100/25 dark:from-amber-950/15 dark:to-emerald-950/10",
  cool:
    "bg-gradient-to-br from-emerald-100/30 via-card/55 to-sky-100/20 dark:from-emerald-950/15 dark:to-sky-950/10",
  muted: "bg-card/55",
};

const TONE_BORDER: Record<NonNullable<HeartwoodChamberProps["tone"]>, string> = {
  warm: "border-amber-900/25",
  cool: "border-emerald-900/25",
  muted: "border-border/40",
};

export function HeartwoodChamber({
  title,
  caption,
  icon,
  actions,
  collapsible = false,
  defaultOpen = true,
  open,
  onOpenChange,
  ambient = false,
  loading = false,
  empty,
  tone = "warm",
  className,
  bodyClassName,
  children,
}: HeartwoodChamberProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const hasChildren =
    !!children && (Array.isArray(children) ? children.length > 0 : true);

  const Body = (
    <div
      className={[
        "relative px-3 sm:px-4 py-4 sm:py-5 space-y-4",
        bodyClassName ?? "",
      ].join(" ")}
    >
      {ambient && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10] rounded-b-2xl"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, hsl(var(--primary)/0.45), transparent 60%), radial-gradient(ellipse at bottom, hsl(38 80% 55% / 0.35), transparent 65%)",
          }}
          aria-hidden
        />
      )}
      <div className="relative">
        {loading ? (
          <ChamberSkeleton />
        ) : hasChildren ? (
          children
        ) : empty ? (
          empty
        ) : null}
      </div>
    </div>
  );

  const Header = (
    <div className="flex items-start gap-3 px-3 sm:px-4 pt-4 sm:pt-5">
      {icon && (
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-base sm:text-lg text-foreground leading-tight">
          {title}
        </h3>
        {caption && (
          <p className="text-[11px] sm:text-xs font-serif italic text-muted-foreground/80 mt-0.5 leading-relaxed">
            {caption}
          </p>
        )}
      </div>
      {collapsible ? (
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/70 shrink-0 mt-1 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      ) : actions ? (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );

  const shellClass = [
    "rounded-2xl border backdrop-blur-sm shadow-inner",
    TONE_BORDER[tone],
    TONE_BG[tone],
    className ?? "",
  ].join(" ");

  if (collapsible) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setOpen}
        className={shellClass}
      >
        <CollapsibleTrigger
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
          // Larger tap target on mobile (≥44px header height via padding above).
        >
          {Header}
          {!isOpen && actions && (
            <div className="flex items-center gap-2 px-3 sm:px-4 pb-3 pt-2 flex-wrap">
              {actions}
            </div>
          )}
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {isOpen && (
            <CollapsibleContent forceMount asChild>
              <motion.div
                key="chamber-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                {Body}
                {actions && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 pb-4 flex-wrap">
                    {actions}
                  </div>
                )}
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    );
  }

  return (
    <section className={shellClass} aria-label={title}>
      {Header}
      {Body}
    </section>
  );
}

/** Skeleton used by chambers in loading state and as a Suspense fallback. */
export function ChamberSkeleton() {
  return (
    <div className="space-y-3 py-2" role="status" aria-label="Loading chamber">
      <div className="h-3 rounded bg-muted/50 w-2/3 animate-pulse" />
      <div className="h-3 rounded bg-muted/40 w-5/6 animate-pulse" />
      <div className="h-3 rounded bg-muted/30 w-1/2 animate-pulse" />
      <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground/70 font-serif italic">
        <Loader2 className="w-3 h-3 animate-spin" /> the chamber is opening…
      </div>
    </div>
  );
}

export default HeartwoodChamber;

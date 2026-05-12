/**
 * PathwayGateway — a "cave entrance" card that opens to reveal its quests.
 *
 * Each gateway has its own glow color and sigil. Collapsed by default to
 * preserve the cave's mystery; the user enters a path by tapping it.
 */
import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface PathwayGatewayProps {
  title: string;
  subtitle: string;
  /** Lucide icon node, sized 20-24px. */
  icon: ReactNode;
  /** HSL string (e.g. "hsl(38 80% 55%)") that drives the gateway glow. */
  glow: string;
  /** Optional brief teaser visible while collapsed. */
  teaser?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function PathwayGateway({
  title,
  subtitle,
  icon,
  glow,
  teaser,
  defaultOpen = false,
  children,
}: PathwayGatewayProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reactId = useId();
  const headerId = `gateway-h-${reactId}`;
  const bodyId = `gateway-b-${reactId}`;

  return (
    <section
      className="relative rounded-2xl border border-amber-900/25 overflow-hidden bg-gradient-to-br from-card/70 via-card/55 to-card/40 backdrop-blur-sm"
      style={{ boxShadow: `inset 0 0 60px -30px ${glow}` }}
    >
      {/* Sigil glow */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: glow }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative w-full text-left p-4 sm:p-5 flex items-start gap-3 min-h-[88px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 70%)`,
            borderColor: glow,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base sm:text-lg text-foreground leading-tight">
            {title}
          </h3>
          <p className="font-serif text-[12px] italic text-muted-foreground/85 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
          {teaser && !open && (
            <p className="font-serif text-[11px] text-muted-foreground/70 mt-1.5 leading-relaxed">
              {teaser}
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/70 shrink-0 mt-2 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {/* CSS-grid expand for buttery, low-cost mobile animation. */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden [contain:layout_paint]">
          <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

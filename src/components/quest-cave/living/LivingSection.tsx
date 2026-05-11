/**
 * LivingSection — expandable parchment-styled wrapper used by every
 * Living Paths section in the Quest Cave.
 */
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Optional small element rendered on the right of the header. */
  trailing?: ReactNode;
  children: ReactNode;
  toneClass?: string;
}

export default function LivingSection({
  title,
  subtitle,
  defaultOpen = true,
  trailing,
  children,
  toneClass = "from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "rounded-2xl border border-amber-900/20 bg-gradient-to-br backdrop-blur-sm overflow-hidden",
        toneClass,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-serif text-base text-foreground">{title}</h3>
          {subtitle && (
            <p className="font-serif text-[11px] italic text-muted-foreground/80 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {trailing}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </section>
  );
}

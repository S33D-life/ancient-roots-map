/**
 * BorrowedStaffCard — compact companion strip showing the user's temporary staff
 * identity assigned from the 144-pool. Anonymous users see a gentle
 * sign-in prompt; on assignment failure a soft fallback with retry.
 *
 * Emotional intent: accompaniment, not ownership. Quiet and warm.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBorrowedStaff } from "@/hooks/use-borrowed-staff";
import type { CircleType } from "@/data/borrowedStaffPool";

interface Props {
  /** Optional CTA route. Defaults to the existing Staff Room. */
  staffRoomHref?: string;
  className?: string;
}

const STRIP_BASE =
  "relative overflow-hidden rounded-xl border bg-gradient-to-br from-card/60 to-card/30 p-3.5 backdrop-blur-sm";

export default function BorrowedStaffCard({
  staffRoomHref = "/library/staff-room",
  className,
}: Props) {
  const { staff, isLoading, isAnonymous, error, retry } = useBorrowedStaff();

  if (isAnonymous) {
    return (
      <aside
        className={[STRIP_BASE, "border-border/20", className ?? ""].join(" ")}
        aria-label="Walking With — sign in"
      >
        <Eyebrow />
        <p className="font-serif text-sm text-foreground/85 mt-0.5">
          A companion is waiting to walk with you.
        </p>
        <Button asChild size="sm" variant="ghost" className="mt-2 h-7 text-xs px-2.5">
          <Link to="/auth">Sign in</Link>
        </Button>
      </aside>
    );
  }

  if (error && !staff) {
    return (
      <aside
        className={[STRIP_BASE, "border-border/20", className ?? ""].join(" ")}
        aria-label="Companion unavailable"
        role="status"
      >
        <Eyebrow />
        <p className="font-serif text-sm text-foreground/85 mt-0.5">
          The path is quiet for a moment.
        </p>
        <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs px-2.5" onClick={() => void retry()}>
          Try again
        </Button>
      </aside>
    );
  }

  if (isLoading || !staff) {
    return (
      <aside
        className={[STRIP_BASE, "border-border/20", className ?? ""].join(" ")}
        aria-busy="true"
        aria-label="Companion loading"
      >
        <Eyebrow />
        <p className="font-serif text-xs italic text-muted-foreground/60 mt-1">
          Choosing a companion for this part of your path…
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={[STRIP_BASE, "border-primary/15", className ?? ""].join(" ")}
      aria-label={`Walking With ${staff.staff_number}, ${staff.circle_type} Circle, ${staff.archetype_species}`}
    >
      {/* Soft moss glow — much smaller than before */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, hsl(38 80% 60% / 0.2), transparent 70%)",
          filter: "blur(16px)",
        }}
      />

      <div className="relative">
        <div className="flex items-start gap-2.5">
          <CircleSigil type={staff.circle_type} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Eyebrow />
              <span className="text-[9px] font-serif italic text-muted-foreground/50">
                Borrowed companion
              </span>
            </div>
            <h3 className="font-serif text-base text-foreground mt-0.5 leading-tight">
              {staff.archetype_species} · {staff.circle_type} Circle
            </h3>
            <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 mt-0.5">
              Staff {staff.staff_number} · Circle {staff.circle_number}
            </p>
          </div>
        </div>

        <p className="font-serif text-xs italic text-foreground/80 mt-2 leading-relaxed">
          “{staff.blessing}”
        </p>

        <div className="flex items-center justify-between mt-2">
          <p className="font-serif text-[10px] text-muted-foreground/50 leading-snug max-w-[70%]">
            This companion walks beside you while your deeper path unfolds.
          </p>
          <Button asChild variant="ghost" size="sm" className="h-6 text-[11px] px-2 -mr-1.5">
            <Link to={staffRoomHref}>Staff Room</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function Eyebrow() {
  return (
    <p className="font-serif text-[9px] uppercase tracking-[0.25em] text-muted-foreground/50">
      Walking With
    </p>
  );
}

/** Tiny SVG sigil per circle type — yew sprig, oak leaf, mixed bloom. */
function CircleSigil({ type }: { type: CircleType }) {
  const ink = "hsl(var(--foreground) / 0.65)";
  const gold = "hsl(38 90% 58%)";
  const leaf = "hsl(95 40% 45%)";
  const leafSoft = "hsl(95 40% 65%)";
  const yewDark = "hsl(150 30% 30%)";
  return (
    <div
      aria-hidden
      className="shrink-0 grid place-items-center rounded-full border border-primary/20 bg-card/50"
      style={{ width: 34, height: 34 }}
    >
      <svg viewBox="0 0 32 32" width="22" height="22">
        {type === "Yew" && (
          <g>
            <path d="M16 5 L 16 27" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 8 + i * 4;
              return (
                <g key={i}>
                  <path
                    d={`M16 ${y} L 11 ${y + 2}`}
                    stroke={yewDark}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M16 ${y} L 21 ${y + 2}`}
                    stroke={yewDark}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
            <circle cx="16" cy="27" r="1.5" fill={gold} />
          </g>
        )}
        {type === "Oak" && (
          <g>
            <path
              d="M16 5 C 22 7, 25 13, 23 19 C 20 24, 12 24, 9 19 C 7 13, 10 7, 16 5 Z"
              fill={leafSoft}
              stroke={leaf}
              strokeWidth="1"
            />
            <path d="M16 6 C 16 14, 16 22, 16 25" stroke={ink} strokeWidth="0.8" fill="none" />
            <path d="M11 11 C 13 13, 13 16, 11 18" stroke={ink} strokeWidth="0.6" fill="none" opacity="0.6" />
            <path d="M21 11 C 19 13, 19 16, 21 18" stroke={ink} strokeWidth="0.6" fill="none" opacity="0.6" />
          </g>
        )}
        {type === "Mixed" && (
          <g>
            <circle cx="12" cy="13" r="4" fill={leafSoft} stroke={leaf} strokeWidth="0.8" />
            <circle cx="20" cy="14" r="3.5" fill="hsl(40 70% 80%)" stroke={gold} strokeWidth="0.8" />
            <circle cx="16" cy="20" r="4.5" fill="hsl(0 50% 78%)" stroke="hsl(0 50% 55%)" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="1.4" fill={gold} />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * BorrowedStaffCard — small warm card showing the user's temporary staff
 * identity assigned from the 144-pool. Anonymous users see a gentle
 * sign-in prompt; on assignment failure a soft fallback with retry.
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

const CARD_BASE =
  "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card/70 to-card/40 p-5 backdrop-blur-sm";

export default function BorrowedStaffCard({
  staffRoomHref = "/library/staff-room",
  className,
}: Props) {
  const { staff, isLoading, isAnonymous, error, retry } = useBorrowedStaff();

  if (isAnonymous) {
    return (
      <aside
        className={[CARD_BASE, "border-primary/20", className ?? ""].join(" ")}
        aria-label="Borrowed Staff — sign in"
      >
        <Eyebrow />
        <p className="font-serif text-base text-foreground mt-1">
          A staff is waiting to walk with you.
        </p>
        <p className="font-serif text-xs italic text-muted-foreground/80 mt-1">
          Sign in to receive your temporary guide for this part of the path.
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/auth">Sign in</Link>
        </Button>
      </aside>
    );
  }

  if (error && !staff) {
    return (
      <aside
        className={[CARD_BASE, "border-border/40", className ?? ""].join(" ")}
        aria-label="Borrowed Staff unavailable"
        role="status"
      >
        <Eyebrow />
        <p className="font-serif text-base text-foreground mt-1">
          The Staff Room is quiet for a moment.
        </p>
        <p className="font-serif text-xs italic text-muted-foreground/80 mt-1">
          Try again shortly — your borrowed staff will find you.
        </p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => void retry()}>
          Try again
        </Button>
      </aside>
    );
  }

  if (isLoading || !staff) {
    return (
      <aside
        className={[CARD_BASE, "border-border/40", className ?? ""].join(" ")}
        aria-busy="true"
        aria-label="Borrowed Staff loading"
      >
        <Eyebrow />
        <p className="font-serif text-sm italic text-muted-foreground/70 mt-2">
          Choosing a staff for this part of your path…
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={[CARD_BASE, "border-primary/30", className ?? ""].join(" ")}
      aria-label={`Borrowed Staff ${staff.staff_number}, ${staff.circle_type} Circle, ${staff.archetype_species}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, hsl(38 90% 70% / 0.35), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <CircleSigil type={staff.circle_type} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Eyebrow />
              <span className="text-[9px] uppercase tracking-[0.25em] font-serif px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                Borrowed
              </span>
            </div>
            <h3 className="font-serif text-xl text-foreground mt-1 leading-tight">
              Staff {staff.staff_number} · {staff.circle_type} Circle
            </h3>
            <p className="font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground/70 mt-1">
              Circle {staff.circle_number} · {staff.archetype_species}
            </p>
          </div>
        </div>

        <p className="font-serif text-sm italic text-foreground/90 mt-3 leading-relaxed">
          “Your Borrowed Staff has found you for this part of the path.”
        </p>
        <p className="font-serif text-sm italic text-muted-foreground/85 mt-1 leading-relaxed">
          “{staff.blessing}”
        </p>
        <p className="font-serif text-[11px] text-muted-foreground/70 mt-3">
          This staff walks with you until your permanent staff is earned, gifted,
          or crafted.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to={staffRoomHref}>Enter Staff Room</Link>
        </Button>
      </div>
    </aside>
  );
}

function Eyebrow() {
  return (
    <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
      Borrowed Staff
    </p>
  );
}

/** Tiny SVG sigil per circle type — yew sprig, oak leaf, mixed bloom. */
function CircleSigil({ type }: { type: CircleType }) {
  const ink = "hsl(var(--foreground) / 0.78)";
  const gold = "hsl(38 90% 62%)";
  const leaf = "hsl(95 45% 48%)";
  const leafSoft = "hsl(95 45% 70%)";
  const yewDark = "hsl(150 30% 32%)";
  return (
    <div
      aria-hidden
      className="shrink-0 grid place-items-center rounded-full border border-primary/30 bg-card/70"
      style={{ width: 44, height: 44 }}
    >
      <svg viewBox="0 0 32 32" width="30" height="30">
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

/**
 * BorrowedStaffCard — small warm card showing the user's temporary staff
 * identity assigned from the 144-pool. Anonymous users see a gentle
 * sign-in prompt instead.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBorrowedStaff } from "@/hooks/use-borrowed-staff";

interface Props {
  /** Optional CTA route. Defaults to the existing Staff Room. */
  staffRoomHref?: string;
  className?: string;
}

export default function BorrowedStaffCard({
  staffRoomHref = "/library/staff-room",
  className,
}: Props) {
  const { staff, isLoading, isAnonymous } = useBorrowedStaff();

  if (isAnonymous) {
    return (
      <aside
        className={[
          "rounded-2xl border border-primary/20 bg-card/50 p-5 backdrop-blur-sm",
          className ?? "",
        ].join(" ")}
        aria-label="Borrowed Staff"
      >
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Borrowed Staff
        </p>
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

  if (isLoading || !staff) {
    return (
      <aside
        className={[
          "rounded-2xl border border-border/40 bg-card/40 p-5",
          className ?? "",
        ].join(" ")}
        aria-busy="true"
        aria-label="Borrowed Staff loading"
      >
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Borrowed Staff
        </p>
        <p className="font-serif text-sm italic text-muted-foreground/70 mt-2">
          Choosing a staff for this part of your path…
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={[
        "relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card/70 to-card/40 p-5 backdrop-blur-sm",
        className ?? "",
      ].join(" ")}
      aria-label={`Borrowed Staff ${staff.staff_number}, ${staff.circle_type} Circle`}
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
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Borrowed Staff
        </p>
        <h3 className="font-serif text-xl text-foreground mt-1 leading-tight">
          Staff {staff.staff_number} · {staff.circle_type} Circle
        </h3>
        <p className="font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground/70 mt-1">
          Circle {staff.circle_number} · {staff.archetype_species}
        </p>
        <p className="font-serif text-sm italic text-foreground/90 mt-3 leading-relaxed">
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

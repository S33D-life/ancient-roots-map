/**
 * IdentityLineageCard — Unified Wanderer + Staff identity surface.
 *
 * Two threads, one path:
 *   1. Wanderer Lineage — the person walking
 *   2. Staff Lineage    — the staff carrying memory
 *
 * Used in both the Hearth and the Heartwood Vault so that staff identity
 * stays coherent across the app. Speaks gently. Avoids implying that a
 * Borrowed Staff is owned.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Footprints, Wand2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  userId: string | null | undefined;
  className?: string;
}

interface LineageState {
  wandererName: string | null;
  borrowedStaffCode: string | null;
  borrowedStaffSpecies: string | null;
  permanentStaffId: string | null;
  permanentStaffSpecies: string | null;
  ceremonies: number;
  treesMappedWithStaff: number;
}

export default function IdentityLineageCard({ userId, className }: Props) {
  const [state, setState] = useState<LineageState | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [profileRes, ceremoniesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, active_staff_id")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("ceremony_logs")
          .select("id, ceremony_type, staff_code, staff_species")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const ceremonies = (ceremoniesRes.data ?? []) as any[];
      const binding = ceremonies.find((c) => c.ceremony_type === "binding");
      const activeStaffId =
        profileRes.data?.active_staff_id ||
        (typeof window !== "undefined"
          ? localStorage.getItem("linked_staff_code")
          : null);

      // Treat a "binding" ceremony as evidence of a Permanent Staff.
      // Otherwise the active staff is the Borrowed guide.
      let permanentStaffId: string | null = binding?.staff_code ?? null;
      let permanentStaffSpecies: string | null = binding?.staff_species ?? null;
      let borrowedStaffCode: string | null = null;
      let borrowedStaffSpecies: string | null = null;

      if (activeStaffId) {
        const { data: staffRow } = await supabase
          .from("staffs")
          .select("species")
          .eq("id", activeStaffId)
          .maybeSingle();
        const species = (staffRow as any)?.species ?? null;

        if (permanentStaffId && permanentStaffId === activeStaffId) {
          permanentStaffSpecies = permanentStaffSpecies || species;
        } else if (permanentStaffId) {
          // active staff is something else — treat it as the borrowed companion
          borrowedStaffCode = activeStaffId;
          borrowedStaffSpecies = species;
        } else {
          borrowedStaffCode = activeStaffId;
          borrowedStaffSpecies = species;
        }
      }

      // Count trees mapped by the wanderer (acts as a soft proxy for
      // "trees mapped with this staff" until staff_id is wired into trees).
      const { count: treeCount } = await supabase
        .from("trees")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId);

      if (cancelled) return;
      setState({
        wandererName: profileRes.data?.full_name ?? null,
        borrowedStaffCode,
        borrowedStaffSpecies,
        permanentStaffId,
        permanentStaffSpecies,
        ceremonies: ceremonies.length,
        treesMappedWithStaff: treeCount ?? 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || !state) return null;

  const hasPermanent = !!state.permanentStaffId;
  const hasBorrowed = !!state.borrowedStaffCode;

  return (
    <section
      className={[
        "rounded-2xl border border-amber-900/25 bg-gradient-to-br from-amber-100/30 via-card/60 to-emerald-100/20",
        "dark:from-amber-950/15 dark:to-emerald-950/10 backdrop-blur-sm",
        "p-5 sm:p-6 space-y-4",
        className ?? "",
      ].join(" ")}
      aria-label="Identity & lineage"
    >
      <header className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80">
            Security & Identity
          </p>
          <h2 className="font-serif text-lg sm:text-xl text-foreground leading-tight">
            Two threads, one path
          </h2>
          <p className="text-[11px] sm:text-xs font-serif italic text-muted-foreground/80 mt-1 leading-relaxed">
            Your identity is held in two threads: the wanderer who walks, and
            the staff that carries memory.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Wanderer Lineage */}
        <Link
          to="/library/star-trail"
          className="group rounded-xl border border-border/40 bg-card/50 p-3.5 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Footprints className="w-4 h-4 text-primary/80" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-serif text-muted-foreground/80 uppercase tracking-wider">
                Wanderer Lineage
              </p>
              <p className="font-serif text-sm text-foreground truncate">
                {state.wandererName || "Wanderer"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 italic truncate">
                Visits, offerings, whispers, groves & quests
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Staff Lineage */}
        <Link
          to={
            hasPermanent && state.permanentStaffId
              ? `/staff/${state.permanentStaffId}`
              : hasBorrowed && state.borrowedStaffCode
                ? `/staff/${state.borrowedStaffCode}`
                : "/library/staff-room"
          }
          className="group rounded-xl border border-border/40 bg-card/50 p-3.5 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                background: hasPermanent
                  ? "hsl(280 50% 30% / 0.18)"
                  : "hsl(38 80% 50% / 0.12)",
                borderColor: hasPermanent
                  ? "hsl(280 60% 55% / 0.35)"
                  : "hsl(38 80% 55% / 0.30)",
              }}
            >
              <Wand2
                className="w-4 h-4"
                style={{
                  color: hasPermanent
                    ? "hsl(280 60% 65%)"
                    : "hsl(38 85% 55%)",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-serif text-muted-foreground/80 uppercase tracking-wider">
                Staff Lineage
              </p>
              <p className="font-serif text-sm text-foreground truncate">
                {hasPermanent
                  ? state.permanentStaffSpecies || "Permanent Staff"
                  : hasBorrowed
                    ? `${state.borrowedStaffSpecies || "Borrowed Staff"} · first guide`
                    : "No staff yet"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 italic truncate">
                {hasPermanent && hasBorrowed
                  ? "Bound to your path · first guide remembered"
                  : hasPermanent
                    ? "Bound to your path"
                    : hasBorrowed
                      ? "A temporary guide, walking with you for now"
                      : "A first guide will be offered in the Staff Room"}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Lineage thread copy — adapts to staff state */}
      <p className="text-[11px] sm:text-xs font-serif italic text-muted-foreground/85 leading-relaxed text-center px-1">
        {hasPermanent && hasBorrowed
          ? "Your Permanent Staff is bound to your path. The Borrowed Staff is remembered as a first guide."
          : hasPermanent
            ? "Your Permanent Staff is now bound to your path."
            : hasBorrowed
              ? "Your Borrowed Staff walks with you until your Permanent Staff is earned, gifted, or crafted."
              : "A staff is waiting to walk with you. Visit the Staff Room to begin."}
      </p>

      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
        <Link
          to="/library/star-trail"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-[11px] font-serif text-foreground/90 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-primary/70" />
          Open Star Trail
        </Link>
        <Link
          to="/library/staff-room"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card/40 hover:border-primary/30 text-[11px] font-serif text-muted-foreground hover:text-foreground transition-colors"
        >
          <Wand2 className="w-3 h-3" />
          Staff Room
        </Link>
      </div>
    </section>
  );
}

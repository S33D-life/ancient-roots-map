/**
 * JourneyStatusBar — A compact, reusable bar showing the wanderer's
 * current identity, Hearts balance, and Staff status.
 * Renders across Hearth, Library, Staff Room, and Map.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Wand2, TreeDeciduous, User } from "lucide-react";

interface JourneyState {
  name: string | null;
  hearts: number;
  trees: number;
  staffCode: string | null;
  staffSpecies: string | null;
}

export default function JourneyStatusBar({ className }: { className?: string }) {
  const [state, setState] = useState<JourneyState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const uid = session.user.id;

      const [profileRes, heartsRes, treesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, active_staff_id").eq("id", uid).maybeSingle(),
        supabase.from("heart_transactions").select("amount").eq("user_id", uid),
        supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", uid),
      ]);

      const heartTotal = (heartsRes.data || []).reduce((s: number, h: any) => s + (h.amount || 0), 0);
      const staffId = profileRes.data?.active_staff_id || localStorage.getItem("linked_staff_code");

      let staffSpecies: string | null = null;
      if (staffId) {
        const { data: staffData } = await supabase.from("staffs").select("species").eq("id", staffId).maybeSingle();
        staffSpecies = staffData?.species || null;
      }

      if (!cancelled) {
        setState({
          name: profileRes.data?.full_name || null,
          hearts: heartTotal,
          trees: treesRes.count || 0,
          staffCode: staffId || null,
          staffSpecies,
        });
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!state) return null;

  return (
    <div className={`flex items-center gap-3 flex-wrap text-xs font-serif ${className || ""}`}>
      {/* Identity */}
      <Link to="/dashboard" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/60 border border-border/30 hover:border-primary/40 transition-colors">
        <User className="w-3 h-3 text-muted-foreground" />
        <span className="text-foreground/80 truncate max-w-[100px]">{state.name || "Wanderer"}</span>
      </Link>

      {/* Hearts */}
      <Link to="/dashboard?tab=hearts" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/60 border border-border/30 hover:border-primary/40 transition-colors">
        <Heart className="w-3 h-3 text-[hsl(0_70%_55%)]" />
        <span className="text-foreground/80">{state.hearts}</span>
      </Link>

      {/* Trees */}
      <Link to="/dashboard?tab=pod" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/60 border border-border/30 hover:border-primary/40 transition-colors">
        <TreeDeciduous className="w-3 h-3 text-[hsl(120_45%_45%)]" />
        <span className="text-foreground/80">{state.trees}</span>
      </Link>

      {/* Staff */}
      <Link
        to={state.staffCode ? `/staff/${state.staffCode}` : "/library/staff-room"}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors"
        style={{
          background: state.staffCode ? "hsl(280 30% 15% / 0.6)" : "hsl(var(--card) / 0.6)",
          borderColor: state.staffCode ? "hsl(280 60% 55% / 0.3)" : "hsl(var(--border) / 0.3)",
        }}
      >
        <Wand2 className="w-3 h-3" style={{ color: state.staffCode ? "hsl(280 60% 55%)" : "hsl(var(--muted-foreground))" }} />
        <span className="text-foreground/80 truncate max-w-[80px]">
          {state.staffSpecies || (state.staffCode ? state.staffCode : "No Staff")}
        </span>
      </Link>
    </div>
  );
}

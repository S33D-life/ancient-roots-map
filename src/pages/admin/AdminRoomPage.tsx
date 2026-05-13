/**
 * AdminRoomPage — unified Admin / Curator hub inside the Taproot architecture.
 *
 * Entry point for keepers and curators. Surfaces the Evolution Dashboard,
 * users/signups, invites, moderation, economy and diagnostics as a calm
 * Heartwood-styled inner ring (not a corporate dashboard).
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Shield, Activity, Users, Mail, TreePine,
  Heart, Wrench, Sparkles, ChevronRight, Bug, Moon } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useHasRole } from "@/hooks/use-role";
import { useAdminOverview } from "@/hooks/use-admin-analytics";
import { track } from "@/lib/telemetry";

interface SectionCard {
  title: string;
  blurb: string;
  to: string;
  icon: React.ReactNode;
  featured?: boolean;
  badge?: string;
}

export default function AdminRoomPage() {
  const { hasRole: isCurator, loading: lc } = useHasRole("curator");
  const { hasRole: isKeeper, loading: lk } = useHasRole("keeper");
  const allowed = isCurator || isKeeper;
  const overview = useAdminOverview();

  useEffect(() => {
    if (allowed) track("admin_room_opened");
  }, [allowed]);

  if (lc || lk) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Inner ring only</h1>
          <p className="text-muted-foreground font-serif">
            The Admin Room is reserved for keepers and Heartwood curators.
          </p>
          <Link to="/library/tap-root" className="inline-block mt-6 text-sm text-primary underline-offset-4 hover:underline">
            Return to Taproot
          </Link>
        </div>
      </div>
    );
  }

  const stats = overview.data ?? {};

  const sections: SectionCard[] = [
    {
      title: "Users & Signups",
      blurb: "Wanderers who have joined the living atlas.",
      to: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "Invites",
      blurb: "Lineage allowance, sent and accepted invitations.",
      to: "/admin/invite-status",
      icon: <Mail className="w-5 h-5" />,
    },
    {
      title: "Trees & Offerings Review",
      blurb: "Refinements, edit proposals and species curation.",
      to: "/curator",
      icon: <TreePine className="w-5 h-5" />,
    },
    {
      title: "Heart Ledger & Economy",
      blurb: "Heart flows, anti-inflation guard, holders.",
      to: "/library/scrolls",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      title: "Diagnostics",
      blurb: "Bug Garden, sparks and field reports.",
      to: "/bug-garden",
      icon: <Bug className="w-5 h-5" />,
    },
    {
      title: "System Health",
      blurb: "Ecosystem map, sync engine, edge functions.",
      to: "/ecosystem",
      icon: <Wrench className="w-5 h-5" />,
    },
  ];

  const previewMetrics = [
    { label: "Wanderers", value: stats.total_users },
    { label: "Trees", value: stats.total_trees },
    { label: "Offerings", value: stats.total_offerings },
    { label: "Whispers", value: stats.total_whispers },
    { label: "Hearts", value: stats.total_hearts },
    { label: "Species", value: stats.active_species },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-mono tracking-wider text-amber-700 dark:text-amber-300/80 uppercase">
              Taproot · Admin Room
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-primary tracking-wide">
            Stewardship of the Living System
          </h1>
          <p className="text-sm text-muted-foreground font-serif mt-2 max-w-xl">
            Quiet tools for the people tending the inner rings — evolution,
            invitations, moderation, and the heart-ledger of S33D.
          </p>
        </div>

        {/* Featured: Evolution Dashboard */}
        <Link to="/evolution" onClick={() => track("evolution_dashboard_opened")}>
          <Card className="group border-primary/20 bg-gradient-to-br from-amber-50/40 via-card to-emerald-50/30 dark:from-amber-950/20 dark:to-emerald-950/10 hover:border-primary/40 breathe-card breathe-glow overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-serif text-foreground">Evolution Dashboard</h2>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                      Featured
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-serif">
                    Where should we evolve next? Live signal across growth, features, economy and coverage.
                  </p>

                  {/* Quick metrics */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
                    {previewMetrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-border/30 bg-background/40 p-2 text-center">
                        <div className="text-base font-mono font-semibold text-foreground/90">
                          {overview.isLoading ? "·" : (m.value ?? 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Moonroot Digest — reflective lunar scroll */}
        <Link
          to="/admin/moonroot"
          onClick={() => track("moonroot_digest_opened")}
          className="block mt-4"
        >
          <Card className="group border-primary/15 bg-gradient-to-br from-slate-50/40 via-card to-indigo-50/20 dark:from-slate-950/30 dark:to-indigo-950/10 hover:border-primary/30 breathe-card breathe-glow overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/8 border border-primary/15 shrink-0">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-serif text-foreground">Moonroot Digest</h2>
                  <p className="text-sm text-muted-foreground font-serif italic mt-0.5">
                    Two-week reflections from the wandering path.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Section grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {sections.map((s) => (
            <Link key={s.title} to={s.to} className="group">
              <Card className="bg-card/40 border-border/30 hover:border-primary/30 hover:bg-card/70 breathe-card breathe-glow h-full">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/8 border border-primary/15 text-primary shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground font-serif mt-0.5 leading-relaxed">
                      {s.blurb}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer return */}
        <div className="mt-10 text-center">
          <Link
            to="/library/tap-root"
            className="text-xs font-mono tracking-wider uppercase text-muted-foreground/60 hover:text-primary transition-colors"
          >
            ← Return to Taproot
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * ArtizenReadinessPage — lightweight curator-side checklist for the
 * Artizen campaign window. Lives inside the Admin Room. Not public.
 *
 * Intentionally read-only and static: this is a living briefing card,
 * not a CRUD system. Edit copy directly to evolve the campaign.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Shield, Sparkles, Calendar, Film, Image as ImageIcon,
  Gift, FileText, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useHasRole } from "@/hooks/use-role";
import { track } from "@/lib/telemetry";

interface ChecklistItem {
  label: string;
  done: boolean;
  note?: string;
}

interface Section {
  title: string;
  icon: React.ReactNode;
  blurb: string;
  items: ChecklistItem[];
}

const ARTIZEN_DEADLINE = new Date("2026-06-21T00:00:00Z"); // ~33 days from May 19 2026

const daysLeft = () => {
  const diff = ARTIZEN_DEADLINE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const SECTIONS: Section[] = [
  {
    title: "What S33D is",
    icon: <Sparkles className="w-4 h-4" />,
    blurb: "The one-paragraph telling we'll lean on across the campaign.",
    items: [
      { label: "Living library of ancient trees", done: true },
      { label: "Private memory funds public commons", done: true },
      { label: "Encounter economy, not speculation", done: true },
      { label: "Memorial archives that deepen across generations", done: true },
    ],
  },
  {
    title: "What exists now",
    icon: <CheckCircle2 className="w-4 h-4" />,
    blurb: "Live, demonstrable surfaces a supporter can walk through today.",
    items: [
      { label: "Ancient Friends atlas (global map)", done: true },
      { label: "Tree detail pages with Offerings, Blooms, Whispers", done: true },
      { label: "Seeds & Hearts action panel", done: true },
      { label: "Hearth / Dashboard arrival flow", done: true },
      { label: "Taproot + Admin Room (Moonroot Digest)", done: true },
      { label: "Council of Life rhythm", done: true },
      { label: "Patrons Portal (deck, one-pager, structure)", done: true },
    ],
  },
  {
    title: "What funding unlocks",
    icon: <Gift className="w-4 h-4" />,
    blurb: "Draft framing — refine with Ed before publishing.",
    items: [
      { label: "Heartwood Library beta (private archives)", done: false },
      { label: "First founding Staff Circles", done: false },
      { label: "Memorial Tree pathway prototype", done: false },
      { label: "Field stewardship grants to verifiers", done: false },
    ],
  },
  {
    title: "Key visuals needed",
    icon: <ImageIcon className="w-4 h-4" />,
    blurb: "Stills for Artizen page, deck refresh, and social.",
    items: [
      { label: "Hero portrait of a verified Ancient Friend", done: false },
      { label: "Hand-on-bark encounter photograph", done: false },
      { label: "Staff object photographed against bark", done: false },
      { label: "Map screenshot with verified trees visible", done: false },
      { label: "Tree page screenshot with offerings layer", done: false },
    ],
  },
  {
    title: "Campaign video",
    icon: <Film className="w-4 h-4" />,
    blurb: "60–90s film. Slow, witnessed, no voiceover sales pitch.",
    items: [
      { label: "Script / shot list", done: false },
      { label: "Field shoot (at least one ancient tree)", done: false },
      { label: "App walk-through capture", done: false },
      { label: "Final edit + captions", done: false },
    ],
  },
  {
    title: "Reward / artifact structure",
    icon: <Gift className="w-4 h-4" />,
    blurb: "Still being refined — keep cautious, no firm financial promises.",
    items: [
      { label: "Founding Staff edition outline", done: true, note: "draft in /patronsportal/structure" },
      { label: "Tier ladder (presence → memorial)", done: false },
      { label: "Physical artifact direction", done: false },
      { label: "Digital artifact (NFTree provenance link)", done: false },
    ],
  },
  {
    title: "Supporting documents",
    icon: <FileText className="w-4 h-4" />,
    blurb: "Linked from the Patrons Portal.",
    items: [
      { label: "Deck", done: true, note: "/patronsportal/deck" },
      { label: "One-pager", done: true, note: "/patronsportal/onepager" },
      { label: "Structure overview", done: true, note: "/patronsportal/structure" },
      { label: "Artizen-specific landing copy", done: false },
    ],
  },
];

const ChecklistRow = ({ item }: { item: ChecklistItem }) => (
  <li className="flex items-start gap-2.5 py-1.5">
    {item.done ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
    ) : (
      <Circle className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
    )}
    <div className="min-w-0">
      <span className={`text-sm font-serif ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
        {item.label}
      </span>
      {item.note && (
        <span className="block text-[11px] font-mono text-muted-foreground/70 mt-0.5">
          {item.note}
        </span>
      )}
    </div>
  </li>
);

export default function ArtizenReadinessPage() {
  const { hasRole: isCurator, loading: lc } = useHasRole("curator");
  const { hasRole: isKeeper, loading: lk } = useHasRole("keeper");
  const allowed = isCurator || isKeeper;

  useEffect(() => {
    if (allowed) track("artizen_readiness_opened");
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
          <h1 className="text-2xl font-serif text-foreground mb-2">Curator-only briefing</h1>
          <p className="text-muted-foreground font-serif">
            The Artizen readiness card is held inside the Admin Room.
          </p>
          <Link to="/admin" className="inline-block mt-6 text-sm text-primary underline-offset-4 hover:underline">
            Return to the Admin Room
          </Link>
        </div>
      </div>
    );
  }

  const days = daysLeft();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-mono tracking-wider text-amber-700 dark:text-amber-300/80 uppercase">
              Admin Room · Campaign Briefing
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-primary tracking-wide">
            Artizen Campaign Readiness
          </h1>
          <p className="text-sm text-muted-foreground font-serif mt-2 max-w-2xl italic">
            A quiet checklist for the run-up. What S33D is, what already exists,
            and what we still need to gather before the campaign opens.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-serif text-foreground">
              ~{days} days until the planned window
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <Card key={s.title} className="bg-card/40 border-border/30 breathe-card section-reveal">
              <CardContent className="p-5">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="p-1.5 rounded-md bg-primary/8 border border-primary/15 text-primary shrink-0">
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-serif text-base text-foreground">{s.title}</h2>
                    <p className="text-xs text-muted-foreground font-serif italic mt-0.5">
                      {s.blurb}
                    </p>
                  </div>
                </div>
                <ul className="mt-1">
                  {s.items.map((it) => (
                    <ChecklistRow key={it.label} item={it} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Related links */}
        <Card className="mt-6 bg-card/40 border-border/30">
          <CardContent className="p-5">
            <h3 className="font-serif text-base text-foreground mb-3">Related rooms</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href="/patronsportal/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/40 hover:border-primary/40 text-sm font-serif text-foreground transition-colors"
              >
                Patrons Portal <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                to="/admin/moonroot"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/40 hover:border-primary/40 text-sm font-serif text-foreground transition-colors"
              >
                Moonroot Digest
              </Link>
              <Link
                to="/evolution"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/40 hover:border-primary/40 text-sm font-serif text-foreground transition-colors"
              >
                Evolution Dashboard
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground/70 font-serif italic mt-3">
              Draft — edit <code className="font-mono">src/pages/admin/ArtizenReadinessPage.tsx</code> directly to evolve the briefing.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 text-center">
          <Link
            to="/admin"
            className="text-xs font-mono tracking-wider uppercase text-muted-foreground/60 hover:text-primary transition-colors"
          >
            ← Return to the Admin Room
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * CreatorsPath — Personal Journey Room.
 *
 * The living record of a wanderer's path with life and the Ancient Friends.
 * Aggregates trees mapped, Ancient Friends visited, offerings, whispers,
 * songs, books, Life Groves, ceremonies and quests into one warm scroll.
 *
 * Tree Projects Directory has moved to /tree-projects.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TreeDeciduous, Gift, Wand2, Music, BookOpen, Sparkles,
  MessageCircle, Footprints, Leaf, Mountain, ArrowRight, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/routes";
import JourneyBridge from "@/components/JourneyBridge";
import JourneyStatusBar from "@/components/JourneyStatusBar";
import type { CachedStaff } from "@/hooks/use-wallet";

interface CreatorsPathProps {
  userId?: string;
  activeStaff?: CachedStaff | null;
}

type EventType =
  | "tree" | "visit" | "offering" | "whisper"
  | "song" | "book" | "ceremony" | "grove";

interface PathEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle?: string;
  date: string;
  link?: string;
}

const EVENT_META: Record<EventType, { icon: typeof TreeDeciduous; tone: string; label: string }> = {
  tree:     { icon: TreeDeciduous,  tone: "140 40% 45%", label: "Tree mapped" },
  visit:    { icon: Footprints,     tone: "120 35% 40%", label: "Ancient Friend visited" },
  offering: { icon: Gift,           tone: "28 70% 50%",  label: "Offering left" },
  whisper:  { icon: MessageCircle,  tone: "200 50% 50%", label: "Whisper sent" },
  song:     { icon: Music,          tone: "260 50% 55%", label: "Song offered" },
  book:     { icon: BookOpen,       tone: "32 60% 45%",  label: "Book offered" },
  ceremony: { icon: Wand2,          tone: "280 55% 55%", label: "Staff ceremony" },
  grove:    { icon: Leaf,           tone: "105 45% 40%", label: "Life Grove" },
};

interface JourneyStats {
  trees: number;
  visits: number;
  ancientFriends: number;
  offerings: number;
  whispers: number;
  songs: number;
  books: number;
  ceremonies: number;
  groves: number;
}

const EMPTY_STATS: JourneyStats = {
  trees: 0, visits: 0, ancientFriends: 0, offerings: 0, whispers: 0,
  songs: 0, books: 0, ceremonies: 0, groves: 0,
};

const safe = async (p: PromiseLike<any>): Promise<{ data: any[] }> => {
  try { const r: any = await p; return { data: r?.data ?? [] }; } catch { return { data: [] }; }
};

const CreatorsPath = ({ userId, activeStaff }: CreatorsPathProps) => {
  const [events, setEvents] = useState<PathEvent[]>([]);
  const [stats, setStats] = useState<JourneyStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [recentTree, setRecentTree] = useState<{ id: string; name: string | null; species: string | null } | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const uid = userId;

      const [
        treesRes, offeringsRes, ceremoniesRes, songsRes,
        whispersRes, visitsRes, grovesRes, booksRes,
      ] = await Promise.all([
        safe(supabase.from("trees").select("id, name, species, created_at").eq("created_by", uid).order("created_at", { ascending: false }).limit(50)),
        safe(supabase.from("offerings").select("id, title, type, created_at, tree_id").eq("created_by", uid).order("created_at", { ascending: false }).limit(50)),
        safe(supabase.from("ceremony_logs").select("id, staff_code, staff_name, staff_species, ceremony_type, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(30)),
        safe(supabase.from("saved_songs").select("id, title, artist, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(30)),
        safe(supabase.from("tree_whispers" as any).select("id, message, created_at, tree_anchor_id").eq("sender_user_id", uid).order("created_at", { ascending: false }).limit(30) as any),
        safe(supabase.from("tree_checkins").select("id, tree_id, checked_in_at").eq("user_id", uid).order("checked_in_at", { ascending: false }).limit(50)),
        safe(supabase.from("life_groves").select("id, grove_title, created_at").eq("created_by", uid).order("created_at", { ascending: false }).limit(20)),
        safe(supabase.from("bookshelf_entries" as any).select("id, title, author, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(30) as any),
      ]);

      if (cancelled) return;

      const trees     = (treesRes.data    ?? []) as any[];
      const offerings = (offeringsRes.data ?? []) as any[];
      const ceremonies= (ceremoniesRes.data ?? []) as any[];
      const songs     = (songsRes.data    ?? []) as any[];
      const whispers  = (whispersRes.data ?? []) as any[];
      const visits    = (visitsRes.data   ?? []) as any[];
      const groves    = (grovesRes.data   ?? []) as any[];
      const books     = (booksRes.data    ?? []) as any[];

      const all: PathEvent[] = [];
      trees.forEach(t => all.push({ id: `t-${t.id}`, type: "tree", title: t.name || "Unnamed friend", subtitle: t.species, date: t.created_at, link: `/tree/${t.id}` }));
      offerings.forEach(o => all.push({ id: `o-${o.id}`, type: "offering", title: o.title || "Offering", subtitle: o.type, date: o.created_at, link: o.tree_id ? `/tree/${o.tree_id}` : undefined }));
      ceremonies.forEach((c: any) => {
        const label = c.ceremony_type === "binding" ? "Staff bound" : "Staff awakened";
        all.push({ id: `c-${c.id}`, type: "ceremony", title: `${label}: ${c.staff_name || c.staff_code}`, subtitle: c.staff_species, date: c.created_at, link: c.staff_code ? `/staff/${c.staff_code}` : undefined });
      });
      songs.forEach(s => all.push({ id: `s-${s.id}`, type: "song", title: s.title, subtitle: s.artist, date: s.created_at }));
      whispers.forEach(w => all.push({ id: `w-${w.id}`, type: "whisper", title: (w.message?.slice(0, 64) || "Whisper sent"), date: w.created_at, link: w.tree_anchor_id ? `/tree/${w.tree_anchor_id}` : undefined }));
      visits.forEach(v => all.push({ id: `v-${v.id}`, type: "visit", title: "Beneath an Ancient Friend", date: v.checked_in_at, link: v.tree_id ? `/tree/${v.tree_id}` : undefined }));
      groves.forEach(g => all.push({ id: `g-${g.id}`, type: "grove", title: g.grove_title || "A Life Grove", date: g.created_at, link: `/heartwood/life-groves/${g.id}` }));
      books.forEach((b: any) => all.push({ id: `b-${b.id}`, type: "book", title: b.title || "A book offered", subtitle: b.author, date: b.created_at }));

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const distinctTreeVisits = new Set(visits.map(v => v.tree_id).filter(Boolean));

      setEvents(all);
      setStats({
        trees: trees.length,
        visits: visits.length,
        ancientFriends: distinctTreeVisits.size,
        offerings: offerings.length,
        whispers: whispers.length,
        songs: songs.length,
        books: books.length,
        ceremonies: ceremonies.length,
        groves: groves.length,
      });
      setRecentTree(trees[0] ? { id: trees[0].id, name: trees[0].name, species: trees[0].species } : null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const recentOffering = useMemo(
    () => events.find(e => e.type === "offering" || e.type === "song" || e.type === "book") || null,
    [events],
  );
  const recentGrove = useMemo(() => events.find(e => e.type === "grove") || null, [events]);

  const overviewTiles = [
    { key: "trees",          icon: TreeDeciduous,  label: "Trees mapped",         value: stats.trees },
    { key: "ancientFriends", icon: Footprints,     label: "Ancient Friends met",  value: stats.ancientFriends },
    { key: "offerings",      icon: Gift,           label: "Offerings given",      value: stats.offerings },
    { key: "whispers",       icon: MessageCircle,  label: "Whispers sent",        value: stats.whispers },
    { key: "songs",          icon: Music,          label: "Songs offered",        value: stats.songs },
    { key: "books",          icon: BookOpen,       label: "Books offered",        value: stats.books },
    { key: "groves",         icon: Leaf,           label: "Life Groves tended",   value: stats.groves },
    { key: "ceremonies",     icon: Wand2,          label: "Staff ceremonies",     value: stats.ceremonies },
  ];

  if (!userId) {
    return (
      <div className="space-y-6 pb-28">
        <PathHero />
        <Card className="border-border/30 bg-card/40">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm font-serif text-muted-foreground italic">
              Sign in to see the path your steps are weaving.
            </p>
            <Button asChild size="sm" className="font-serif text-xs">
              <Link to={ROUTES.AUTH}>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <JourneyStatusBar className="justify-center" />

      <PathHero />

      {/* Active staff card */}
      {activeStaff && (
        <Card className="border-amber-900/25 bg-card/70 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <Link to={`/staff/${activeStaff.id}`} className="flex items-center gap-4 p-4 group">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/30 flex-shrink-0">
                <img
                  src={activeStaff.image_url || `/images/staffs/${activeStaff.species_code.toLowerCase()}.jpeg`}
                  alt={activeStaff.species}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Borrowed Staff</p>
                <h3 className="font-serif text-base text-foreground truncate">{activeStaff.species}</h3>
                <p className="text-[11px] text-muted-foreground/80 italic truncate">
                  {activeStaff.is_origin_spiral ? "Origin Spiral" : `Circle ${activeStaff.circle_id}`} · Staff #{activeStaff.staff_number}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/60 shrink-0" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Journey overview */}
      <section>
        <SectionTitle eyebrow="Journey overview" title="What your path holds" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {overviewTiles.map((t) => (
            <div
              key={t.key}
              className="rounded-xl border border-border/30 bg-card/40 px-3 py-3 text-center"
            >
              <t.icon className="w-4 h-4 mx-auto text-primary/70 mb-1.5" />
              <div className="text-lg sm:text-xl font-serif text-foreground">{t.value}</div>
              <div className="text-[9px] sm:text-[10px] font-serif text-muted-foreground/80 uppercase tracking-wider mt-0.5 leading-tight">
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Current path cards */}
      <section>
        <SectionTitle eyebrow="Currently walking" title="Living threads of your path" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentTree && (
            <PathCard
              icon={TreeDeciduous}
              eyebrow="Most recent tree"
              title={recentTree.name || "An unnamed friend"}
              subtitle={recentTree.species ?? undefined}
              to={`/tree/${recentTree.id}`}
            />
          )}
          {recentGrove && (
            <PathCard icon={Leaf} eyebrow="Active Life Grove" title={recentGrove.title} subtitle="Tending continues" to={recentGrove.link} />
          )}
          {recentOffering && (
            <PathCard
              icon={EVENT_META[recentOffering.type].icon}
              eyebrow="Recent offering"
              title={recentOffering.title}
              subtitle={recentOffering.subtitle}
              to={recentOffering.link}
            />
          )}
          <PathCard
            icon={Mountain}
            eyebrow="Quest Room"
            title="Continue your paths"
            subtitle="Species, hives & ancient ways"
            to="/heartwood/quest-room"
          />
          {!activeStaff && (
            <PathCard
              icon={Wand2}
              eyebrow="Staff lineage"
              title="Borrow a staff"
              subtitle="Open the paths"
              to={ROUTES.STAFF_ROOM}
            />
          )}
        </div>
      </section>

      {/* Path timeline */}
      <section>
        <SectionTitle eyebrow="Path timeline" title="Your path is remembered here" />
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary/70" />
          </div>
        ) : events.length === 0 ? (
          <Card className="border-border/30 bg-card/40">
            <CardContent className="p-6 text-center space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-primary/40" />
              <p className="font-serif text-sm text-foreground/80">The path grows as you walk.</p>
              <p className="text-xs text-muted-foreground/70 italic">
                Map a tree, leave an offering, or check in beneath an Ancient Friend to begin.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <Button asChild size="sm" variant="outline" className="font-serif text-xs">
                  <Link to={ROUTES.MAP}>Open the Map</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="font-serif text-xs">
                  <Link to={ROUTES.ADD_TREE}>Map a Tree</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-amber-700/20 to-transparent" />
            <ol className="space-y-2.5">
              {events.slice(0, 40).map((event) => {
                const meta = EVENT_META[event.type];
                const Icon = meta.icon;
                const inner = (
                  <div className="relative flex gap-3 items-start group">
                    <div
                      className="relative z-10 w-9 h-9 rounded-full border flex items-center justify-center shrink-0"
                      style={{
                        borderColor: `hsl(${meta.tone} / 0.45)`,
                        backgroundColor: `hsl(${meta.tone} / 0.12)`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: `hsl(${meta.tone})` }} />
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5 group-hover:border-primary/30 transition-colors">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <p className="font-serif text-sm text-foreground truncate">{event.title}</p>
                        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                          {new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 italic mt-0.5 truncate">
                        {meta.label}{event.subtitle ? ` · ${event.subtitle}` : ""}
                      </p>
                    </div>
                  </div>
                );
                return event.link ? (
                  <li key={event.id}>
                    <Link to={event.link} className="block">{inner}</Link>
                  </li>
                ) : (
                  <li key={event.id}>{inner}</li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* Subtle relocation note */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-3 text-center">
        <p className="text-[11px] font-serif text-muted-foreground/80 italic">
          Looking for research portals?{" "}
          <Link to="/tree-data-commons" className="text-primary/80 underline-offset-2 hover:underline">
            Visit Tree Data Commons
          </Link>
          .
        </p>
      </div>

      <JourneyBridge current="path" hasStaff={!!activeStaff} />
    </div>
  );
};

/* ── small bits ───────────────────────────────────────────────────────── */

function PathHero() {
  return (
    <div className="rounded-2xl border border-amber-900/25 bg-gradient-to-br from-amber-100/40 via-card/60 to-emerald-100/30 dark:from-amber-950/15 dark:to-emerald-950/10 p-5 sm:p-6 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/30 mb-2">
        <Footprints className="w-5 h-5 text-primary" />
      </div>
      <h1 className="font-serif text-2xl sm:text-3xl text-foreground tracking-wide">Creator's Path</h1>
      <p className="text-xs sm:text-sm font-serif text-muted-foreground mt-1">
        Your path is remembered here.
      </p>
      <p className="text-[11px] sm:text-xs font-serif text-muted-foreground/80 italic mt-3 max-w-md mx-auto leading-relaxed">
        Every tree met, offering given, whisper sent, and grove tended becomes part of the journey.
      </p>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3 px-1">
      <h2 className="font-serif text-base sm:text-lg text-foreground">{title}</h2>
      <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {eyebrow}
      </p>
    </div>
  );
}

function PathCard({
  icon: Icon, eyebrow, title, subtitle, to,
}: {
  icon: typeof TreeDeciduous;
  eyebrow: string;
  title: string;
  subtitle?: string;
  to?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border/30 bg-card/50 p-3.5 hover:border-primary/30 transition-colors h-full">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary/80" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-serif text-muted-foreground/80 uppercase tracking-wider">{eyebrow}</p>
          <p className="font-serif text-sm text-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/80 italic truncate">{subtitle}</p>
          )}
        </div>
        {to && <ArrowRight className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-1" />}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

export default CreatorsPath;

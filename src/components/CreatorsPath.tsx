import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Leaf, Users, Footprints, Sprout, Sparkles, MapPin, Wand2, Gift, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import creatorsPathBg from "@/assets/creators-path-bg.jpeg";
import JourneyBridge from "@/components/JourneyBridge";
import JourneyStatusBar from "@/components/JourneyStatusBar";
import type { CachedStaff } from "@/hooks/use-wallet";

interface CreatorsPathProps {
  userId?: string;
  activeStaff?: CachedStaff | null;
}

interface PathEvent {
  id: string;
  type: "tree" | "offering" | "ceremony" | "song";
  title: string;
  subtitle?: string;
  date: string;
  link?: string;
}

const getStepIcon = (type: string) => {
  switch (type) {
    case "tree": return <TreeDeciduous className="w-5 h-5" />;
    case "offering": return <Gift className="w-5 h-5" />;
    case "ceremony": return <Wand2 className="w-5 h-5" />;
    case "song": return <Music className="w-5 h-5" />;
    default: return <MapPin className="w-5 h-5" />;
  }
};

const TYPE_COLORS: Record<string, string> = {
  tree: "120 45% 45%",
  offering: "28 70% 50%",
  ceremony: "280 60% 55%",
  song: "28 70% 50%",
};

const CreatorsPath = ({ userId, activeStaff }: CreatorsPathProps) => {
  const [events, setEvents] = useState<PathEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trees: 0, offerings: 0, ceremonies: 0, songs: 0 });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchPath();
  }, [userId]);

  const fetchPath = async () => {
    setLoading(true);

    const [treesRes, offeringsRes, ceremoniesRes, songsRes] = await Promise.all([
      supabase.from("trees").select("id, name, species, created_at").eq("created_by", userId!).order("created_at", { ascending: false }).limit(50),
      supabase.from("offerings").select("id, title, type, created_at, tree_id").eq("created_by", userId!).order("created_at", { ascending: false }).limit(50),
      supabase.from("ceremony_logs").select("id, staff_code, staff_name, staff_species, ceremony_type, created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(30),
      supabase.from("saved_songs").select("id, title, artist, created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(30),
    ]);

    const all: PathEvent[] = [];

    const trees = treesRes.data || [];
    const offerings = offeringsRes.data || [];
    const ceremonies = ceremoniesRes.data || [];
    const songs = songsRes.data || [];

    trees.forEach((t) =>
      all.push({ id: t.id, type: "tree", title: t.name, subtitle: t.species, date: t.created_at, link: `/tree/${t.id}` })
    );
    offerings.forEach((o) =>
      all.push({ id: o.id, type: "offering", title: o.title, subtitle: o.type, date: o.created_at, link: `/tree/${o.tree_id}` })
    );
    ceremonies.forEach((c: any) => {
      const label = c.ceremony_type === "binding" ? "Staff Bound" : "Staff Awakened";
      all.push({ id: c.id, type: "ceremony", title: `${label}: ${c.staff_name || c.staff_code}`, subtitle: c.staff_species, date: c.created_at, link: `/staff/${c.staff_code}` });
    });
    songs.forEach((s) =>
      all.push({ id: s.id, type: "song", title: s.title, subtitle: s.artist, date: s.created_at })
    );

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(all);
    setStats({ trees: trees.length, offerings: offerings.length, ceremonies: ceremonies.length, songs: songs.length });
    setLoading(false);
  };

  const statsMeta = [
    { key: "trees" as const, icon: TreeDeciduous, label: "Trees Mapped", color: "text-primary" },
    { key: "offerings" as const, icon: Gift, label: "Offerings Given", color: "text-accent" },
    { key: "ceremonies" as const, icon: Wand2, label: "Ceremonies", color: "text-primary" },
    { key: "songs" as const, icon: Music, label: "Songs Saved", color: "text-accent" },
  ];

  return (
    <div className="space-y-10">
      {/* Journey status bar */}
      <JourneyStatusBar className="justify-center" />
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden h-64 md:h-80">
        <img src={creatorsPathBg} alt="Creator's Paradise Path" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-8 text-center px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-mystical mb-2">
            Creator's Paradise Path
          </h2>
          <p className="text-foreground/80 max-w-lg text-sm md:text-base">
            Your staff journey — mapping ancient trees, joining the Council of Life,
            sharing dreams, and letting the wisdom of life flow through us collectively.
          </p>
        </div>
      </div>

      {/* Staff Identity Card */}
      {activeStaff && (
        <Card className="border-mystical bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <Link to={`/staff/${activeStaff.id}`} className="flex items-center gap-5 p-5 group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/40 flex-shrink-0 shadow-lg">
                <img
                  src={activeStaff.image_url || `/images/staffs/${activeStaff.species_code.toLowerCase()}.jpeg`}
                  alt={activeStaff.species}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Active Staff</p>
                <h3 className="font-serif text-xl text-mystical group-hover:text-primary transition-colors">{activeStaff.species}</h3>
                <p className="text-sm text-muted-foreground font-mono">{activeStaff.id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeStaff.is_origin_spiral ? "Origin Spiral" : `Circle ${activeStaff.circle_id}`} · Staff #{activeStaff.staff_number}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsMeta.map((stat) => (
          <Card key={stat.label} className="border-mystical bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background/50">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-mystical">
                {stats[stat.key]}
              </span>
              <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-serif mb-1">Your path has not yet begun</p>
          <p className="text-xs text-muted-foreground/60">Map a tree or leave an offering to start your journey.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-serif font-bold text-primary mb-6">
            {activeStaff ? `${activeStaff.species} — Paradise Path` : "Your Paradise Path"}
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent" />

            <div className="space-y-4">
              {events.map((event) => {
                const color = TYPE_COLORS[event.type] || "28 70% 50%";
                const Icon = getStepIcon(event.type);
                const content = (
                  <div className="relative flex gap-5 items-start group">
                    <div
                      className="relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_12px_hsl(var(--accent)/0.4)] transition-all duration-300"
                      style={{
                        borderColor: `hsl(${color})`,
                        backgroundColor: `hsl(${color} / 0.15)`,
                      }}
                    >
                      <span style={{ color: `hsl(${color})` }}>{Icon}</span>
                    </div>

                    <Card className="flex-1 border-mystical bg-card/60 backdrop-blur-sm group-hover:border-accent/40 transition-all duration-300">
                      <CardContent className="py-4 px-5">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h4 className="font-serif font-semibold text-primary text-sm">{event.title}</h4>
                            {event.subtitle && (
                              <span className="text-xs text-muted-foreground italic">{event.subtitle}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );

                return event.link ? (
                  <Link key={event.id} to={event.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={event.id}>{content}</div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Journey Bridge → next step */}
      <JourneyBridge current="path" hasStaff={!!activeStaff} />
    </div>
  );
};

export default CreatorsPath;

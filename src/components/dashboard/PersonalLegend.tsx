import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  TreeDeciduous, Gift, Heart, Music, Sprout, Archive,
  Star, Loader2, Wand2
} from "lucide-react";
import type { TetolLevel } from "@/contexts/TetolLevelContext";

interface TimelineEvent {
  id: string;
  type: "tree" | "offering" | "song" | "plant" | "vault" | "wishlist" | "ceremony";
  title: string;
  subtitle?: string;
  date: string;
  level: TetolLevel;
  link?: string;
}

const TYPE_META: Record<TimelineEvent["type"], { icon: React.ElementType; label: string; color: string }> = {
  tree:     { icon: TreeDeciduous, label: "Mapped a tree", color: "120 45% 45%" },
  offering: { icon: Gift, label: "Left an offering", color: "28 70% 50%" },
  song:     { icon: Music, label: "Saved a song", color: "28 70% 50%" },
  plant:    { icon: Sprout, label: "Added a plant", color: "120 45% 45%" },
  vault:    { icon: Archive, label: "Stored in vault", color: "15 80% 55%" },
  wishlist: { icon: Star, label: "Wished for a tree", color: "45 100% 60%" },
  ceremony: { icon: Wand2, label: "Staff ceremony", color: "280 60% 55%" },
};

interface PersonalLegendProps {
  userId: string;
}

const PersonalLegend = ({ userId }: PersonalLegendProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [userId]);

  const fetchTimeline = async () => {
    setLoading(true);

    const [treesRes, offeringsRes, songsRes, plantsRes, vaultRes, wishlistRes, ceremoniesRes] = await Promise.all([
      supabase.from("trees").select("id, name, species, created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("offerings").select("id, title, type, created_at, tree_id").eq("created_by", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("saved_songs").select("id, title, artist, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("greenhouse_plants").select("id, name, species, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("vault_items").select("id, title, type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("tree_wishlist").select("id, notes, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("ceremony_logs").select("id, staff_code, staff_name, staff_species, ceremony_type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ]);

    const all: TimelineEvent[] = [];

    (treesRes.data || []).forEach((t) =>
      all.push({ id: t.id, type: "tree", title: t.name, subtitle: t.species, date: t.created_at, level: "roots", link: `/tree/${t.id}` })
    );
    (offeringsRes.data || []).forEach((o) =>
      all.push({ id: o.id, type: "offering", title: o.title, subtitle: o.type, date: o.created_at, level: "heartwood", link: `/tree/${o.tree_id}` })
    );
    (songsRes.data || []).forEach((s) =>
      all.push({ id: s.id, type: "song", title: s.title, subtitle: s.artist, date: s.created_at, level: "heartwood" })
    );
    (plantsRes.data || []).forEach((p) =>
      all.push({ id: p.id, type: "plant", title: p.name, subtitle: p.species || undefined, date: p.created_at, level: "roots" })
    );
    (vaultRes.data || []).forEach((v) =>
      all.push({ id: v.id, type: "vault", title: v.title, subtitle: v.type, date: v.created_at, level: "hearth" })
    );
    (wishlistRes.data || []).forEach((w) =>
      all.push({ id: w.id, type: "wishlist", title: w.notes || "A wish", date: w.created_at, level: "heartwood" })
    );
    (ceremoniesRes.data || []).forEach((c: any) => {
      const label = c.ceremony_type === "binding" ? "Staff Bound" : "Staff Awakened";
      all.push({
        id: c.id,
        type: "ceremony",
        title: `${label}: ${c.staff_name || c.staff_code}`,
        subtitle: c.staff_species || c.staff_code,
        date: c.created_at,
        level: "hearth",
        link: `/staff/${c.staff_code}`,
      });
    });

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(all);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground font-serif mb-1">Your legend has not yet begun</p>
        <p className="text-xs text-muted-foreground/60">Map a tree, leave an offering, or save a song to start your journey.</p>
      </div>
    );
  }

  // Group by month
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach((e) => {
    const key = new Date(e.date).toLocaleDateString("en-GB", { year: "numeric", month: "long" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="font-serif text-lg text-primary tracking-wider mb-1">Personal Legend</h2>
        <p className="text-xs text-muted-foreground/60 font-serif">{events.length} chapters written</p>
      </div>

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-serif whitespace-nowrap">
              {month}
            </span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          <div className="relative pl-6 space-y-3">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-border/40 via-border/20 to-transparent" />

            {items.map((event) => {
              const meta = TYPE_META[event.type];
              const Icon = meta.icon;
              const content = (
                <div className="group flex items-start gap-3 py-2">
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 -ml-6 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                    style={{
                      borderColor: `hsl(${meta.color})`,
                      backgroundColor: `hsl(${meta.color} / 0.15)`,
                    }}
                  >
                    <Icon className="w-2.5 h-2.5" style={{ color: `hsl(${meta.color})` }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-sm text-foreground/80 group-hover:text-foreground transition-colors truncate">
                        {event.title}
                      </span>
                      {event.subtitle && (
                        <span className="text-[10px] text-muted-foreground/50 italic truncate hidden sm:inline">
                          {event.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/40">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/30">
                        {new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              );

              return event.link ? (
                <Link key={event.id} to={event.link} className="block hover:bg-card/30 rounded-lg -mx-2 px-2 transition-colors">
                  {content}
                </Link>
              ) : (
                <div key={event.id} className="-mx-2 px-2">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PersonalLegend;

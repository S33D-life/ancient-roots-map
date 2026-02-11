import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Calendar, Hash, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

const ANCIENT_FRIENDS_GALLERY = [
  {
    image: "/images/hero-trees/ancient-oak-mist.jpeg",
    name: "Grandfather Oak",
    species: "Quercus robur",
    treeId: "a1b2c3d4-1111-4aaa-bbbb-000000000001",
  },
  {
    image: "/images/hero-trees/ancient-yew-twilight.jpeg",
    name: "Fortingall Yew",
    species: "Taxus baccata",
    treeId: "2e4ef3b8-01b7-4f8c-925f-924b259a0df5",
  },
  {
    image: "/images/hero-trees/sequoia-ember.jpeg",
    name: "General Sherman",
    species: "Sequoiadendron giganteum",
    treeId: "5f58348b-9893-4023-8745-948c80933672",
  },
  {
    image: "/images/hero-trees/baobab-dawn.jpeg",
    name: "Big Tree Baobab",
    species: "Adansonia digitata",
    treeId: "bce00dc1-3de0-41be-85bf-d9ad2d276421",
  },
  {
    image: "/images/hero-trees/cherry-blossom-mist.jpeg",
    name: "Jōmon Sugi",
    species: "Cryptomeria japonica",
    treeId: "ad0cb057-1430-4088-89af-5f9b7dd2ecf5",
  },
];

interface Visit {
  id: string;
  visitor_number: number;
  ancient_friend_index: number;
  created_at: string;
}

const VisitsPage = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      // Fetch personal visits (if logged in) or all recent visits
      if (user) {
        const { data, count } = await supabase
          .from("site_visits")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        setVisits(data || []);
        setTotalVisits(count || 0);
      } else {
        // Show recent community visits for non-logged-in users
        const { data, count } = await supabase
          .from("site_visits")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(50);
        setVisits(data || []);
        setTotalVisits(count || 0);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Group visits by month
  const groupedVisits = visits.reduce<Record<string, Visit[]>>((acc, visit) => {
    const monthKey = format(new Date(visit.created_at), "MMMM yyyy");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(visit);
    return acc;
  }, {});

  // Count connections per friend
  const friendCounts = visits.reduce<Record<number, number>>((acc, v) => {
    acc[v.ancient_friend_index] = (acc[v.ancient_friend_index] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-wide mb-2">
            Visitor Log
          </h1>
          <p className="font-serif text-sm text-muted-foreground tracking-[0.15em] uppercase">
            {userId ? "Your Digital Connections" : "Community Connections"}
          </p>
          {totalVisits > 0 && (
            <p className="mt-3 font-serif text-lg text-primary">
              {totalVisits.toLocaleString()} {totalVisits === 1 ? "visit" : "visits"} recorded
            </p>
          )}
        </div>

        {/* Ancient Friends Summary */}
        {visits.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-lg text-foreground mb-4 tracking-wide">
              Ancient Friends Connected
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {ANCIENT_FRIENDS_GALLERY.map((friend, idx) => {
                const count = friendCounts[idx] || 0;
                return (
                  <Link
                    key={friend.treeId}
                    to={`/tree/${friend.treeId}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border-border bg-card/60 backdrop-blur hover:border-primary/40 transition-all duration-300">
                      <div className="relative aspect-square">
                        <img
                          src={friend.image}
                          alt={friend.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {count > 0 && (
                          <span className="absolute top-2 right-2 text-xs font-serif px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground">
                            ×{count}
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="font-serif text-xs text-white/90 leading-tight truncate">
                            {friend.name}
                          </p>
                          <p className="text-[10px] text-white/60 italic truncate">
                            {friend.species}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Visit Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "hsl(var(--primary))" }} />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16">
            <TreeDeciduous className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="font-serif text-muted-foreground">No visits recorded yet.</p>
            <Link to="/" className="font-serif text-sm text-primary hover:underline mt-2 inline-block">
              Visit the grove →
            </Link>
          </div>
        ) : (
          <section>
            <h2 className="font-serif text-lg text-foreground mb-4 tracking-wide">
              Timeline
            </h2>
            {Object.entries(groupedVisits).map(([month, monthVisits]) => (
              <div key={month} className="mb-8">
                <h3 className="font-serif text-sm text-muted-foreground tracking-[0.12em] uppercase mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {month}
                  <span className="text-xs text-muted-foreground/60">({monthVisits.length})</span>
                </h3>
                <div className="space-y-2">
                  {monthVisits.map((visit) => {
                    const friend = ANCIENT_FRIENDS_GALLERY[visit.ancient_friend_index] || ANCIENT_FRIENDS_GALLERY[0];
                    return (
                      <Card
                        key={visit.id}
                        className="flex items-center gap-3 p-3 border-border bg-card/40 backdrop-blur hover:bg-card/70 transition-colors"
                      >
                        <img
                          src={friend.image}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover border border-primary/20 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-sm text-foreground truncate">
                            {friend.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground italic">
                            {friend.species}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="flex items-center gap-1 text-xs text-primary font-serif">
                            <Hash className="w-3 h-3" />
                            {visit.visitor_number.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(visit.created_at), "d MMM · HH:mm")}
                          </p>
                        </div>
                        <Link
                          to={`/tree/${friend.treeId}`}
                          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          title="View Ancient Friend"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default VisitsPage;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Leaf, TreeDeciduous, BookOpen, Heart, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface HearthWarmthProps {
  userId: string;
}

/* ─── Module wrapper ─── */
interface WarmthModuleProps {
  icon: React.ReactNode;
  title: string;
  accent: string; // HSL values for theming
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
}

const WarmthModule = ({ icon, title, accent, defaultOpen = true, children, count }: WarmthModuleProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/30 overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${accent} / 0.06), hsl(${accent} / 0.02))` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span style={{ color: `hsl(${accent})` }}>{icon}</span>
        <h3 className="font-serif text-sm tracking-wide flex-1" style={{ color: `hsl(${accent})` }}>{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] rounded-full px-2 py-0.5 font-serif" style={{ background: `hsl(${accent} / 0.15)`, color: `hsl(${accent})` }}>
            {count}
          </span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Gentle card for individual items ─── */
const WarmthCard = ({ children, to }: { children: React.ReactNode; to?: string }) => {
  const inner = (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/40 backdrop-blur border border-border/20 transition-colors hover:border-border/40 hover:bg-card/60">
      {children}
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
};

/* ─── 🔥 My Warmth ─── */
const MyWarmth = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const [books, offerings, checkins] = await Promise.all([
        supabase.from("bookshelf_entries").select("id, title, author, visibility, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
        supabase.from("offerings").select("id, title, type, tree_id, visibility, created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(3),
        supabase.from("tree_checkins").select("id, tree_id, season_stage, checked_in_at").eq("user_id", userId).order("checked_in_at", { ascending: false }).limit(2),
      ]);

      const all: any[] = [];
      (books.data || []).forEach(b => all.push({ ...b, _kind: "book" }));
      (offerings.data || []).forEach(o => all.push({ ...o, _kind: "offering", created_at: o.created_at }));
      (checkins.data || []).forEach(c => all.push({ ...c, _kind: "checkin", created_at: c.checked_in_at }));
      all.sort((a, b) => new Date(b.created_at || b.checked_in_at).getTime() - new Date(a.created_at || a.checked_in_at).getTime());
      setItems(all.slice(0, 5));
    };
    fetchRecent();
  }, [userId]);

  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground/50 font-serif italic">Your warmth circle awaits its first ember</p>
      </div>
    );
  }

  return (
    <>
      {items.map((item) => {
        if (item._kind === "book") {
          return (
            <WarmthCard key={`book-${item.id}`}>
              <BookOpen className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground/80 truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground/50">{item.author} · Added to shelf</p>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{item.visibility}</Badge>
            </WarmthCard>
          );
        }
        if (item._kind === "offering") {
          return (
            <WarmthCard key={`off-${item.id}`} to={item.tree_id ? `/tree/${item.tree_id}` : undefined}>
              <Sparkles className="w-4 h-4 text-accent/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground/80 truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground/50">{item.type} offering</p>
              </div>
            </WarmthCard>
          );
        }
        if (item._kind === "checkin") {
          return (
            <WarmthCard key={`ci-${item.id}`} to={`/tree/${item.tree_id}`}>
              <TreeDeciduous className="w-4 h-4 text-emerald-500/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground/80">Visited a tree</p>
                <p className="text-[10px] text-muted-foreground/50">{item.season_stage} · {new Date(item.checked_in_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
              </div>
            </WarmthCard>
          );
        }
        return null;
      })}
    </>
  );
};

/* ─── 🌿 From Wanderers ─── */
const FromWanderers = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Get books shared by others (public/circle/tribe)
      const { data } = await supabase
        .from("bookshelf_entries")
        .select("id, title, author, visibility, created_at")
        .in("visibility", ["public", "circle", "tribe"])
        .neq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setItems(data || []);
    };
    fetch();
  }, [userId]);

  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground/50 font-serif italic">No wanderer activity yet. The grove is quiet.</p>
      </div>
    );
  }

  return (
    <>
      {items.map(item => (
        <WarmthCard key={item.id}>
          <BookOpen className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground/80 truncate">{item.title}</p>
            <p className="text-[10px] text-muted-foreground/50">{item.author} · Shared by a wanderer</p>
          </div>
        </WarmthCard>
      ))}
    </>
  );
};

/* ─── 🌳 Trees in Bloom ─── */
const TreesInBloom = ({ userId }: { userId: string }) => {
  const [trees, setTrees] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Trees the user has visited that have recent activity
      const { data: userCheckins } = await supabase
        .from("tree_checkins")
        .select("tree_id")
        .eq("user_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(20);

      if (!userCheckins || userCheckins.length === 0) return;

      const treeIds = [...new Set(userCheckins.map(c => c.tree_id))].slice(0, 10);

      // Get recent offerings on those trees (not by this user)
      const { data: recentOfferings } = await supabase
        .from("offerings")
        .select("id, title, type, tree_id, created_at")
        .in("tree_id", treeIds)
        .neq("created_by", userId)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentOfferings && recentOfferings.length > 0) {
        // Fetch tree names
        const offeringTreeIds = [...new Set(recentOfferings.map(o => o.tree_id))];
        const { data: treesData } = await supabase
          .from("trees")
          .select("id, name, species")
          .in("id", offeringTreeIds);

        const merged = recentOfferings.map(o => ({
          ...o,
          treeName: (treesData || []).find(t => t.id === o.tree_id)?.name || "A tree",
          treeSpecies: (treesData || []).find(t => t.id === o.tree_id)?.species || "",
        }));
        setTrees(merged);
      }
    };
    fetch();
  }, [userId]);

  if (trees.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground/50 font-serif italic">Visit trees to see their stories grow here</p>
      </div>
    );
  }

  return (
    <>
      {trees.map(item => (
        <WarmthCard key={item.id} to={`/tree/${item.tree_id}`}>
          <Leaf className="w-4 h-4 text-emerald-500/60 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground/80 truncate">{item.treeName}</p>
            <p className="text-[10px] text-muted-foreground/50">New {item.type} offering: "{item.title}"</p>
          </div>
        </WarmthCard>
      ))}
    </>
  );
};

/* ─── 🌕 Council Circle ─── */
const CouncilCircle = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("heart_campaigns")
      .select("id, title, description, ends_at, status")
      .eq("status", "active")
      .order("ends_at", { ascending: true })
      .limit(2)
      .then(({ data }) => setCampaigns(data || []));
  }, []);

  // Lunar phase approximation
  const getLunarPhase = () => {
    const now = new Date();
    const synodicMonth = 29.53059;
    const knownNewMoon = new Date(2024, 0, 11, 11, 57); // Jan 11 2024 known new moon
    const daysSince = (now.getTime() - knownNewMoon.getTime()) / 86400000;
    const phase = ((daysSince % synodicMonth) / synodicMonth) * 100;
    if (phase < 6.25) return { name: "New Moon", emoji: "🌑" };
    if (phase < 18.75) return { name: "Waxing Crescent", emoji: "🌒" };
    if (phase < 31.25) return { name: "First Quarter", emoji: "🌓" };
    if (phase < 43.75) return { name: "Waxing Gibbous", emoji: "🌔" };
    if (phase < 56.25) return { name: "Full Moon", emoji: "🌕" };
    if (phase < 68.75) return { name: "Waning Gibbous", emoji: "🌖" };
    if (phase < 81.25) return { name: "Last Quarter", emoji: "🌗" };
    if (phase < 93.75) return { name: "Waning Crescent", emoji: "🌘" };
    return { name: "New Moon", emoji: "🌑" };
  };

  const lunar = getLunarPhase();

  return (
    <div className="space-y-3">
      {/* Lunar rhythm */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/20">
        <span className="text-2xl">{lunar.emoji}</span>
        <div>
          <p className="text-sm font-serif text-foreground/80">{lunar.name}</p>
          <p className="text-[10px] text-muted-foreground/50">Current lunar phase</p>
        </div>
      </div>

      {/* Active campaigns */}
      {campaigns.length > 0 ? (
        campaigns.map(c => {
          const daysLeft = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000));
          return (
            <WarmthCard key={c.id}>
              <Heart className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-foreground/80 truncate">{c.title}</p>
                <p className="text-[10px] text-muted-foreground/50">{daysLeft} days remaining</p>
              </div>
            </WarmthCard>
          );
        })
      ) : (
        <div className="text-center py-2">
          <p className="text-[10px] text-muted-foreground/40 font-serif">No active council campaigns</p>
        </div>
      )}

      <Link
        to="/council-of-life"
        className="block text-center text-xs font-serif text-primary/70 hover:text-primary transition-colors py-1"
      >
        Enter the Council →
      </Link>
    </div>
  );
};

/* ─── Main Hearth Warmth ─── */
const HearthWarmth = ({ userId }: HearthWarmthProps) => {
  return (
    <div className="space-y-4">
      {/* Gentle introduction */}
      <div className="text-center mb-2">
        <p className="text-xs text-muted-foreground/50 font-serif italic">
          A quiet place where your world gathers
        </p>
      </div>

      <WarmthModule
        icon={<Flame className="w-4 h-4" />}
        title="My Warmth"
        accent="25 80% 55%"
        defaultOpen={true}
      >
        <MyWarmth userId={userId} />
      </WarmthModule>

      <WarmthModule
        icon={<TreeDeciduous className="w-4 h-4" />}
        title="Trees in Bloom"
        accent="120 45% 40%"
        defaultOpen={true}
      >
        <TreesInBloom userId={userId} />
      </WarmthModule>
    </div>
  );
};

export default HearthWarmth;

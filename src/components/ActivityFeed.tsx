/**
 * ActivityFeed — Reusable ecosystem activity feed showing recent events.
 * Surfaces existing data: trees mapped, offerings added, hearts earned, councils.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Heart, Music, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  type: "tree" | "offering" | "heart" | "council";
  label: string;
  detail?: string;
  link?: string;
  timestamp: string;
}

const ICONS: Record<FeedItem["type"], React.ReactNode> = {
  tree: <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />,
  offering: <Music className="w-3.5 h-3.5 text-primary" />,
  heart: <Heart className="w-3.5 h-3.5 text-red-400" />,
  council: <Users className="w-3.5 h-3.5 text-amber-400" />,
};

interface Props {
  limit?: number;
  userId?: string; // if provided, scopes to user
  compact?: boolean;
}

export default function ActivityFeed({ limit = 8, userId, compact }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const results: FeedItem[] = [];

      // Recent trees
      let treeQuery = supabase
        .from("trees")
        .select("id, name, species, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (userId) treeQuery = treeQuery.eq("created_by", userId);
      const { data: trees } = await treeQuery;
      (trees || []).forEach((t) =>
        results.push({
          id: `tree-${t.id}`,
          type: "tree",
          label: `${t.name || "Ancient Friend"} mapped`,
          detail: t.species || undefined,
          link: `/tree/${t.id}`,
          timestamp: t.created_at,
        })
      );

      // Recent offerings
      let offQuery = supabase
        .from("offerings")
        .select("id, type, title, tree_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (userId) offQuery = offQuery.eq("created_by", userId);
      const { data: offs } = await offQuery;
      (offs || []).forEach((o) =>
        results.push({
          id: `off-${o.id}`,
          type: "offering",
          label: `${o.title || o.type} offering added`,
          link: `/tree/${o.tree_id}`,
          timestamp: o.created_at,
        })
      );

      // Recent heart transactions
      let heartQuery = supabase
        .from("heart_transactions")
        .select("id, heart_type, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (userId) heartQuery = heartQuery.eq("user_id", userId);
      const { data: hearts } = await heartQuery;
      (hearts || []).forEach((h) =>
        results.push({
          id: `heart-${h.id}`,
          type: "heart",
          label: `${h.amount} ${h.heart_type} heart${h.amount !== 1 ? "s" : ""} earned`,
          timestamp: h.created_at,
        })
      );

      // Recent council participation
      const { data: councilRewards } = await supabase
        .from("council_participation_rewards")
        .select("id, council_id, hearts_awarded, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      (councilRewards || []).forEach((c) =>
        results.push({
          id: `council-${c.id}`,
          type: "council",
          label: `Council gathering — ${c.hearts_awarded} hearts awarded`,
          timestamp: c.created_at,
        })
      );

      // Sort by timestamp, take limit
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(results.slice(0, limit));
      setLoading(false);
    };

    fetchActivity();
  }, [limit, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="text-xs text-muted-foreground font-serif text-center py-4 italic">
        No recent activity yet — map a tree or add an offering to begin.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((item, i) => {
        const content = (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-card/50 border border-border/30 hover:bg-card/70 active:bg-card/80 transition-colors group min-h-[44px]"
          >
            <div className="mt-0.5 flex-shrink-0">{ICONS[item.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground/85 leading-snug truncate">
                {item.label}
              </p>
              {item.detail && (
                <p className="text-[10px] text-muted-foreground font-serif italic truncate">{item.detail}</p>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground/60 font-mono flex-shrink-0 mt-0.5">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: false })}
            </span>
          </motion.div>
        );

        return item.link ? (
          <Link key={item.id} to={item.link} className="block no-underline">
            {content}
          </Link>
        ) : (
          content
        );
      })}
    </div>
  );
}

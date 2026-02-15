import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Music, FileText, MessageSquare, Sparkles, Mic, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];
type OfferingType = Database["public"]["Enums"]["offering_type"];

const typeIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-3.5 w-3.5" />,
  song: <Music className="h-3.5 w-3.5" />,
  poem: <FileText className="h-3.5 w-3.5" />,
  story: <MessageSquare className="h-3.5 w-3.5" />,
  nft: <Sparkles className="h-3.5 w-3.5" />,
  voice: <Mic className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
};

interface TreeLookup {
  id: string;
  name: string;
}

interface OfferingListProps {
  offerings: Offering[];
  /** Optional tree lookup for cross-tree lists (hive, profile) */
  treeLookup?: TreeLookup[];
  /** Max items to display (default 50) */
  limit?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Show tree link for each offering */
  showTreeLink?: boolean;
}

/**
 * Unified offering display list used across Hive, Gallery, Profile, and Dashboard.
 * Ensures consistent sorting (newest first), icons, and layout everywhere.
 */
const OfferingList = ({
  offerings,
  treeLookup,
  limit = 50,
  emptyMessage = "No offerings yet.",
  showTreeLink = true,
}: OfferingListProps) => {
  const treeMap = useMemo(() => {
    if (!treeLookup) return null;
    const m = new Map<string, string>();
    treeLookup.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [treeLookup]);

  const sorted = useMemo(
    () =>
      [...offerings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit),
    [offerings, limit]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-center text-muted-foreground font-serif py-12">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((off, i) => {
        const treeName = treeMap?.get(off.tree_id);
        return (
          <motion.div
            key={off.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
          >
            <Card className="bg-card/60 backdrop-blur border-border/40">
              <CardContent className="p-3 flex items-center gap-3">
                {off.media_url && off.type === "photo" && (
                  <img
                    src={off.media_url}
                    alt={off.title}
                    className="w-12 h-12 rounded object-cover shrink-0"
                    loading="lazy"
                  />
                )}
                <span className="text-primary/70 shrink-0">{typeIcons[off.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-foreground truncate">{off.title}</p>
                  {showTreeLink && treeName && (
                    <Link
                      to={`/tree/${off.tree_id}`}
                      className="text-[11px] text-primary/70 hover:text-primary font-serif transition-colors"
                    >
                      at {treeName}
                    </Link>
                  )}
                  <span className="text-[10px] text-muted-foreground/50 ml-2 font-mono">
                    {new Date(off.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-serif shrink-0 capitalize border-border/30">
                  {off.type}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OfferingList;

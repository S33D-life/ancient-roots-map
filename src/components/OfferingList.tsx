import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Music, FileText, MessageSquare, Sparkles, Mic, BookOpen, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  treeLookup?: TreeLookup[];
  limit?: number;
  emptyMessage?: string;
  showTreeLink?: boolean;
  /** Called after a successful delete so parent can refresh */
  onDelete?: () => void;
}

const OfferingList = ({
  offerings,
  treeLookup,
  limit = 50,
  emptyMessage = "No offerings yet.",
  showTreeLink = true,
  onDelete,
}: OfferingListProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offering | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("offerings").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Offering removed" });
      onDelete?.();
    }
  };

  if (sorted.length === 0) {
    return (
      <p className="text-center text-muted-foreground font-serif py-12">{emptyMessage}</p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((off, i) => {
            const treeName = treeMap?.get(off.tree_id);
            const isAuthor = currentUserId && off.created_by === currentUserId;
            return (
              <motion.div
                key={off.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
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
                    {isAuthor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setDeleteTarget(off)}
                        aria-label="Delete offering"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Remove offering?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              "{deleteTarget?.title}" will be permanently removed from all views.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="font-serif">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-serif"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OfferingList;

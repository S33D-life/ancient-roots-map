import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Eye, EyeOff, Users, TreeDeciduous, Filter, Trash2, Edit3, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBookshelf, type BookshelfEntry, type BookshelfVisibility } from "@/hooks/use-bookshelf";
import AddToShelfDialog from "@/components/AddToShelfDialog";
import { toast } from "sonner";

interface PersonalBookshelfProps {
  userId: string;
}

const visibilityIcons: Record<string, React.ReactNode> = {
  private: <EyeOff className="h-3 w-3" />,
  circle: <Users className="h-3 w-3" />,
  tribe: <Users className="h-3 w-3" />,
  public: <Eye className="h-3 w-3" />,
};

const visibilityLabels: Record<string, string> = {
  private: "Private",
  circle: "Circle",
  tribe: "Tribe",
  public: "Public",
};

const filterOptions = [
  { value: "all", label: "All Books" },
  { value: "private", label: "Private" },
  { value: "circle", label: "Circle" },
  { value: "tribe", label: "Tribe" },
  { value: "public", label: "Public" },
  { value: "tree-linked", label: "Tree-Linked" },
] as const;

const spineColors = [
  "from-emerald-800 to-emerald-950",
  "from-amber-800 to-amber-950",
  "from-violet-800 to-violet-950",
  "from-rose-800 to-rose-950",
  "from-blue-800 to-blue-950",
  "from-teal-800 to-teal-950",
  "from-orange-800 to-orange-950",
  "from-indigo-800 to-indigo-950",
];

const PersonalBookshelf = ({ userId }: PersonalBookshelfProps) => {
  const [filter, setFilter] = useState<BookshelfVisibility | "all" | "tree-linked">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { entries, loading, stats, deleteEntry, updateEntry } = useBookshelf({ userId, filter });

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this book from your shelf?")) return;
    try {
      await deleteEntry(id);
      toast.success("Book removed from shelf");
    } catch {
      toast.error("Failed to remove book");
    }
  };

  const handleShare = async (entry: BookshelfEntry) => {
    const nextVisibility = entry.visibility === "private" ? "public" : "private";
    try {
      await updateEntry(entry.id, { visibility: nextVisibility as BookshelfVisibility });
      toast.success(nextVisibility === "public" ? "Book shared publicly" : "Book made private");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-sm text-foreground/80">{stats.total} books</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-serif gap-1">
          <EyeOff className="h-2.5 w-2.5" /> {stats.private} private
        </Badge>
        <Badge variant="outline" className="text-[10px] font-serif gap-1">
          <Eye className="h-2.5 w-2.5" /> {stats.shared} shared
        </Badge>
        <Badge variant="outline" className="text-[10px] font-serif gap-1">
          <TreeDeciduous className="h-2.5 w-2.5" /> {stats.treeLinked} tree-linked
        </Badge>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as any)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-serif whitespace-nowrap transition-all ${
                filter === opt.value
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="font-serif text-xs gap-1 shrink-0">
          <Plus className="h-3 w-3" /> Add Book
        </Button>
      </div>

      {/* Shelf */}
      {loading ? (
        <div className="text-center py-12">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground/50 font-serif mt-2">Loading your shelf…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-primary/40" />
          </div>
          <p className="text-sm font-serif text-muted-foreground/60">Your shelf awaits its first book</p>
          <p className="text-xs text-muted-foreground/40 font-serif">Books start private. Share when you're ready.</p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="font-serif text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Your First Book
          </Button>
        </div>
      ) : (
        <>
          {/* Spine shelf display */}
          <div
            className="relative rounded-xl border border-border/30 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(var(--card) / 0.6) 0%, hsl(var(--secondary) / 0.3) 100%)",
            }}
          >
            <div className="px-4 pt-6 pb-3">
              <motion.div
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {entries.map((entry, i) => {
                  const isExpanded = expandedId === entry.id;
                  const colorIdx = i % spineColors.length;

                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${
                        isExpanded ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
                      }`}
                      style={{ width: isExpanded ? 100 : 44, height: 160 }}
                      title={`${entry.title} — ${entry.author}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${spineColors[colorIdx]}`} />
                      <div className="absolute inset-x-0 top-2 h-px bg-white/10" />
                      <div className="absolute inset-x-0 bottom-2 h-px bg-white/10" />
                      <div className="absolute left-1 inset-y-0 w-px bg-white/5" />

                      {/* Visibility indicator */}
                      <div className="absolute top-1 right-1 text-white/40">
                        {visibilityIcons[entry.visibility]}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-white/90 font-serif text-[10px] leading-tight tracking-wider whitespace-nowrap max-w-[140px] truncate"
                          style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
                        >
                          {entry.title}
                        </span>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80 flex flex-col items-center justify-center p-2 text-center"
                          >
                            <BookOpen className="h-4 w-4 text-white/60 mb-1" />
                            <p className="text-white/90 font-serif text-[9px] leading-tight line-clamp-3">{entry.title}</p>
                            <p className="text-white/50 text-[8px] mt-0.5 line-clamp-1">{entry.author}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
            <div
              className="h-3 border-t border-border/20"
              style={{
                background: "linear-gradient(180deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.3))",
                boxShadow: "0 -2px 8px hsl(var(--secondary) / 0.3)",
              }}
            />
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expandedId && (() => {
              const entry = entries.find(e => e.id === expandedId);
              if (!entry) return null;
              const colorIdx = entries.indexOf(entry) % spineColors.length;

              return (
                <motion.div
                  key={expandedId}
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
                    <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }} />
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className={`w-16 h-24 rounded-sm bg-gradient-to-b ${spineColors[colorIdx]} flex items-center justify-center shrink-0 shadow-lg`}>
                          <BookOpen className="h-6 w-6 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-lg text-primary tracking-wide">{entry.title}</h4>
                          <p className="text-sm text-muted-foreground/70 font-serif">{entry.author}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {entry.genre && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.genre}</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              {visibilityIcons[entry.visibility]} {visibilityLabels[entry.visibility]}
                            </Badge>
                            {entry.linked_tree_ids?.length > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                                <TreeDeciduous className="h-2.5 w-2.5" /> {entry.linked_tree_ids.length} tree{entry.linked_tree_ids.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {entry.quote && (
                        <blockquote className="border-l-2 border-primary/30 pl-3 mt-4 italic text-sm font-serif text-foreground/70 leading-relaxed">
                          "{entry.quote}"
                        </blockquote>
                      )}

                      {entry.reflection && (
                        <p className="text-sm font-serif text-foreground/60 leading-relaxed mt-3">{entry.reflection}</p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                        <p className="text-[10px] text-muted-foreground/50 font-serif">
                          {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleShare(entry)} className="text-muted-foreground/50 hover:text-primary transition-colors" title="Toggle visibility">
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors" title="Remove">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </>
      )}

      <AddToShelfDialog open={addOpen} onOpenChange={setAddOpen} userId={userId} />
    </div>
  );
};

export default PersonalBookshelf;

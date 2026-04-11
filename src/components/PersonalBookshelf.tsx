import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Eye, EyeOff, Users, TreeDeciduous, Trash2, Share2,
  FolderOpen, ChevronDown, ChevronRight, Pencil, MessageSquareQuote,
  StickyNote, Sparkles, BookMarked, Package, Feather, Search,
  ArrowUpDown, SortAsc, SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookshelf, type BookshelfEntry, type BookshelfVisibility } from "@/hooks/use-bookshelf";
import { useBookshelves, type Bookshelf } from "@/hooks/use-bookshelves";
import { supabase } from "@/integrations/supabase/client";
import AddToShelfDialog from "@/components/AddToShelfDialog";
import BookMusingsPanel from "@/components/BookMusingsPanel";
import BookCsvImportDialog from "@/components/BookCsvImportDialog";
import LibraryInventoryPortal from "@/components/LibraryInventoryPortal";
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
  private: "Heartwood",
  circle: "Grove",
  tribe: "Tree Circle",
  public: "Public",
};

const filterOptions = [
  { value: "all", label: "All Books" },
  { value: "private", label: "Heartwood" },
  { value: "circle", label: "Grove" },
  { value: "tribe", label: "Tree Circle" },
  { value: "public", label: "Public" },
  { value: "tree-linked", label: "Tree-Linked" },
] as const;

type SortOption = "recent" | "title-asc" | "title-desc" | "author-asc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
  { value: "author-asc", label: "Author A → Z" },
];

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

// Dust motes for empty state atmosphere
const DustMotes = () => {
  const motes = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 4,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {motes.map(m => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: m.size,
            height: m.size,
            left: `${m.x}%`,
            top: `${m.y}%`,
            background: "hsl(var(--primary) / 0.15)",
          }}
          animate={{
            y: [0, -20, -10, -30],
            x: [0, 8, -5, 3],
            opacity: [0, 0.6, 0.3, 0],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            delay: m.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

function sortEntries(entries: BookshelfEntry[], sort: SortOption): BookshelfEntry[] {
  const sorted = [...entries];
  switch (sort) {
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "author-asc":
      return sorted.sort((a, b) => a.author.localeCompare(b.author));
    case "recent":
    default:
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

const PersonalBookshelf = ({ userId }: PersonalBookshelfProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BookshelfVisibility | "all" | "tree-linked">("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [musingsBookId, setMusingsBookId] = useState<string | null>(null);
  const [collapsedShelves, setCollapsedShelves] = useState<Set<string>>(new Set());
  const [shelfDialogOpen, setShelfDialogOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfName, setEditingShelfName] = useState("");
  const [assignShelfBookId, setAssignShelfBookId] = useState<string | null>(null);

  const { entries, loading, stats, deleteEntry, updateEntry, refetch } = useBookshelf({ userId, filter });
  const { shelves, createShelf, updateShelf, deleteShelf } = useBookshelves(userId);

  // Search + sort entries
  const processedEntries = useMemo(() => {
    let result = entries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) || e.author.toLowerCase().includes(q)
      );
    }
    return sortEntries(result, sort);
  }, [entries, searchQuery, sort]);

  const handleCreateMultipleShelves = async (names: string[]) => {
    for (const name of names) {
      await createShelf(name);
    }
  };

  // Group entries by shelf
  const groupedEntries = useMemo(() => {
    const groups: { shelf: Bookshelf | null; books: BookshelfEntry[] }[] = [];
    const shelfMap = new Map<string, BookshelfEntry[]>();
    const unshelved: BookshelfEntry[] = [];

    processedEntries.forEach(entry => {
      const shelfId = (entry as any).shelf_id;
      if (shelfId) {
        if (!shelfMap.has(shelfId)) shelfMap.set(shelfId, []);
        shelfMap.get(shelfId)!.push(entry);
      } else {
        unshelved.push(entry);
      }
    });

    shelves.forEach(shelf => {
      groups.push({ shelf, books: shelfMap.get(shelf.id) || [] });
    });

    if (unshelved.length > 0 || shelves.length === 0) {
      groups.push({ shelf: null, books: unshelved });
    }

    return groups;
  }, [processedEntries, shelves]);

  const toggleShelfCollapse = (shelfId: string) => {
    setCollapsedShelves(prev => {
      const next = new Set(prev);
      if (next.has(shelfId)) next.delete(shelfId);
      else next.add(shelfId);
      return next;
    });
  };

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

  const handleCreateShelf = async () => {
    if (!newShelfName.trim()) return;
    try {
      await createShelf(newShelfName.trim());
      toast.success("Shelf created");
      setNewShelfName("");
      setShelfDialogOpen(false);
    } catch {
      toast.error("Failed to create shelf");
    }
  };

  const handleRenameShelf = async () => {
    if (!editingShelfId || !editingShelfName.trim()) return;
    try {
      await updateShelf(editingShelfId, { name: editingShelfName.trim() });
      toast.success("Shelf renamed");
      setEditingShelfId(null);
    } catch {
      toast.error("Failed to rename shelf");
    }
  };

  const handleAssignShelf = async (bookId: string, shelfId: string | null) => {
    try {
      const updateData: any = { shelf_id: shelfId };
      await supabase.from("bookshelf_entries").update(updateData).eq("id", bookId);
      toast.success(shelfId ? "Book moved to shelf" : "Book unshelved");
      setAssignShelfBookId(null);
      await refetch();
    } catch {
      toast.error("Failed to move book");
    }
  };

  const renderSpineRow = (books: BookshelfEntry[]) => {
    if (books.length === 0) return null;

    return (
      <div
        className="relative rounded-xl border border-border/30 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(var(--card) / 0.6) 0%, hsl(var(--secondary) / 0.3) 100%)",
        }}
      >
        <div className="px-4 pt-5 pb-3">
          <motion.div
            className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {books.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              const colorIdx = i % spineColors.length;
              const isPhysical = (entry as any).is_physical_copy;

              return (
                <motion.button
                  key={entry.id}
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 touch-manipulation ${
                    isExpanded
                      ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-[0_4px_20px_hsl(var(--primary)/0.2)]"
                      : "hover:shadow-[0_4px_16px_hsl(var(--primary)/0.12)]"
                  }`}
                  style={{ width: isExpanded ? 100 : 48, minHeight: 160 }}
                  title={`${entry.title} — ${entry.author}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${spineColors[colorIdx]}`} />
                  <div className="absolute inset-x-0 top-2 h-px bg-white/10" />
                  <div className="absolute inset-x-0 bottom-2 h-px bg-white/10" />
                  <div className="absolute left-1 inset-y-0 w-px bg-white/5" />

                  {/* Visibility + physical indicators */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col items-center gap-0.5">
                    <span className="text-white/40">{visibilityIcons[entry.visibility]}</span>
                    {isPhysical && <Package className="h-2.5 w-2.5 text-amber-400/50" />}
                  </div>

                  {/* Notes count badge */}
                  {(entry as any).notes_count > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-primary/70 text-white text-[7px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {(entry as any).notes_count}
                    </div>
                  )}

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
        {/* Wooden shelf edge */}
        <div
          className="h-3 border-t border-border/20"
          style={{
            background: "linear-gradient(180deg, hsl(30 40% 25% / 0.6), hsl(30 35% 18% / 0.4))",
            boxShadow: "0 -2px 8px hsl(30 30% 20% / 0.3)",
          }}
        />
      </div>
    );
  };

  const musingsEntry = entries.find(e => e.id === musingsBookId);

  return (
    <div className="space-y-6">
      {/* Library Inventory Portal */}
      <LibraryInventoryPortal
        userId={userId}
        shelves={shelves}
        onImport={() => setImportOpen(true)}
        onCreateShelves={handleCreateMultipleShelves}
      />

      {/* ═══ Stats Bar — breathable, clear hierarchy ═══ */}
      <div
        className="rounded-xl border border-border/20 p-4"
        style={{ background: "hsl(var(--card) / 0.3)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="h-5 w-5 text-primary" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.3))" }} />
          <h3 className="font-serif text-base text-foreground tracking-wide">Your Collection</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif text-2xl text-foreground tabular-nums">{stats.total}</span>
          <span className="text-xs font-serif text-muted-foreground">books</span>
          <div className="h-4 w-px bg-border/30" />
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-serif gap-1 py-0.5">
              <EyeOff className="h-2.5 w-2.5" /> {stats.private} private
            </Badge>
            <Badge variant="outline" className="text-[10px] font-serif gap-1 py-0.5">
              <Eye className="h-2.5 w-2.5" /> {stats.shared} shared
            </Badge>
            <Badge variant="outline" className="text-[10px] font-serif gap-1 py-0.5">
              <TreeDeciduous className="h-2.5 w-2.5" /> {stats.treeLinked} tree-linked
            </Badge>
            <Badge variant="outline" className="text-[10px] font-serif gap-1 py-0.5">
              <FolderOpen className="h-2.5 w-2.5" /> {shelves.length} {shelves.length === 1 ? "shelf" : "shelves"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quiet doorway to the Living Printing Press */}
      <button
        onClick={() => navigate("/press")}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/15 transition-all hover:border-primary/20 hover:shadow-[0_2px_12px_hsl(var(--primary)/0.08)] group"
        style={{ background: "linear-gradient(135deg, hsl(var(--card) / 0.3), hsl(35 20% 12% / 0.2))" }}
      >
        <Feather className="h-4 w-4 text-primary/40 group-hover:text-primary/60 transition-colors" />
        <div className="text-left">
          <span className="text-xs font-serif text-foreground/60 group-hover:text-foreground/80 transition-colors">The Living Printing Press</span>
          <p className="text-[10px] text-muted-foreground/35 font-serif">When a book moves you, shape what it stirred.</p>
        </div>
      </button>

      {/* ═══ Search + Sort + Filter Bar ═══ */}
      <div className="space-y-3">
        {/* Search + Sort row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or author…"
              className="pl-9 h-9 text-xs font-serif bg-card/30 border-border/20 focus:border-primary/30"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 text-[11px] font-serif border-border/20 bg-card/30">
              <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground/50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-serif">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as any)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-serif whitespace-nowrap transition-all touch-manipulation ${
                  filter === opt.value
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setShelfDialogOpen(true)} className="font-serif text-xs gap-1 h-8">
              <FolderOpen className="h-3 w-3" /> Shelf
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} className="font-serif text-xs gap-1 h-8">
              <Plus className="h-3 w-3" /> Book
            </Button>
          </div>
        </div>
      </div>

      {/* Search results indicator */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-serif text-muted-foreground">
            {processedEntries.length} result{processedEntries.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-[10px] font-serif text-primary hover:text-primary/80 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground/50 font-serif mt-3">Loading your shelf…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="relative text-center py-20 space-y-4 rounded-xl overflow-hidden"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 38px, hsl(30 30% 22% / 0.08) 38px, hsl(30 30% 22% / 0.08) 42px)",
          }}
        >
          <DustMotes />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <BookMarked className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-sm font-serif text-muted-foreground/60 mt-4">Your shelf awaits its first book</p>
            <p className="text-xs text-muted-foreground/40 font-serif mt-1">Books start private. Share when you're ready.</p>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="font-serif text-xs gap-1 mt-4">
              <Plus className="h-3 w-3" /> Add Your First Book
            </Button>
          </div>
        </div>
      ) : processedEntries.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-serif text-muted-foreground/50 mt-3">No books match your search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(({ shelf, books }) => {
            if (books.length === 0 && shelf) {
              // Show empty shelf with faint texture
              const isCollapsed = collapsedShelves.has(shelf.id);
              return (
                <div key={shelf.id} className="space-y-2">
                  <ShelfHeader
                    shelf={shelf}
                    isCollapsed={isCollapsed}
                    bookCount={0}
                    onToggle={() => toggleShelfCollapse(shelf.id)}
                    onRename={() => { setEditingShelfId(shelf.id); setEditingShelfName(shelf.name); }}
                    onDelete={() => {
                      if (confirm(`Delete shelf "${shelf.name}"? Books will become unshelved.`)) {
                        deleteShelf(shelf.id);
                      }
                    }}
                    onShareShelf={async (vis) => {
                      await updateShelf(shelf.id, { visibility: vis });
                      toast.success(`Shelf visibility: ${vis}`);
                    }}
                  />
                  {!isCollapsed && (
                    <div className="text-center py-8 text-xs text-muted-foreground/40 font-serif italic">
                      This shelf is empty
                    </div>
                  )}
                </div>
              );
            }

            const shelfId = shelf?.id || "__unshelved";
            const isCollapsed = collapsedShelves.has(shelfId);

            return (
              <div key={shelfId} className="space-y-2">
                <ShelfHeader
                  shelf={shelf}
                  isCollapsed={isCollapsed}
                  bookCount={books.length}
                  onToggle={() => toggleShelfCollapse(shelfId)}
                  onRename={shelf ? () => { setEditingShelfId(shelf.id); setEditingShelfName(shelf.name); } : undefined}
                  onDelete={shelf ? () => {
                    if (confirm(`Delete shelf "${shelf.name}"? Books will become unshelved.`)) {
                      deleteShelf(shelf.id);
                    }
                  } : undefined}
                  onShareShelf={shelf ? async (vis) => {
                    await updateShelf(shelf.id, { visibility: vis });
                    toast.success(`Shelf visibility: ${vis}`);
                  } : undefined}
                />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {renderSpineRow(books)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Expanded detail */}
          <AnimatePresence>
            {expandedId && (() => {
              const entry = processedEntries.find(e => e.id === expandedId);
              if (!entry) return null;
              const colorIdx = processedEntries.indexOf(entry) % spineColors.length;

              return (
                <motion.div
                  key={expandedId}
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden shadow-sm">
                    <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }} />
                    <CardContent className="p-5 md:p-6">
                      <div className="flex gap-4 md:gap-5">
                        <div className={`w-16 h-24 md:w-20 md:h-28 rounded-md bg-gradient-to-b ${spineColors[colorIdx]} flex items-center justify-center shrink-0 shadow-lg`}>
                          <BookOpen className="h-6 w-6 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-lg md:text-xl text-primary tracking-wide leading-snug">{entry.title}</h4>
                          <p className="text-sm text-muted-foreground/70 font-serif mt-0.5">{entry.author}</p>
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            {entry.genre && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{entry.genre}</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                              {visibilityIcons[entry.visibility]} {visibilityLabels[entry.visibility]}
                            </Badge>
                            {entry.linked_tree_ids?.length > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                                <TreeDeciduous className="h-2.5 w-2.5" /> {entry.linked_tree_ids.length} tree{entry.linked_tree_ids.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                            {(entry as any).is_physical_copy && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-0.5 border-amber-500/30 text-amber-600">
                                <Package className="h-2.5 w-2.5" /> Physical
                              </Badge>
                            )}
                            {(entry as any).notes_count > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                                <StickyNote className="h-2.5 w-2.5" /> {(entry as any).notes_count} note{(entry as any).notes_count > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {entry.quote && (
                        <blockquote className="border-l-2 border-primary/30 pl-4 mt-5 italic text-sm font-serif text-foreground/70 leading-relaxed">
                          "{entry.quote}"
                        </blockquote>
                      )}

                      {entry.reflection && (
                        <p className="text-sm font-serif text-foreground/60 leading-relaxed mt-4">{entry.reflection}</p>
                      )}

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/20">
                        <p className="text-[10px] text-muted-foreground/50 font-serif">
                          {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setMusingsBookId(entry.id)}
                            className="text-muted-foreground/50 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5"
                            title="Musings & Notes"
                          >
                            <MessageSquareQuote className="h-4 w-4" />
                          </button>
                          {shelves.length > 0 && (
                            <button
                              onClick={() => setAssignShelfBookId(entry.id)}
                              className="text-muted-foreground/50 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5"
                              title="Move to shelf"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleShare(entry)} className="text-muted-foreground/50 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5" title="Toggle visibility">
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/5" title="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {/* Add Book Dialog */}
      <AddToShelfDialog open={addOpen} onOpenChange={setAddOpen} userId={userId} />

      {/* CSV Import Dialog */}
      <BookCsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        userId={userId}
        shelves={shelves}
        onComplete={refetch}
      />

      {/* Musings Panel */}
      <BookMusingsPanel
        open={!!musingsBookId}
        onClose={() => setMusingsBookId(null)}
        bookEntryId={musingsBookId}
        bookTitle={musingsEntry?.title || ""}
        userId={userId}
      />

      {/* Create Shelf Dialog */}
      <Dialog open={shelfDialogOpen} onOpenChange={setShelfDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" /> Create a Shelf
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newShelfName}
              onChange={e => setNewShelfName(e.target.value.slice(0, 200))}
              placeholder="Shelf name…"
              className="font-serif"
              autoFocus
            />
            <Button onClick={handleCreateShelf} disabled={!newShelfName.trim()} className="w-full font-serif text-xs gap-1">
              <Plus className="h-3 w-3" /> Create Shelf
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Shelf Dialog */}
      <Dialog open={!!editingShelfId} onOpenChange={() => setEditingShelfId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Rename Shelf
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editingShelfName}
              onChange={e => setEditingShelfName(e.target.value.slice(0, 200))}
              className="font-serif"
              autoFocus
            />
            <Button onClick={handleRenameShelf} disabled={!editingShelfName.trim()} className="w-full font-serif text-xs">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Shelf Dialog */}
      <Dialog open={!!assignShelfBookId} onOpenChange={() => setAssignShelfBookId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" /> Move to Shelf
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full font-serif text-xs justify-start"
              onClick={() => assignShelfBookId && handleAssignShelf(assignShelfBookId, null)}
            >
              Unshelved
            </Button>
            {shelves.map(s => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full font-serif text-xs justify-start gap-2"
                onClick={() => assignShelfBookId && handleAssignShelf(assignShelfBookId, s.id)}
              >
                <FolderOpen className="h-3 w-3" /> {s.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Shelf header sub-component
const ShelfHeader = ({
  shelf,
  isCollapsed,
  bookCount,
  onToggle,
  onRename,
  onDelete,
  onShareShelf,
}: {
  shelf: Bookshelf | null;
  isCollapsed: boolean;
  bookCount: number;
  onToggle: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onShareShelf?: (vis: string) => void;
}) => (
  <div className="flex items-center gap-2 group py-1">
    <button onClick={onToggle} className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors touch-manipulation min-h-[44px]">
      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      <FolderOpen className="h-3.5 w-3.5 text-primary/60" />
      <span className="font-serif text-sm tracking-wide">{shelf?.name || "Unshelved"}</span>
    </button>
    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 font-serif">{bookCount}</Badge>
    {shelf && (
      <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {onShareShelf && (
          <Select onValueChange={(v) => onShareShelf(v)} defaultValue={shelf.visibility}>
            <SelectTrigger className="h-6 w-16 text-[9px] font-serif border-none bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private" className="text-[10px] font-serif">Private</SelectItem>
              <SelectItem value="circle" className="text-[10px] font-serif">Circle</SelectItem>
              <SelectItem value="tribe" className="text-[10px] font-serif">Tribe</SelectItem>
              <SelectItem value="public" className="text-[10px] font-serif">Public</SelectItem>
            </SelectContent>
          </Select>
        )}
        {onRename && (
          <button onClick={onRename} className="text-muted-foreground/40 hover:text-primary transition-colors p-1">
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-muted-foreground/40 hover:text-destructive transition-colors p-1">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    )}
  </div>
);

export default PersonalBookshelf;

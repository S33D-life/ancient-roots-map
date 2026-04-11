import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareQuote, Plus, StickyNote, Quote, BookOpen,
  Trash2, EyeOff, Eye, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBookNotes, type NoteType } from "@/hooks/use-book-notes";
import { toast } from "sonner";

interface BookMusingsPanelProps {
  open: boolean;
  onClose: () => void;
  bookEntryId: string | null;
  bookTitle: string;
  userId: string;
}

const noteTypeConfig: Record<NoteType, { icon: React.ReactNode; label: string; placeholder: string }> = {
  note: { icon: <StickyNote className="h-3 w-3" />, label: "Note", placeholder: "A thought about this book…" },
  quote: { icon: <Quote className="h-3 w-3" />, label: "Quote", placeholder: "A passage that stayed with you…" },
  reflection: { icon: <MessageSquareQuote className="h-3 w-3" />, label: "Reflection", placeholder: "What does this mean to you?" },
  musing: { icon: <BookOpen className="h-3 w-3" />, label: "Musing", placeholder: "A wandering thought inspired by this book…" },
};

const BookMusingsPanel = ({ open, onClose, bookEntryId, bookTitle, userId }: BookMusingsPanelProps) => {
  const { notes, loading, addNote, deleteNote } = useBookNotes(bookEntryId);
  const [adding, setAdding] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>("note");
  const [content, setContent] = useState("");
  const [pageRef, setPageRef] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addNote({
        user_id: userId,
        note_type: noteType,
        content: content.trim(),
        page_reference: pageRef.trim() || undefined,
        visibility,
      });
      toast.success("Musing added");
      setContent("");
      setPageRef("");
      setAdding(false);
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success("Note removed");
    } catch {
      toast.error("Failed to remove note");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif flex items-center gap-2 text-base">
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            Musings
          </SheetTitle>
          <p className="text-xs text-muted-foreground/60 font-serif italic truncate">{bookTitle}</p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Add button */}
          {!adding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding(true)}
              className="w-full font-serif text-xs gap-1 border-dashed border-primary/20"
            >
              <Plus className="h-3 w-3" /> Add a Musing
            </Button>
          )}

          {/* Add form */}
          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 rounded-xl border border-primary/20 p-4 bg-primary/5"
              >
                <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
                  <SelectTrigger className="h-8 text-xs font-serif">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(noteTypeConfig) as NoteType[]).map(t => (
                      <SelectItem key={t} value={t} className="text-xs font-serif">
                        <span className="flex items-center gap-1.5">
                          {noteTypeConfig[t].icon} {noteTypeConfig[t].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value.slice(0, 5000))}
                  placeholder={noteTypeConfig[noteType].placeholder}
                  rows={4}
                  className="font-serif text-sm bg-background/50 resize-none"
                  autoFocus
                />

                <div className="flex gap-2">
                  <Input
                    value={pageRef}
                    onChange={e => setPageRef(e.target.value.slice(0, 50))}
                    placeholder="Page (optional)"
                    className="font-serif text-xs flex-1 h-8"
                  />
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="h-8 w-24 text-[10px] font-serif">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private" className="text-[10px] font-serif">Heartwood</SelectItem>
                      <SelectItem value="circle" className="text-[10px] font-serif">Grove</SelectItem>
                      <SelectItem value="tribe" className="text-[10px] font-serif">Tree Circle</SelectItem>
                      <SelectItem value="public" className="text-[10px] font-serif">Forest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAdding(false)} className="font-serif text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAdd} disabled={!content.trim() || submitting} className="flex-1 font-serif text-xs">
                    {submitting ? "Saving…" : "Save Musing"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes list */}
          {loading ? (
            <div className="text-center py-8">
              <StickyNote className="h-6 w-6 text-muted-foreground/20 mx-auto animate-pulse" />
            </div>
          ) : notes.length === 0 && !adding ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground/50 font-serif">No musings yet</p>
              <p className="text-[10px] text-muted-foreground/40 font-serif">
                Notes, quotes, and reflections live here — personal and private by default.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border/30 p-3 space-y-2 bg-card/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {noteTypeConfig[note.note_type]?.icon}
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-serif">
                        {noteTypeConfig[note.note_type]?.label}
                      </Badge>
                      {note.page_reference && (
                        <span className="text-[9px] text-muted-foreground/50 font-serif">p. {note.page_reference}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/40">
                        {note.visibility === "private" ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                      </span>
                      <button onClick={() => handleDelete(note.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {note.note_type === "quote" ? (
                    <blockquote className="border-l-2 border-primary/30 pl-3 italic text-sm font-serif text-foreground/70 leading-relaxed">
                      "{note.content}"
                    </blockquote>
                  ) : (
                    <p className="text-sm font-serif text-foreground/70 leading-relaxed">{note.content}</p>
                  )}

                  <p className="text-[9px] text-muted-foreground/40 font-serif">
                    {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookMusingsPanel;

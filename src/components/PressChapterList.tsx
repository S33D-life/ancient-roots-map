/**
 * PressChapterList — Shows chapters of a living book with unlock status.
 * Tree-linked chapters show a locked/unlocked state based on visits.
 * "A new chapter has unfolded."
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, TreeDeciduous, MapPin, Plus, Trash2, ChevronDown, ChevronUp, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ChapterWithUnlock, PressChapter } from "@/hooks/use-press-chapters";
import { toast } from "sonner";

interface Props {
  chapters: ChapterWithUnlock[];
  isAuthor: boolean;
  onSave: (ch: Partial<PressChapter> & { id?: string }) => Promise<any>;
  onRemove: (id: string) => Promise<void>;
}

const UNLOCK_LABELS: Record<string, string> = {
  always_available: "Open",
  tree_visit_required: "Tree Visit",
  council_granted: "Council",
};

export default function PressChapterList({ chapters, isAuthor, onSave, onRemove }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // New chapter form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unlockMode, setUnlockMode] = useState<string>("always_available");
  const [linkedTreeId, setLinkedTreeId] = useState("");

  const resetForm = () => {
    setTitle("");
    setBody("");
    setUnlockMode("always_available");
    setLinkedTreeId("");
    setEditId(null);
  };

  const openEdit = (ch: ChapterWithUnlock) => {
    setTitle(ch.title);
    setBody(ch.body);
    setUnlockMode(ch.unlock_mode);
    setLinkedTreeId(ch.linked_tree_id || "");
    setEditId(ch.id);
    setAddOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are needed");
      return;
    }
    await onSave({
      id: editId || undefined,
      title: title.trim(),
      body: body.trim(),
      unlock_mode: unlockMode as any,
      linked_tree_id: linkedTreeId.trim() || null,
      chapter_order: editId ? undefined : chapters.length,
    });
    toast.success(editId ? "Chapter updated" : "Chapter added");
    resetForm();
    setAddOpen(false);
  };

  const handleDelete = async (id: string, chTitle: string) => {
    if (!confirm(`Remove chapter "${chTitle}"?`)) return;
    await onRemove(id);
    toast.success("Chapter removed");
  };

  if (chapters.length === 0 && !isAuthor) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xs tracking-[0.2em] text-muted-foreground/40 uppercase">
          Chapters
        </h3>
        {isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { resetForm(); setAddOpen(true); }}
            className="font-serif text-xs gap-1 h-7"
          >
            <Plus className="h-3 w-3" /> Add Chapter
          </Button>
        )}
      </div>

      {/* Chapter list */}
      <div className="space-y-2">
        {chapters.map((ch, idx) => {
          const isExpanded = expandedId === ch.id;
          const isLocked = !ch.unlocked;

          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              className="rounded-xl border border-border/15 overflow-hidden"
              style={{
                background: isLocked
                  ? "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.15))"
                  : "linear-gradient(135deg, hsl(var(--card) / 0.5), hsl(var(--card) / 0.3))",
              }}
            >
              <button
                type="button"
                onClick={() => !isLocked && setExpandedId(isExpanded ? null : ch.id)}
                disabled={isLocked}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors"
              >
                {/* Lock/unlock indicator */}
                <div className="shrink-0">
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground/30" />
                  ) : (
                    <Feather className="h-4 w-4 text-primary/50" />
                  )}
                </div>

                {/* Chapter info */}
                <div className="flex-1 min-w-0">
                  <span className={`font-serif text-sm ${isLocked ? "text-muted-foreground/40" : "text-foreground/80"}`}>
                    {isLocked ? `Chapter ${idx + 1}` : ch.title}
                  </span>
                  {ch.linked_tree_id && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <TreeDeciduous className="h-3 w-3 text-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/30 font-serif">
                        {isLocked ? "Visit to unlock" : "Tree-linked"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {ch.unlock_mode !== "always_available" && (
                    <Badge variant="outline" className="text-[9px] font-serif border-border/15">
                      {UNLOCK_LABELS[ch.unlock_mode]}
                    </Badge>
                  )}
                  {!isLocked && (
                    isExpanded
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/30" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && !isLocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 pt-1 border-t border-border/10">
                      {ch.epigraph && (
                        <p className="text-[11px] text-muted-foreground/40 font-serif italic mb-3 pl-3 border-l-2 border-primary/15">
                          "{ch.epigraph}"
                        </p>
                      )}
                      {ch.artwork_url && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img src={ch.artwork_url} alt="" className="w-full h-auto max-h-64 object-cover" />
                        </div>
                      )}
                      <div className="font-serif text-sm text-foreground/70 leading-[1.9] whitespace-pre-wrap">
                        {ch.body}
                      </div>

                      {/* Author actions */}
                      {isAuthor && (
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/10">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ch)} className="text-xs font-serif h-7">
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ch.id, ch.title)}
                            className="text-xs font-serif h-7 text-destructive/60 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Locked chapter hint */}
      {chapters.some((c) => !c.unlocked) && (
        <p className="text-[10px] text-muted-foreground/30 font-serif text-center italic">
          Some chapters unfold when you visit their Ancient Friend.
        </p>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { resetForm(); } setAddOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              {editId ? "Edit Chapter" : "Add Chapter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter title"
              className="font-serif"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Chapter body…"
              className="font-serif min-h-[200px] leading-[1.8]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground/50 font-serif mb-1 block">Unlock Mode</label>
                <Select value={unlockMode} onValueChange={setUnlockMode}>
                  <SelectTrigger className="h-8 text-xs font-serif">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always_available" className="text-xs font-serif">Open</SelectItem>
                    <SelectItem value="tree_visit_required" className="text-xs font-serif">Tree Visit Required</SelectItem>
                    <SelectItem value="council_granted" className="text-xs font-serif">Council Granted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/50 font-serif mb-1 block">Linked Tree ID (optional)</label>
                <Input
                  value={linkedTreeId}
                  onChange={(e) => setLinkedTreeId(e.target.value)}
                  placeholder="UUID"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)} className="font-serif text-xs h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="font-serif text-xs h-8">
                {editId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

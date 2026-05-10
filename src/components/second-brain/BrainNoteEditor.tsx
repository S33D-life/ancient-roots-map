import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, Globe, Lock, Tag, Plus, Trash2 } from "lucide-react";
import type { BrainNote } from "@/lib/brain/types";

interface Props {
  note: BrainNote;
  onSave: (patch: Partial<BrainNote>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

const BrainNoteEditor = ({ note, onSave, onCancel, onDelete, isSaving }: Props) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPublic, setIsPublic] = useState(note.is_public);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [tagInput, setTagInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  // Track dirty state
  useEffect(() => {
    dirty.current =
      title !== note.title ||
      content !== note.content ||
      isPublic !== note.is_public ||
      JSON.stringify(tags) !== JSON.stringify(note.tags);
  }, [title, content, isPublic, tags, note]);

  // Auto-save on unmount if dirty
  useEffect(() => {
    return () => {
      if (dirty.current) {
        onSave({ title, content, tags, is_public: isPublic });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(() => {
    dirty.current = false;
    onSave({ title, content, tags, is_public: isPublic });
  }, [title, content, tags, isPublic, onSave]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Keyboard shortcut: Ctrl/Cmd+S to save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
        style={{ borderColor: "hsl(var(--border) / 0.2)" }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif transition-all hover:scale-105"
          style={{
            background: "hsl(var(--primary) / 0.15)",
            color: "hsl(var(--primary))",
          }}
        >
          <Check className="w-3.5 h-3.5" />
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { dirty.current = false; onCancel(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif transition-all"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setIsPublic((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-serif border transition-all"
          style={{
            borderColor: "hsl(var(--border) / 0.3)",
            color: isPublic ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.6)",
          }}
          title={isPublic ? "Public note" : "Private note"}
        >
          {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isPublic ? "Public" : "Private"}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-all hover:bg-destructive/10"
            style={{ color: "hsl(var(--destructive) / 0.6)" }}
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title…"
        className="w-full px-4 pt-4 pb-2 text-xl font-serif bg-transparent border-none focus:outline-none"
        style={{ color: "hsl(var(--foreground))" }}
      />

      {/* Tags row */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
        <Tag className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: "hsl(var(--muted) / 0.5)",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            #{tag}
            <button onClick={() => removeTag(tag)}>
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTag}
          placeholder="add tag…"
          className="text-[11px] font-serif bg-transparent border-none focus:outline-none w-20 min-w-0"
          style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
        />
      </div>

      <div
        className="h-px mx-4"
        style={{ background: "hsl(var(--border) / 0.15)" }}
      />

      {/* Editor hint */}
      <p
        className="px-4 pt-2 text-[10px] font-serif italic"
        style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}
      >
        Markdown supported · Link notes with [[Note Title]] · Ctrl+S to save
      </p>

      {/* Content textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Begin writing… The forest remembers everything."
        className="flex-1 w-full px-4 py-3 bg-transparent border-none resize-none focus:outline-none text-sm font-mono leading-relaxed"
        style={{
          color: "hsl(var(--foreground) / 0.9)",
          minHeight: "200px",
        }}
      />
    </div>
  );
};

export default BrainNoteEditor;

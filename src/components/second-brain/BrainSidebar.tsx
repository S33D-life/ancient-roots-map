import { useState } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import type { BrainNote } from "@/lib/brain/types";
import BrainNoteCard from "./BrainNoteCard";

interface Props {
  notes: BrainNote[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (note: BrainNote) => void;
  onNew: (title?: string) => void;
}

const BrainSidebar = ({ notes, activeId, isLoading, onSelect, onNew }: Props) => {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  const filtered = notes.filter((n) => {
    const matchesQuery =
      !query ||
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase());
    const matchesTag = !activeTag || n.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });

  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{ borderColor: "hsl(var(--border) / 0.2)" }}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2 flex items-center gap-2">
        <h2
          className="font-serif text-xs tracking-[0.2em] uppercase flex-1"
          style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
        >
          Seeds
        </h2>
        <button
          onClick={() => onNew()}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: "hsl(var(--primary) / 0.15)",
            color: "hsl(var(--primary))",
          }}
          title="New note"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 relative">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="w-full pl-7 pr-7 py-1.5 rounded-lg border text-xs font-serif bg-transparent focus:outline-none focus:ring-1"
          style={{
            borderColor: "hsl(var(--border) / 0.3)",
            color: "hsl(var(--foreground))",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }} />
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="text-[10px] px-2 py-0.5 rounded-full border font-serif transition-all"
              style={{
                borderColor:
                  activeTag === tag
                    ? "hsl(var(--primary) / 0.5)"
                    : "hsl(var(--border) / 0.3)",
                background:
                  activeTag === tag ? "hsl(var(--primary) / 0.1)" : "transparent",
                color:
                  activeTag === tag
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.7)",
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
            />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="px-2 py-8 text-center">
            <p
              className="text-xs font-serif italic"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              {notes.length === 0
                ? "The forest mind is empty. Plant your first seed."
                : "No notes match your search."}
            </p>
          </div>
        )}
        {filtered.map((note) => (
          <BrainNoteCard
            key={note.id}
            note={note}
            isActive={note.id === activeId}
            onClick={() => onSelect(note)}
          />
        ))}
      </div>
    </aside>
  );
};

export default BrainSidebar;

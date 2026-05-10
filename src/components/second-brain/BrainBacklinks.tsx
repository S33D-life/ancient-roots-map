import { useMemo } from "react";
import { Link } from "lucide-react";
import type { BrainNote } from "@/lib/brain/types";
import { findBacklinks } from "@/lib/brain/wikilinks";

interface Props {
  note: BrainNote;
  allNotes: BrainNote[];
  onSelect: (note: BrainNote) => void;
}

const BrainBacklinks = ({ note, allNotes, onSelect }: Props) => {
  const otherNotes = useMemo(
    () => allNotes.filter((n) => n.id !== note.id),
    [allNotes, note.id],
  );

  const backlinks = useMemo(
    () => findBacklinks(note.title, otherNotes),
    [note.title, otherNotes],
  );

  return (
    <div
      className="border-t px-4 py-3 shrink-0"
      style={{ borderColor: "hsl(var(--border) / 0.15)" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Link className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
        <span
          className="text-[10px] font-serif tracking-[0.15em] uppercase"
          style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
        >
          Backlinks ({backlinks.length})
        </span>
      </div>

      {backlinks.length === 0 ? (
        <p
          className="text-[11px] font-serif italic"
          style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}
        >
          No other notes link here yet.
        </p>
      ) : (
        <div className="space-y-1">
          {backlinks.map(({ id, title }) => {
            const fullNote = allNotes.find((n) => n.id === id);
            return (
              <button
                key={id}
                onClick={() => fullNote && onSelect(fullNote)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-serif transition-all hover:bg-primary/10 flex items-center gap-2"
                style={{ color: "hsl(var(--primary) / 0.8)" }}
              >
                <span className="text-[10px] opacity-50">↗</span>
                {title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrainBacklinks;

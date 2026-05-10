import { formatDistanceToNow } from "date-fns";
import type { BrainNote } from "@/lib/brain/types";

interface Props {
  note: BrainNote;
  isActive: boolean;
  onClick: () => void;
}

const BrainNoteCard = ({ note, isActive, onClick }: Props) => {
  const excerpt = note.content.slice(0, 80).replace(/#+\s/g, "").trim();

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 group"
      style={{
        borderColor: isActive
          ? "hsl(var(--primary) / 0.4)"
          : "hsl(var(--border) / 0.2)",
        background: isActive
          ? "hsl(var(--primary) / 0.08)"
          : "hsl(var(--card) / 0.3)",
      }}
    >
      <p
        className="font-serif text-sm truncate"
        style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
      >
        {note.title}
      </p>
      {excerpt && (
        <p
          className="text-[11px] truncate mt-0.5 leading-relaxed"
          style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
        >
          {excerpt}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-[10px] font-serif"
          style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
        >
          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </span>
        {note.is_public && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full border font-serif"
            style={{
              borderColor: "hsl(var(--primary) / 0.3)",
              color: "hsl(var(--primary) / 0.7)",
            }}
          >
            public
          </span>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{
              background: "hsl(var(--muted) / 0.4)",
              color: "hsl(var(--muted-foreground) / 0.7)",
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
};

export default BrainNoteCard;

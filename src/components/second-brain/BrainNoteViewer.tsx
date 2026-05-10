import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Edit2, Globe, Lock, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BrainNote } from "@/lib/brain/types";
import { resolveWikilinks, buildWikilinkIndex } from "@/lib/brain/wikilinks";

interface Props {
  note: BrainNote;
  allNotes: BrainNote[];
  onEdit: () => void;
  isOwner: boolean;
}

const BrainNoteViewer = ({ note, allNotes, onEdit, isOwner }: Props) => {
  const navigate = useNavigate();

  const wikilinkIndex = useMemo(() => buildWikilinkIndex(allNotes), [allNotes]);

  const resolvedContent = useMemo(
    () => resolveWikilinks(note.content, wikilinkIndex),
    [note.content, wikilinkIndex],
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="flex items-start gap-3 px-6 pt-6 pb-3 border-b shrink-0"
        style={{ borderColor: "hsl(var(--border) / 0.15)" }}
      >
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-serif leading-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            {note.title}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span
              className="flex items-center gap-1 text-[11px] font-serif"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-serif"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              {note.is_public ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {note.is_public ? "Public" : "Private"}
            </span>
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full font-serif"
                style={{
                  background: "hsl(var(--muted) / 0.4)",
                  color: "hsl(var(--muted-foreground) / 0.7)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif border transition-all hover:scale-105 shrink-0"
            style={{
              borderColor: "hsl(var(--border) / 0.3)",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-4 min-h-0">
        {note.content ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert font-serif"
            style={{
              "--tw-prose-body": "hsl(var(--foreground) / 0.85)",
              "--tw-prose-headings": "hsl(var(--foreground))",
              "--tw-prose-links": "hsl(var(--primary))",
              "--tw-prose-code": "hsl(var(--foreground) / 0.9)",
              "--tw-prose-pre-bg": "hsl(var(--muted) / 0.4)",
            } as React.CSSProperties}
          >
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    onClick={(e) => {
                      if (href?.startsWith("/")) {
                        e.preventDefault();
                        navigate(href);
                      }
                    }}
                    className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {resolvedContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p
              className="text-sm font-serif italic"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              This seed is empty.
            </p>
            {isOwner && (
              <button
                onClick={onEdit}
                className="text-xs font-serif px-4 py-2 rounded-lg border transition-all hover:border-primary/50"
                style={{
                  borderColor: "hsl(var(--border) / 0.3)",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                Begin writing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainNoteViewer;

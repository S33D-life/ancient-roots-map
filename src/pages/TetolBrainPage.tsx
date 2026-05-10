/**
 * TetolBrainPage — /tetol-brain
 *
 * An Obsidian-style second brain for TETOL and TEOTAG.
 * Wanderers write personal markdown notes, link them with [[wikilinks]],
 * see backlinks between notes, and explore the graph of their forest mind.
 *
 * Layout: three-panel (sidebar | main | graph) on desktop,
 * stacked on mobile with a tab switcher.
 */
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Brain, Network, FileText, Plus, ArrowLeft, LogIn } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useBrainNotes,
  useCreateBrainNote,
  useUpdateBrainNote,
  useDeleteBrainNote,
} from "@/hooks/use-brain-notes";
import type { BrainNote } from "@/lib/brain/types";
import BrainSidebar from "@/components/second-brain/BrainSidebar";
import BrainNoteViewer from "@/components/second-brain/BrainNoteViewer";
import BrainNoteEditor from "@/components/second-brain/BrainNoteEditor";
import BrainBacklinks from "@/components/second-brain/BrainBacklinks";
import BrainNoteGraph from "@/components/second-brain/BrainNoteGraph";
import { useToast } from "@/hooks/use-toast";
import teotag from "@/assets/teotag-small.webp";

type RightPanel = "backlinks" | "graph";

const TetolBrainPage = () => {
  useDocumentTitle("TETOL — Second Brain");
  const { user } = useCurrentUser();
  const { data: notes = [], isLoading } = useBrainNotes();
  const createNote = useCreateBrainNote();
  const updateNote = useUpdateBrainNote();
  const deleteNote = useDeleteBrainNote();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const noteIdParam = searchParams.get("note");
  const newTitleParam = searchParams.get("new");

  const [activeNote, setActiveNote] = useState<BrainNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>("backlinks");
  const [mobilePanelView, setMobilePanelView] = useState<"list" | "note" | "graph">("list");

  // Sync active note from URL param
  useEffect(() => {
    if (noteIdParam && notes.length > 0) {
      const found = notes.find((n) => n.id === noteIdParam);
      if (found) {
        setActiveNote(found);
        setIsEditing(false);
        setMobilePanelView("note");
      }
    }
  }, [noteIdParam, notes]);

  // Handle ?new= param — open create flow
  useEffect(() => {
    if (newTitleParam && user) {
      handleNewNote(newTitleParam);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTitleParam, user]);

  const selectNote = useCallback(
    (note: BrainNote) => {
      setActiveNote(note);
      setIsEditing(false);
      setMobilePanelView("note");
      setSearchParams({ note: note.id });
    },
    [setSearchParams],
  );

  const handleNewNote = useCallback(
    async (prefillTitle?: string) => {
      if (!user) {
        toast({ title: "Sign in to create notes", variant: "destructive" });
        return;
      }
      try {
        const title = prefillTitle || "Untitled Seed";
        const note = await createNote.mutateAsync({ title });
        setActiveNote(note);
        setIsEditing(true);
        setMobilePanelView("note");
        setSearchParams({ note: note.id });
      } catch {
        toast({ title: "Couldn't create note", variant: "destructive" });
      }
    },
    [user, createNote, toast, setSearchParams],
  );

  const handleSave = useCallback(
    async (patch: Partial<BrainNote>) => {
      if (!activeNote) return;
      try {
        const updated = await updateNote.mutateAsync({ id: activeNote.id, patch });
        setActiveNote(updated);
        setIsEditing(false);
      } catch {
        toast({ title: "Couldn't save note", variant: "destructive" });
      }
    },
    [activeNote, updateNote, toast],
  );

  const handleDelete = useCallback(async () => {
    if (!activeNote) return;
    if (!confirm(`Delete "${activeNote.title}"?`)) return;
    try {
      await deleteNote.mutateAsync(activeNote.id);
      setActiveNote(null);
      setIsEditing(false);
      setSearchParams({});
    } catch {
      toast({ title: "Couldn't delete note", variant: "destructive" });
    }
  }, [activeNote, deleteNote, toast, setSearchParams]);

  const isOwner = !!(user && activeNote && user.id === activeNote.user_id);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Page Header */}
        <div
          className="px-4 md:px-6 py-4 border-b flex items-center gap-3 shrink-0"
          style={{
            borderColor: "hsl(var(--border) / 0.2)",
            background: "hsl(var(--card) / 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Link
            to="/"
            className="mr-1 p-1.5 rounded-lg transition-all hover:bg-primary/10"
            style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img src={teotag} alt="TEOTAG" className="w-7 h-7 rounded-full border border-primary/30" />
          <div>
            <h1
              className="font-serif text-base tracking-[0.15em]"
              style={{ color: "hsl(var(--foreground))" }}
            >
              TETOL Second Brain
            </h1>
            <p
              className="text-[10px] font-serif tracking-widest uppercase"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              The Forest Mind · {notes.length} {notes.length === 1 ? "seed" : "seeds"}
            </p>
          </div>

          <div className="flex-1" />

          {/* Right panel toggle */}
          <div
            className="hidden md:flex items-center gap-1 rounded-lg border p-0.5"
            style={{ borderColor: "hsl(var(--border) / 0.2)" }}
          >
            {(["backlinks", "graph"] as RightPanel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-serif capitalize transition-all"
                style={{
                  background:
                    rightPanel === panel ? "hsl(var(--primary) / 0.12)" : "transparent",
                  color:
                    rightPanel === panel
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.6)",
                }}
              >
                {panel === "backlinks" ? (
                  <FileText className="w-3 h-3" />
                ) : (
                  <Network className="w-3 h-3" />
                )}
                {panel}
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={() => handleNewNote()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif transition-all hover:scale-105"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New seed</span>
            </button>
          )}
        </div>

        {/* Auth gate */}
        {!user && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-16">
            <Brain
              className="w-10 h-10"
              style={{ color: "hsl(var(--primary) / 0.5)" }}
            />
            <p
              className="font-serif text-base text-center max-w-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              The forest mind awaits. Sign in to plant your first knowledge seed.
            </p>
            <Link
              to="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif text-sm transition-all hover:scale-105"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.3)",
              }}
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
          </div>
        )}

        {/* Main layout */}
        {user && (
          <>
            {/* Mobile tab bar */}
            <div
              className="md:hidden flex border-b shrink-0"
              style={{ borderColor: "hsl(var(--border) / 0.2)" }}
            >
              {(["list", "note", "graph"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMobilePanelView(v)}
                  className="flex-1 py-2 text-xs font-serif capitalize transition-all"
                  style={{
                    borderBottom:
                      mobilePanelView === v
                        ? "2px solid hsl(var(--primary))"
                        : "2px solid transparent",
                    color:
                      mobilePanelView === v
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.6)",
                  }}
                >
                  {v === "list" ? "Seeds" : v === "note" ? "Note" : "Graph"}
                </button>
              ))}
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* ── Sidebar ── */}
              <div
                className={`w-56 shrink-0 overflow-hidden ${mobilePanelView === "list" ? "flex" : "hidden"} md:flex flex-col`}
                style={{ minHeight: 0 }}
              >
                <BrainSidebar
                  notes={notes}
                  activeId={activeNote?.id ?? null}
                  isLoading={isLoading}
                  onSelect={selectNote}
                  onNew={handleNewNote}
                />
              </div>

              {/* ── Main note area ── */}
              <div
                className={`flex-1 overflow-hidden flex flex-col border-l ${mobilePanelView === "note" ? "flex" : "hidden"} md:flex`}
                style={{
                  borderColor: "hsl(var(--border) / 0.2)",
                  minHeight: 0,
                }}
              >
                {activeNote ? (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {isEditing ? (
                      <BrainNoteEditor
                        note={activeNote}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        onDelete={isOwner ? handleDelete : undefined}
                        isSaving={updateNote.isPending}
                      />
                    ) : (
                      <>
                        <BrainNoteViewer
                          note={activeNote}
                          allNotes={notes}
                          onEdit={() => setIsEditing(true)}
                          isOwner={isOwner}
                        />
                        {/* Backlinks inline (mobile: shown below note) */}
                        <div className="md:hidden">
                          <BrainBacklinks
                            note={activeNote}
                            allNotes={notes}
                            onSelect={selectNote}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    hasNotes={notes.length > 0}
                    onCreate={() => handleNewNote()}
                  />
                )}
              </div>

              {/* ── Right panel (desktop only) ── */}
              <div
                className={`w-56 shrink-0 border-l hidden md:flex flex-col overflow-hidden`}
                style={{
                  borderColor: "hsl(var(--border) / 0.2)",
                  minHeight: 0,
                }}
              >
                {rightPanel === "backlinks" ? (
                  activeNote ? (
                    <BrainBacklinks
                      note={activeNote}
                      allNotes={notes}
                      onSelect={selectNote}
                    />
                  ) : (
                    <RightPanelEmpty label="Select a note to see backlinks." />
                  )
                ) : (
                  <div className="flex-1 overflow-hidden p-2" style={{ minHeight: 0 }}>
                    <p
                      className="text-[10px] font-serif tracking-[0.15em] uppercase px-2 pt-2 pb-1"
                      style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
                    >
                      Forest Mind Graph
                    </p>
                    <BrainNoteGraph
                      notes={notes}
                      activeId={activeNote?.id ?? null}
                      onSelect={selectNote}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile graph view */}
            {mobilePanelView === "graph" && (
              <div className="md:hidden flex-1 p-4">
                <p
                  className="text-[10px] font-serif tracking-[0.15em] uppercase mb-2 text-center"
                  style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
                >
                  Forest Mind Graph
                </p>
                <BrainNoteGraph
                  notes={notes}
                  activeId={activeNote?.id ?? null}
                  onSelect={(n) => { selectNote(n); setMobilePanelView("note"); }}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

const EmptyState = ({
  hasNotes,
  onCreate,
}: {
  hasNotes: boolean;
  onCreate: () => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ background: "hsl(var(--primary) / 0.08)" }}
    >
      <Brain className="w-7 h-7" style={{ color: "hsl(var(--primary) / 0.5)" }} />
    </div>
    <p
      className="font-serif text-sm text-center max-w-xs"
      style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
    >
      {hasNotes
        ? "Select a seed from the left to begin reading."
        : "Your forest mind is ready to grow. Plant your first knowledge seed."}
    </p>
    {!hasNotes && (
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif text-sm transition-all hover:scale-105"
        style={{
          background: "hsl(var(--primary) / 0.12)",
          color: "hsl(var(--primary))",
          border: "1px solid hsl(var(--primary) / 0.25)",
        }}
      >
        <Plus className="w-4 h-4" />
        Plant first seed
      </button>
    )}
  </div>
);

const RightPanelEmpty = ({ label }: { label: string }) => (
  <div className="flex-1 flex items-center justify-center px-4">
    <p
      className="text-[11px] font-serif italic text-center"
      style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
    >
      {label}
    </p>
  </div>
);

export default TetolBrainPage;

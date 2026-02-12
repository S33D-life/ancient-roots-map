import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Music, TreePine, CheckCircle, Loader2, ArrowRight, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseAppleMusicInput } from "@/utils/appleMusicParser";
import Header from "@/components/Header";

type Step = "confirm" | "choose-tree" | "success";

interface DraftData {
  id?: string;
  trackUrl: string | null;
  trackId: string | null;
  title: string | null;
  artist: string | null;
  note: string;
}

interface TreeOption {
  id: string;
  name: string;
  species: string;
}

const IncomingSharePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("confirm");
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  // Tree selection
  const [treeSearch, setTreeSearch] = useState("");
  const [trees, setTrees] = useState<TreeOption[]>([]);
  const [searchingTrees, setSearchingTrees] = useState(false);
  const [selectedTree, setSelectedTree] = useState<TreeOption | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [resultOffering, setResultOffering] = useState<{ id: string; treeId: string; treeName: string } | null>(null);

  // Load draft or parse URL param
  useEffect(() => {
    const init = async () => {
      const draftId = params.get("draftId");
      const url = params.get("url");

      if (draftId) {
        const { data, error } = await supabase
          .from("draft_seeds")
          .select("*")
          .eq("id", draftId)
          .single();
        if (error || !data) {
          toast.error("Draft not found");
          setLoading(false);
          return;
        }
        setDraft({
          id: data.id,
          trackUrl: data.track_url,
          trackId: data.track_id,
          title: data.title,
          artist: data.artist,
          note: data.note || "",
        });
        setNote(data.note || "");
      } else if (url) {
        const parsed = parseAppleMusicInput(url);
        setDraft({
          trackUrl: parsed.url,
          trackId: parsed.trackId,
          title: parsed.title,
          artist: parsed.artist,
          note: "",
        });
      } else {
        toast.error("No URL or draft ID provided");
      }
      setLoading(false);
    };
    init();
  }, [params]);

  // Search trees
  useEffect(() => {
    if (treeSearch.trim().length < 2) {
      setTrees([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingTrees(true);
      const { data } = await supabase
        .from("trees")
        .select("id, name, species")
        .or(`name.ilike.%${treeSearch}%,species.ilike.%${treeSearch}%`)
        .limit(10);
      setTrees((data as TreeOption[]) || []);
      setSearchingTrees(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [treeSearch]);

  // Load some recent trees on mount for quick selection
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from("trees")
        .select("id, name, species")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data && treeSearch.trim().length < 2) setTrees(data as TreeOption[]);
    };
    if (step === "choose-tree") loadRecent();
  }, [step]);

  const handleConfirm = () => {
    if (!draft) return;
    setDraft({ ...draft, note });
    setStep("choose-tree");
  };

  const handleSubmit = async () => {
    if (!draft || !selectedTree) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to create an offering");
        setSubmitting(false);
        return;
      }

      // Create offering
      const content = [
        draft.artist || "Unknown Artist",
        draft.trackUrl ? `URL: ${draft.trackUrl}` : null,
        note.trim() ? note.trim() : null,
      ].filter(Boolean).join("\n");

      const { data: offering, error } = await supabase
        .from("offerings")
        .insert({
          tree_id: selectedTree.id,
          type: "song" as const,
          title: draft.title || "Shared Song",
          content,
          media_url: draft.trackUrl,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Update draft if it exists
      if (draft.id) {
        await supabase
          .from("draft_seeds")
          .update({ status: "completed", tree_id: selectedTree.id, offering_id: offering.id, note, updated_at: new Date().toISOString() })
          .eq("id", draft.id);
      }

      setResultOffering({ id: offering.id, treeId: selectedTree.id, treeName: selectedTree.name });
      setStep("success");
      toast.success("Offering created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create offering");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-lg mx-auto px-4 pt-24 pb-16 text-center space-y-4">
          <Music className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground/60 font-serif">No share data found</p>
          <Button onClick={() => navigate("/share-simulator")} variant="outline" className="font-serif text-xs">
            Go to Share Simulator
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-lg mx-auto px-4 pt-24 pb-16 space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground/50">
          <span className={step === "confirm" ? "text-primary" : ""}>1. Confirm</span>
          <ArrowRight className="h-3 w-3" />
          <span className={step === "choose-tree" ? "text-primary" : ""}>2. Choose Tree</span>
          <ArrowRight className="h-3 w-3" />
          <span className={step === "success" ? "text-primary" : ""}>3. Done</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Confirm Song */}
          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="font-serif text-xl text-primary">Confirm Song</h2>
              <Card className="border-border/30 bg-card/40">
                <CardContent className="p-4 space-y-3">
                  {draft.title && <p className="font-serif font-medium text-foreground/90">{draft.title}</p>}
                  {draft.artist && <p className="text-sm text-muted-foreground/70">{draft.artist}</p>}
                  {draft.trackUrl && (
                    <a href={draft.trackUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{draft.trackUrl}</span>
                    </a>
                  )}
                  {!draft.title && !draft.trackUrl && (
                    <p className="text-sm text-muted-foreground/50 italic">No song details parsed</p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-1.5">
                <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60">
                  Add a note (optional)
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Why does this song remind you of a tree?"
                  rows={2}
                  className="font-serif text-sm bg-secondary/10 border-border/30 resize-none"
                />
              </div>

              <Button onClick={handleConfirm} className="w-full font-serif tracking-wider gap-2">
                Choose Ancient Friend <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Choose Tree */}
          {step === "choose-tree" && (
            <motion.div key="tree" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="font-serif text-xl text-primary">Choose Ancient Friend</h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Search by name or species…"
                  className="pl-9 font-serif"
                  autoFocus
                />
              </div>

              <div className="max-h-[320px] overflow-y-auto space-y-1.5">
                {searchingTrees && <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-4" />}
                {!searchingTrees && trees.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground/50 font-serif py-4">No trees found</p>
                )}
                {trees.map((tree) => (
                  <button
                    key={tree.id}
                    onClick={() => setSelectedTree(tree)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTree?.id === tree.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/20 hover:bg-primary/5 hover:border-primary/20"
                    }`}
                  >
                    <p className="font-serif text-sm text-foreground/80">{tree.name}</p>
                    <p className="text-[11px] text-muted-foreground/50">{tree.species}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("confirm")} className="font-serif text-xs">Back</Button>
                <Button onClick={handleSubmit} disabled={!selectedTree || submitting} className="flex-1 font-serif tracking-wider gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {submitting ? "Creating…" : "Create Offering"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === "success" && resultOffering && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </motion.div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl text-primary">Offering Sealed</h2>
                <p className="text-sm text-muted-foreground/60 font-serif">
                  Song offered to {resultOffering.treeName}
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <Button onClick={() => navigate(`/tree/${resultOffering.treeId}`)} className="font-serif text-xs tracking-wider gap-2">
                  <TreePine className="h-4 w-4" /> View Ancient Friend
                </Button>
                <Button variant="outline" onClick={() => navigate("/share-simulator")} className="font-serif text-xs">
                  Share Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default IncomingSharePage;

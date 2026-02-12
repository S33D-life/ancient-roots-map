import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Bug, FileText, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

/* ---------- Feature Checklist ---------- */

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  status: "untested" | "pass" | "fail";
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "parse-clean", label: "Parse clean Apple Music URL", category: "Parsing", status: "untested" },
  { id: "parse-tracking", label: "Parse URL with tracking params", category: "Parsing", status: "untested" },
  { id: "parse-share-text", label: "Parse Apple Music share text", category: "Parsing", status: "untested" },
  { id: "parse-no-url", label: "Handle text with no URL gracefully", category: "Parsing", status: "untested" },
  { id: "parse-multi", label: "Pick Apple Music from multiple URLs", category: "Parsing", status: "untested" },
  { id: "parse-non-apple", label: "Graceful error for non-Apple URL", category: "Parsing", status: "untested" },
  { id: "sim-presets", label: "Simulator preset buttons populate input", category: "Share Simulator", status: "untested" },
  { id: "sim-parse-output", label: "Parsing output renders correctly", category: "Share Simulator", status: "untested" },
  { id: "sim-draft", label: "Create Draft Seed from simulator", category: "Share Simulator", status: "untested" },
  { id: "share-url-param", label: "Incoming share via ?url= param", category: "Incoming Share", status: "untested" },
  { id: "share-draft-param", label: "Incoming share via ?draftId= param", category: "Incoming Share", status: "untested" },
  { id: "share-choose-tree", label: "Search and select Ancient Friend", category: "Incoming Share", status: "untested" },
  { id: "share-create-offering", label: "Create offering from share flow", category: "Incoming Share", status: "untested" },
  { id: "share-success", label: "Success screen with tree link", category: "Incoming Share", status: "untested" },
  { id: "bookshelf-render", label: "Book shelf renders on tree detail", category: "Offerings", status: "untested" },
  { id: "bookshelf-expand", label: "Book spine expands to show detail", category: "Offerings", status: "untested" },
  { id: "genre-tags", label: "Genre browsing tags in book empty state", category: "Offerings", status: "untested" },
  { id: "idempotency", label: "Duplicate draft prevented within 30s", category: "Backend", status: "untested" },
  { id: "ingest-log", label: "Ingest log created on parse", category: "Backend", status: "untested" },
  { id: "docs-share-sheet", label: "Docs: iOS Share Sheet limitations", category: "Documentation", status: "untested" },
  { id: "docs-future", label: "Docs: Future path (Capacitor)", category: "Documentation", status: "untested" },
];

/* ---------- Bug Report ---------- */

interface BugReport {
  id: string;
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: string;
  status: string;
  created_at: string;
}

const SEVERITIES = ["low", "medium", "high", "critical"];

const TestLabPage = () => {
  // Checklist (local storage)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const stored = localStorage.getItem("s33d-test-checklist");
      return stored ? JSON.parse(stored) : INITIAL_CHECKLIST;
    } catch {
      return INITIAL_CHECKLIST;
    }
  });

  useEffect(() => {
    localStorage.setItem("s33d-test-checklist", JSON.stringify(checklist));
  }, [checklist]);

  const toggleStatus = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "untested" ? "pass" : item.status === "pass" ? "fail" : "untested" }
          : item
      )
    );
  };

  const resetChecklist = () => {
    setChecklist(INITIAL_CHECKLIST);
    toast.success("Checklist reset");
  };

  // Bug reports
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [bugForm, setBugForm] = useState({ title: "", steps: "", expected: "", actual: "", severity: "medium" });
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [submittingBug, setSubmittingBug] = useState(false);

  const loadBugs = async () => {
    setLoadingBugs(true);
    const { data } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setBugs((data as BugReport[]) || []);
    setLoadingBugs(false);
  };

  useEffect(() => {
    loadBugs();
  }, []);

  const submitBug = async () => {
    if (!bugForm.title.trim() || !bugForm.steps.trim() || !bugForm.expected.trim() || !bugForm.actual.trim()) {
      toast.error("Fill in all required fields");
      return;
    }
    setSubmittingBug(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to submit bug reports");
        setSubmittingBug(false);
        return;
      }
      const { error } = await supabase.from("bug_reports").insert({
        user_id: user.id,
        title: bugForm.title.trim().slice(0, 200),
        steps: bugForm.steps.trim().slice(0, 2000),
        expected: bugForm.expected.trim().slice(0, 1000),
        actual: bugForm.actual.trim().slice(0, 1000),
        severity: bugForm.severity,
      });
      if (error) throw error;
      toast.success("Bug report filed");
      setBugForm({ title: "", steps: "", expected: "", actual: "", severity: "medium" });
      loadBugs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingBug(false);
    }
  };

  const passCount = checklist.filter((c) => c.status === "pass").length;
  const failCount = checklist.filter((c) => c.status === "fail").length;
  const untestedCount = checklist.filter((c) => c.status === "untested").length;

  const categories = [...new Set(checklist.map((c) => c.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl text-primary tracking-wide">Test Lab</h1>
          <p className="text-sm text-muted-foreground/70 font-serif">QA checklist, bug tracker, and test summary</p>
        </div>

        <Tabs defaultValue="checklist">
          <TabsList className="w-full justify-start bg-card/40">
            <TabsTrigger value="checklist" className="font-serif text-xs">Checklist</TabsTrigger>
            <TabsTrigger value="bugs" className="font-serif text-xs">Bugs</TabsTrigger>
            <TabsTrigger value="summary" className="font-serif text-xs">Summary</TabsTrigger>
          </TabsList>

          {/* Checklist */}
          <TabsContent value="checklist" className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-xs font-serif">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{passCount} pass</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">{failCount} fail</Badge>
              <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border/30">{untestedCount} untested</Badge>
              <Button variant="ghost" size="sm" onClick={resetChecklist} className="ml-auto text-xs gap-1">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </div>

            {categories.map((cat) => (
              <div key={cat} className="space-y-1.5">
                <h3 className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/40">{cat}</h3>
                {checklist.filter((c) => c.category === cat).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleStatus(item.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/20 hover:bg-primary/5 transition-colors text-left"
                  >
                    {item.status === "pass" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : item.status === "fail" ? (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-sm font-serif ${item.status === "fail" ? "text-red-400" : "text-foreground/70"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            {/* Test Scripts */}
            <Card className="border-border/30 bg-card/40 mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Manual Test Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-serif text-foreground/60 space-y-4">
                <TestScript
                  title="Share Simulator → Draft Seed"
                  steps={[
                    "Navigate to /share-simulator",
                    "Click 'Clean URL' preset",
                    "Verify parsing output shows URL, track ID, medium+ confidence",
                    "Click 'Create Draft Seed'",
                    "Verify redirect to /incoming-share?draftId=…",
                  ]}
                />
                <TestScript
                  title="Incoming Share → Offering"
                  steps={[
                    "On /incoming-share confirm song step",
                    "Add an optional note",
                    "Click 'Choose Ancient Friend'",
                    "Search for a tree and select it",
                    "Click 'Create Offering'",
                    "Verify success screen and tree link works",
                  ]}
                />
                <TestScript
                  title="Book Shelf on Tree Detail"
                  steps={[
                    "Navigate to any tree with book offerings",
                    "Click 'Books' tab",
                    "Verify spines render with colors",
                    "Click a spine to expand detail card",
                    "Verify title, author, genre, quote display",
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bugs */}
          <TabsContent value="bugs" className="space-y-4 mt-4">
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm flex items-center gap-2">
                  <Bug className="h-4 w-4" /> File a Bug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={bugForm.title} onChange={(e) => setBugForm({ ...bugForm, title: e.target.value.slice(0, 200) })} placeholder="Bug title" className="font-serif text-sm" />
                <Textarea value={bugForm.steps} onChange={(e) => setBugForm({ ...bugForm, steps: e.target.value.slice(0, 2000) })} placeholder="Steps to reproduce" rows={2} className="font-serif text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <Textarea value={bugForm.expected} onChange={(e) => setBugForm({ ...bugForm, expected: e.target.value.slice(0, 1000) })} placeholder="Expected result" rows={2} className="font-serif text-sm resize-none" />
                  <Textarea value={bugForm.actual} onChange={(e) => setBugForm({ ...bugForm, actual: e.target.value.slice(0, 1000) })} placeholder="Actual result" rows={2} className="font-serif text-sm resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-serif">Severity</span>
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBugForm({ ...bugForm, severity: s })}
                      className={`text-[11px] font-serif px-2 py-1 rounded-full border transition-colors ${
                        bugForm.severity === s ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground/50 hover:border-primary/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button onClick={submitBug} disabled={submittingBug} className="w-full font-serif text-xs tracking-wider">
                  {submittingBug ? "Filing…" : "Submit Bug Report"}
                </Button>
              </CardContent>
            </Card>

            {/* Bug list */}
            <div className="space-y-2">
              {loadingBugs && <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />}
              {bugs.map((bug) => (
                <Card key={bug.id} className="border-border/20 bg-card/30">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-sm text-foreground/80">{bug.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className="text-[9px] px-1.5">{bug.severity}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5">{bug.status}</Badge>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/40">{new Date(bug.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
              {!loadingBugs && bugs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground/50 font-serif py-4">No bugs filed yet 🎉</p>
              )}
            </div>
          </TabsContent>

          {/* Summary */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm">What We Tested</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-serif text-foreground/60 space-y-2">
                <p>• <strong>Apple Music URL parsing</strong> — clean URLs, tracking params, share text, multi-URL, non-Apple, regional variants</p>
                <p>• <strong>Share Simulator</strong> — 6 presets, real-time parsing output, draft seed creation with idempotency</p>
                <p>• <strong>Incoming Share flow</strong> — URL and draft params, song confirmation, tree search/selection, offering creation, success links</p>
                <p>• <strong>Book Shelf</strong> — spine rendering, expand/collapse, genre badges, quote/reflection display</p>
                <p>• <strong>Genre browsing</strong> — tags in book offering empty state trigger catalog search</p>
                <p>• <strong>Backend integrity</strong> — seed_ingest_logs, draft_seeds, bug_reports tables with RLS</p>
                <p>• <strong>Documentation</strong> — iOS Share Sheet limitations, Capacitor future path</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm">Fixes + Improvements</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-serif text-foreground/60 space-y-2">
                <p>• Robust regex-based Apple Music parser with confidence scoring and error reporting</p>
                <p>• Tracking param stripping for cleaner stored URLs</p>
                <p>• 30-second idempotency window prevents duplicate draft seeds</p>
                <p>• All ingest attempts logged for debugging parse failures</p>
                <p>• Server-side RLS on all new tables (draft_seeds, bug_reports, seed_ingest_logs)</p>
                <p>• Input validation with character limits on all form fields</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm">Known Limitations + Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-serif text-foreground/60 space-y-2">
                <p>• <strong>No iOS Share Sheet</strong> — web apps cannot register as share targets in iOS. Requires Capacitor wrapper + Share Extension (native code).</p>
                <p>• <strong>No Apple Music API preview</strong> — title/artist extraction relies on share text, not API lookup. Future: add MusicKit JS integration.</p>
                <p>• <strong>Offerings inbox/outbox</strong> — current offerings are tree-centric; a user-centric inbox view requires additional query patterns.</p>
                <p>• <strong>Web Share Target API</strong> — works on Android/Chrome but not Safari. Could be added via PWA manifest for Android users.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const TestScript = ({ title, steps }: { title: string; steps: string[] }) => (
  <div className="space-y-1">
    <p className="font-medium text-foreground/70">{title}</p>
    <ol className="list-decimal list-inside space-y-0.5 text-foreground/50 pl-2">
      {steps.map((s, i) => <li key={i}>{s}</li>)}
    </ol>
  </div>
);

export default TestLabPage;

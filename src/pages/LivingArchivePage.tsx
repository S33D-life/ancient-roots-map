import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Shield, Lock, Upload, FileJson, FileText, Globe, ChevronDown, ChevronRight, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Key } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import PageShell from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  gatherArchiveData,
  downloadArchiveJSON,
  downloadEncryptedArchive,
  decryptArchive,
  verifyChecksum,
  generateArchiveSummary,
  type FullArchive,
  type ArchiveBranch,
} from "@/utils/archiveExport";
import heartwoodLanding from "@/assets/heartwood-landing.jpeg";

/* ─── Status icon helper ─── */
const StatusIcon = ({ status }: { status: ArchiveBranch["status"] }) => {
  if (status === "synced") return <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_4px_hsl(120_50%_50%/0.5)]" />;
  if (status === "partial") return <AlertTriangle className="w-4 h-4 text-amber-400 drop-shadow-[0_0_4px_hsl(40_80%_50%/0.5)]" />;
  return <XCircle className="w-4 h-4 text-red-400 drop-shadow-[0_0_4px_hsl(0_60%_50%/0.5)]" />;
};

/* ─── Root line for branch visualization ─── */
const RootLine = ({ status, index }: { status: ArchiveBranch["status"]; index: number }) => {
  const color = status === "synced" ? "hsl(120 50% 50%)" : status === "partial" ? "hsl(40 80% 55%)" : "hsl(0 60% 50%)";
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      className="absolute left-5 top-0 bottom-0 w-[2px] origin-top"
      style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
    />
  );
};

const LivingArchivePage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [archive, setArchive] = useState<FullArchive | null>(null);
  const [gathering, setGathering] = useState(false);
  const [gatherProgress, setGatherProgress] = useState(0);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [encryptPassword, setEncryptPassword] = useState("");
  const [showEncryptDialog, setShowEncryptDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState("");
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [sealing, setSealing] = useState(false);
  const [sealedCid, setSealedCid] = useState<string | null>(null);
  const [sealHistory, setSealHistory] = useState<Array<{ cid: string; date: string }>>([]);
  const [privacyScope, setPrivacyScope] = useState<Record<string, boolean>>({});
  const decryptInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
      setLoading(false);
    });
  }, [navigate]);

  const gatherData = useCallback(async () => {
    if (!userId) return;
    setGathering(true);
    setGatherProgress(0);
    // Simulate progress since queries are parallel
    const interval = setInterval(() => {
      setGatherProgress((p) => Math.min(p + 8, 90));
    }, 150);
    try {
      const data = await gatherArchiveData(userId);
      clearInterval(interval);
      setGatherProgress(100);
      setArchive(data);
      const scope: Record<string, boolean> = {};
      data.branches.forEach((b) => (scope[b.key] = true));
      setPrivacyScope(scope);
      toast.success("Archive gathered — all branches loaded.");
    } catch (err: any) {
      clearInterval(interval);
      console.error("Archive gather error:", err);
      toast.error("Failed to gather archive data.");
    } finally {
      setTimeout(() => {
        setGathering(false);
        setGatherProgress(0);
      }, 500);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) gatherData();
  }, [userId, gatherData]);

  const getFilteredArchive = useCallback((): FullArchive | null => {
    if (!archive) return null;
    return {
      ...archive,
      branches: archive.branches.filter((b) => privacyScope[b.key] !== false),
    };
  }, [archive, privacyScope]);

  const handleJSONExport = () => {
    const filtered = getFilteredArchive();
    if (!filtered) return;
    downloadArchiveJSON(filtered);
    toast.success("JSON archive downloaded.");
  };

  const handleEncryptedExport = async () => {
    if (!encryptPassword || encryptPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    const filtered = getFilteredArchive();
    if (!filtered) return;
    await downloadEncryptedArchive(filtered, encryptPassword);
    setShowEncryptDialog(false);
    setEncryptPassword("");
    toast.success("Encrypted archive downloaded.");
  };

  const handleDecryptImport = async () => {
    if (!decryptFile || !decryptPassword) return;
    try {
      const imported = await decryptArchive(decryptFile, decryptPassword);
      const valid = await verifyChecksum(imported);
      if (!valid) {
        toast.error("Checksum mismatch — archive may be corrupted.");
        return;
      }
      setArchive(imported);
      const scope: Record<string, boolean> = {};
      imported.branches.forEach((b) => (scope[b.key] = true));
      setPrivacyScope(scope);
      setShowDecryptDialog(false);
      setDecryptPassword("");
      setDecryptFile(null);
      toast.success(`Encrypted archive restored — ${imported.branches.reduce((s, b) => s + b.count, 0)} records verified.`);
    } catch {
      toast.error("Decryption failed — wrong passphrase or corrupted file.");
    }
  };

  const handleTextSummary = () => {
    const filtered = getFilteredArchive();
    if (!filtered) return;
    const summary = generateArchiveSummary(filtered);
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s33d-scroll-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Scroll of Path downloaded.");
  };

  const handleSealPath = async () => {
    const filtered = getFilteredArchive();
    if (!filtered) return;
    setSealing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("ipfs-sync", {
        body: {
          action: "pin_json",
          content: filtered,
          name: `s33d-archive-${new Date().toISOString().split("T")[0]}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      const { cid } = response.data;
      setSealedCid(cid);
      setSealHistory((prev) => [{ cid, date: new Date().toISOString() }, ...prev]);
      toast.success(`Path sealed to IPFS — CID: ${cid.slice(0, 12)}…`);
    } catch (err: any) {
      console.error("IPFS seal error:", err);
      toast.error("Failed to seal to IPFS. Check Pinata configuration.");
    } finally {
      setSealing(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported: FullArchive = JSON.parse(text);
      const valid = await verifyChecksum(imported);
      if (!valid) {
        toast.error("Checksum mismatch — archive may be corrupted.");
        return;
      }
      setArchive(imported);
      const scope: Record<string, boolean> = {};
      imported.branches.forEach((b) => (scope[b.key] = true));
      setPrivacyScope(scope);
      toast.success(`Archive restored — ${imported.branches.reduce((s, b) => s + b.count, 0)} records verified.`);
    } catch {
      toast.error("Invalid archive file.");
    }
  };

  const totalRecords = archive?.branches.reduce((s, b) => s + b.count, 0) ?? 0;
  const syncedBranches = archive?.branches.filter((b) => b.status === "synced").length ?? 0;
  const totalBranches = archive?.branches.length ?? 0;
  const enabledBranches = Object.values(privacyScope).filter(Boolean).length;

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src={heartwoodLanding} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <Header />

      <main className="container mx-auto px-4 pb-20 relative z-10" style={{ paddingTop: 'var(--content-top)' }}>
        <PageShell>
          <div className="max-w-4xl mx-auto space-y-6">
            <TetolBreadcrumb />

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                Living Archive Vault
              </h1>
              <p className="text-muted-foreground font-serif text-sm max-w-lg mx-auto">
                Your personal atlas — a sacred record of every tree mapped, every offering made, every heart earned.
                Digital sovereignty, preserved in roots.
              </p>
            </motion.div>

            {/* Progress during gathering */}
            {gathering && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <Progress value={gatherProgress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground font-serif">
                  Gathering your roots… {Math.round(gatherProgress)}%
                </p>
              </motion.div>
            )}

            {/* Integrity summary */}
            {archive && !gathering && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-primary/20 bg-card/60 backdrop-blur-md">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-serif text-primary">{totalRecords}</p>
                        <p className="text-xs text-muted-foreground">Total Records</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif text-primary">{totalBranches}</p>
                        <p className="text-xs text-muted-foreground">Data Branches</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif text-emerald-400">
                          {syncedBranches}/{totalBranches}
                        </p>
                        <p className="text-xs text-muted-foreground">Synced</p>
                      </div>
                    </div>
                    {enabledBranches < totalBranches && (
                      <p className="text-center text-xs text-amber-400/80 mt-3 font-serif">
                        {enabledBranches}/{totalBranches} branches enabled for export
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Root System */}
            {archive && !gathering && (
              <Card className="border-primary/15 bg-card/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-lg text-primary">Root System</CardTitle>
                    <Button variant="ghost" size="sm" onClick={gatherData} disabled={gathering}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${gathering ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                  <CardDescription className="font-serif text-xs">
                    Each branch represents a facet of your journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 pb-4">
                  <AnimatePresence>
                    {archive.branches.map((branch, i) => (
                      <motion.div
                        key={branch.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="relative"
                      >
                        <RootLine status={branch.status} index={i} />
                        <button
                          onClick={() => setExpandedBranch(expandedBranch === branch.key ? null : branch.key)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 pl-10 rounded-lg hover:bg-primary/5 transition-colors text-left group"
                        >
                          <span className="text-lg">{branch.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-sm text-foreground truncate">{branch.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {branch.count} records
                              {branch.lastUpdated && (
                                <> · {new Date(branch.lastUpdated).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                          <StatusIcon status={branch.status} />
                          <Switch
                            checked={privacyScope[branch.key] !== false}
                            onCheckedChange={(v) =>
                              setPrivacyScope((prev) => ({ ...prev, [branch.key]: v }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="ml-1"
                          />
                          {expandedBranch === branch.key ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedBranch === branch.key && branch.data.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-10 pr-4"
                            >
                              <div className="py-2 space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                                {branch.data.slice(0, 20).map((item: any, j: number) => (
                                  <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    <span className="truncate">
                                      {item.name || item.title || item.staff_code || item.species_family || item.heart_type || item.action_type || `Record ${j + 1}`}
                                    </span>
                                    {item.created_at && (
                                      <span className="ml-auto text-muted-foreground/60 shrink-0">
                                        {new Date(item.created_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {branch.data.length > 20 && (
                                  <p className="text-xs text-muted-foreground/50 py-1">
                                    +{branch.data.length - 20} more…
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {archive && !gathering && (
              <Card className="border-primary/15 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg text-primary">Export Your Path</CardTitle>
                  <CardDescription className="font-serif text-xs">
                    Choose how to preserve your journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:border-primary/40"
                      onClick={handleJSONExport}
                    >
                      <FileJson className="w-6 h-6 text-primary" />
                      <span className="font-serif text-sm">Structured JSON</span>
                      <span className="text-xs text-muted-foreground">Complete relational archive</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:border-primary/40"
                      onClick={handleTextSummary}
                    >
                      <FileText className="w-6 h-6 text-primary" />
                      <span className="font-serif text-sm">Scroll of Path</span>
                      <span className="text-xs text-muted-foreground">Human-readable summary</span>
                    </Button>

                    {/* Encrypted Download */}
                    <Dialog open={showEncryptDialog} onOpenChange={setShowEncryptDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:border-primary/40"
                        >
                          <Lock className="w-6 h-6 text-primary" />
                          <span className="font-serif text-sm">Encrypted Download</span>
                          <span className="text-xs text-muted-foreground">Password-protected archive</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-primary/20">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-primary">Encrypt Your Archive</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="font-serif text-sm">Passphrase</Label>
                            <Input
                              type="password"
                              value={encryptPassword}
                              onChange={(e) => setEncryptPassword(e.target.value)}
                              placeholder="Choose a strong passphrase…"
                              className="bg-background/50"
                            />
                            <p className="text-xs text-muted-foreground">
                              AES-256-GCM encryption. Keep this passphrase safe — it cannot be recovered.
                            </p>
                          </div>
                          <Button
                            onClick={handleEncryptedExport}
                            disabled={encryptPassword.length < 6}
                            className="w-full"
                            variant="mystical"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Seal & Download
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Seal Your Path — IPFS */}
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-primary/20 hover:border-primary/40 relative overflow-hidden"
                      onClick={handleSealPath}
                      disabled={sealing}
                    >
                      {sealing ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : sealedCid ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Globe className="w-6 h-6 text-primary" />
                      )}
                      <span className="font-serif text-sm">
                        {sealedCid ? "Re-seal to IPFS" : sealing ? "Weaving…" : "Seal to IPFS"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sealedCid ? `CID: ${sealedCid.slice(0, 12)}…` : "Pin to permanent web"}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seal History */}
            {sealHistory.length > 0 && (
              <Card className="border-primary/15 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg text-primary">Seal History</CardTitle>
                  <CardDescription className="font-serif text-xs">
                    IPFS snapshots of your path
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sealHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-md bg-primary/5">
                      <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      <code className="text-xs text-primary font-mono truncate flex-1">{entry.cid}</code>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(entry.cid);
                          toast.success("CID copied");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recovery */}
            {archive && !gathering && (
              <Card className="border-primary/15 bg-card/50 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg text-primary">Restore from Archive</CardTitle>
                  <CardDescription className="font-serif text-xs">
                    Import a previously exported archive to verify and review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* JSON import */}
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="archive-import"
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors text-sm font-serif text-muted-foreground"
                    >
                      <Upload className="w-4 h-4" />
                      Upload JSON Archive
                    </Label>
                    <input
                      id="archive-import"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportJSON}
                    />
                  </div>

                  {/* Encrypted import */}
                  <Dialog open={showDecryptDialog} onOpenChange={setShowDecryptDialog}>
                    <DialogTrigger asChild>
                      <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors text-sm font-serif text-muted-foreground">
                        <Key className="w-4 h-4" />
                        Decrypt Encrypted Archive (.s33d)
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-primary/20">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-primary">Decrypt Archive</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="font-serif text-sm">Encrypted File</Label>
                          <Input
                            ref={decryptInputRef}
                            type="file"
                            accept=".s33d"
                            onChange={(e) => setDecryptFile(e.target.files?.[0] || null)}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-serif text-sm">Passphrase</Label>
                          <Input
                            type="password"
                            value={decryptPassword}
                            onChange={(e) => setDecryptPassword(e.target.value)}
                            placeholder="Enter your passphrase…"
                            className="bg-background/50"
                          />
                        </div>
                        <Button
                          onClick={handleDecryptImport}
                          disabled={!decryptFile || decryptPassword.length < 6}
                          className="w-full"
                          variant="mystical"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Decrypt & Restore
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Loading state (first load only) */}
            {!archive && !gathering && (
              <div className="flex flex-col items-center gap-4 py-12">
                <p className="font-serif text-sm text-muted-foreground">No archive data available.</p>
                <Button onClick={gatherData} variant="sacred">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gather Roots
                </Button>
              </div>
            )}

            {/* Sealed confirmation */}
            <AnimatePresence>
              {sealedCid && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6"
                >
                  <p className="font-serif text-primary text-lg drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
                    ✦ Your path is woven into the Living Archive ✦
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PageShell>
      </main>

      <Footer />
    </div>
  );
};

export default LivingArchivePage;

import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, ChevronDown, Upload, X, Lightbulb, Bug, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CouncilSparkIcon from "@/components/CouncilSparkIcon";

const REPORT_TYPES = [
  { value: "bug", label: "🐞 Something isn't working", short: "🐞", desc: "Report a technical issue" },
  { value: "ux_improvement", label: "🌿 This could flow better", short: "🌿", desc: "Suggest a refinement" },
  { value: "insight", label: "🌞 I have an idea", short: "🌞", desc: "Propose an evolution" },
] as const;

const FEATURE_AREAS = [
  { value: "map", label: "Map" },
  { value: "atlas", label: "Atlas" },
  { value: "mint", label: "Mint" },
  { value: "hearts", label: "Hearts" },
  { value: "hearth", label: "Hearth / Dashboard" },
  { value: "heartwood", label: "Heartwood / Vault" },
  { value: "wishing_tree", label: "Wishing Tree" },
  { value: "time_tree", label: "Time Tree" },
  { value: "offerings", label: "Offerings" },
  { value: "council", label: "Council" },
  { value: "account", label: "Account" },
  { value: "radio", label: "Radio" },
  { value: "library", label: "Library" },
  { value: "groves", label: "Groves" },
  { value: "markets", label: "Markets" },
  { value: "other", label: "Other" },
] as const;

const SEVERITIES = [
  { value: "blocker", label: "🔴 Critical" },
  { value: "major", label: "🟠 Major" },
  { value: "minor", label: "🟡 Minor" },
  { value: "cosmetic", label: "🔵 Cosmetic" },
] as const;

const FREQUENCIES = [
  { value: "always", label: "Always" },
  { value: "sometimes", label: "Sometimes" },
  { value: "once", label: "Once" },
] as const;

const REWARD_HINTS: Record<string, string> = {
  bug: "Valid bugs earn 3–20 Hearts depending on severity",
  ux_improvement: "Accepted refinements earn 5–15 Hearts",
  insight: "High-value insights earn variable Hearts",
};

declare const __BUILD_ID__: string;

function getDeviceInfo() {
  return `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight} | ${navigator.language}`;
}

function getCapturedErrors(): string | null {
  try {
    const raw = sessionStorage.getItem("s33d-error-log");
    return raw || null;
  } catch { return null; }
}

function buildDiagnostics() {
  const errors = getCapturedErrors();
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "unknown";
  return {
    device: getDeviceInfo(),
    build: buildId,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    recent_errors: errors ? JSON.parse(errors) : [],
  };
}

function guessFeatureArea(path: string): string {
  if (path.startsWith("/map") || path.startsWith("/add-tree")) return "map";
  if (path.startsWith("/atlas")) return "atlas";
  if (path.startsWith("/dashboard") || path.startsWith("/hearth")) return "hearth";
  if (path.startsWith("/vault") || path.startsWith("/heartwood")) return "heartwood";
  if (path.startsWith("/time-tree")) return "time_tree";
  if (path.startsWith("/council")) return "council";
  if (path.startsWith("/library")) return "library";
  if (path.startsWith("/radio")) return "radio";
  if (path.startsWith("/groves")) return "groves";
  if (path.startsWith("/markets")) return "markets";
  if (path.startsWith("/golden-dream") || path.startsWith("/value-tree")) return "hearts";
  if (path.startsWith("/auth") || path.startsWith("/install")) return "account";
  return "other";
}

interface BugReportDialogProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const BugReportDialog = ({ trigger, defaultOpen, open: controlledOpen, onOpenChange }: BugReportDialogProps) => {
  const location = useLocation();
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    actual: "",
    expected: "",
    steps: "",
    suggestion: "",
    severity: "minor",
    frequency: "once",
    feature_area: guessFeatureArea(location.pathname),
    report_type: "bug",
    include_diagnostics: true,
  });

  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setForm({
      title: "",
      actual: "",
      expected: "",
      steps: "",
      suggestion: "",
      severity: "minor",
      frequency: "once",
      feature_area: guessFeatureArea(location.pathname),
      report_type: "bug",
      include_diagnostics: true,
    });
    setShowOptional(false);
    setScreenshots([]);
    setSubmitted(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size < 5 * 1024 * 1024 && f.type.startsWith("image/"));
    if (validFiles.length < files.length) toast.error("Only images under 5MB accepted");
    setScreenshots(prev => [...prev, ...validFiles].slice(0, 3));
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadScreenshots = async (userId: string): Promise<string[]> => {
    if (screenshots.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const file of screenshots) {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("bounty-screenshots").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("bounty-screenshots").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setUploading(false);
    return urls;
  };

  const submit = async () => {
    if (!form.title.trim() || !form.actual.trim()) {
      toast.error("Please fill in the title and description");
      return;
    }
    if (form.report_type === "bug" && !form.expected.trim()) {
      toast.error("Please describe what you expected");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to contribute");
        return;
      }

      const screenshotUrls = await uploadScreenshots(user.id);
      const diagnosticsData = form.include_diagnostics ? buildDiagnostics() : null;

      const payload: Record<string, unknown> = {
        user_id: user.id,
        title: form.title.trim().slice(0, 200),
        actual: form.actual.trim().slice(0, 2000),
        expected: form.expected.trim().slice(0, 1000) || "N/A",
        steps: form.steps.trim().slice(0, 2000) || "Not provided",
        suggestion: form.suggestion.trim().slice(0, 2000) || null,
        severity: form.severity,
        frequency: form.frequency,
        feature_area: form.feature_area,
        report_type: form.report_type,
        page_route: location.pathname,
        device_info: form.include_diagnostics ? getDeviceInfo() : null,
        diagnostics: diagnosticsData,
        include_diagnostics: form.include_diagnostics,
        app_version: typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : null,
        screenshot_urls: screenshotUrls,
        status: "new",
      };

      const { error } = await supabase.from("bug_reports").insert(payload as any);
      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("You've reached the daily limit (3 sparks). Try again tomorrow!");
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const typeIcon = form.report_type === "bug" ? Bug : form.report_type === "ux_improvement" ? Eye : Lightbulb;
  const TypeIcon = typeIcon;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 300); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <CouncilSparkIcon className="w-3.5 h-3.5" />
            Council Spark
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--primary) / 0.15)' }}>
              <CouncilSparkIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-serif text-lg text-foreground">Spark Planted ✨</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Thank you, Wanderer. Your spark will be reviewed and Hearts awarded when validated.
            </p>
            <div className="text-xs text-muted-foreground/60 bg-muted/30 rounded-lg p-3 max-w-xs mx-auto">
              <p className="font-medium text-primary/80 mb-1">{REWARD_HINTS[form.report_type]}</p>
              <p>Each refinement strengthens both the digital garden and the living one.</p>
            </div>
            <Button onClick={() => { reset(); setOpen(false); }} variant="outline" className="mt-2 font-serif">
              Close
            </Button>
          </motion.div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <CouncilSparkIcon className="w-5 h-5 text-primary" />
                Offer a Spark
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-serif italic">
                Help the garden flow more beautifully.
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Not everything is broken. Sometimes it simply wants to evolve.
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Report Type */}
              <div className="grid grid-cols-3 gap-2">
                {REPORT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update("report_type", t.value)}
                    className={`text-center p-2.5 rounded-lg border text-xs font-serif transition-all ${
                      form.report_type === t.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/40 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <div className="text-lg mb-0.5">{t.short}</div>
                    <div className="text-[10px] leading-tight">{t.value === "bug" ? "Not working" : t.value === "ux_improvement" ? "Flow better" : "Evolve this"}</div>
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="spark-title">Title *</Label>
                <Input
                  id="spark-title"
                  placeholder={form.report_type === "bug" ? "e.g. Map markers disappear on zoom" : form.report_type === "ux_improvement" ? "e.g. Tree card needs clearer CTA" : "e.g. Heart economy insight"}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="spark-actual">
                  {form.report_type === "bug" ? "What happened? *" : form.report_type === "ux_improvement" ? "What could flow better? *" : "What did you observe? *"}
                </Label>
                <Textarea
                  id="spark-actual"
                  placeholder={form.report_type === "bug" ? "Describe what went wrong…" : "Describe your observation…"}
                  value={form.actual}
                  onChange={(e) => update("actual", e.target.value)}
                  maxLength={2000}
                  className="min-h-[70px]"
                />
              </div>

              {/* Expected (required for bugs) */}
              {form.report_type === "bug" && (
                <div className="space-y-1.5">
                  <Label htmlFor="spark-expected">What did you expect? *</Label>
                  <Textarea
                    id="spark-expected"
                    placeholder="What should have happened instead…"
                    value={form.expected}
                    onChange={(e) => update("expected", e.target.value)}
                    maxLength={1000}
                    className="min-h-[60px]"
                  />
                </div>
              )}

              {/* Suggestion */}
              <div className="space-y-1.5">
                <Label htmlFor="spark-suggestion" className="flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Suggestion
                  <span className="text-muted-foreground/50 text-[10px]">(optional)</span>
                </Label>
                <Textarea
                  id="spark-suggestion"
                  placeholder="How would you improve this?"
                  value={form.suggestion}
                  onChange={(e) => update("suggestion", e.target.value)}
                  maxLength={2000}
                  className="min-h-[50px]"
                />
              </div>

              {/* Severity + Feature Area */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Severity *</Label>
                  <Select value={form.severity} onValueChange={(v) => update("severity", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="text-sm">{s.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Feature Area *</Label>
                  <Select value={form.feature_area} onValueChange={(v) => update("feature_area", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FEATURE_AREAS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Screenshot upload */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Screenshots
                  <span className="text-muted-foreground/50 text-[10px]">(up to 3)</span>
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {screenshots.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/40">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-0 right-0 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {screenshots.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Optional section toggle */}
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showOptional ? "rotate-180" : ""}`} />
                {showOptional ? "Hide" : "Show"} optional details
              </button>

              <AnimatePresence>
                {showOptional && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="spark-steps">Steps to reproduce</Label>
                      <Textarea
                        id="spark-steps"
                        placeholder="1. Go to…&#10;2. Click on…&#10;3. See error"
                        value={form.steps}
                        onChange={(e) => update("steps", e.target.value)}
                        maxLength={2000}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Reproducible?</Label>
                      <Select value={form.frequency} onValueChange={(v) => update("frequency", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="diagnostics" className="text-sm">Include diagnostic data</Label>
                      <Switch
                        id="diagnostics"
                        checked={form.include_diagnostics}
                        onCheckedChange={(c) => update("include_diagnostics", c)}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 -mt-2">
                      Page route, device info, screen size — helps us fix faster
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reward hint */}
              <div className="text-[10px] bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 text-primary/70 font-serif">
                ✨ {REWARD_HINTS[form.report_type]}
              </div>

              {/* Auto-captured context badge */}
              <div className="text-[10px] text-muted-foreground/50 bg-muted/30 rounded px-2 py-1.5 space-y-0.5">
                <div>📍 Route: <code className="text-[10px]">{location.pathname}</code></div>
                {typeof __BUILD_ID__ !== "undefined" && (
                  <div>🔧 Build: <code className="text-[10px]">{__BUILD_ID__}</code></div>
                )}
                {getCapturedErrors() && (
                  <div>⚠️ <span className="text-destructive/70">{JSON.parse(getCapturedErrors()!).length} recent error(s) will be attached</span></div>
                )}
              </div>

              {/* Submit */}
              <Button onClick={submit} disabled={submitting || uploading} className="w-full gap-2 font-serif">
                {submitting || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {uploading ? "Uploading…" : submitting ? "Planting spark…" : "Plant this Spark"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BugReportDialog;

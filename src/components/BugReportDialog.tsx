import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Loader2, ChevronDown } from "lucide-react";
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
  { value: "account", label: "Account" },
  { value: "radio", label: "Radio" },
  { value: "library", label: "Library" },
  { value: "groves", label: "Groves" },
  { value: "markets", label: "Markets" },
  { value: "other", label: "Other" },
] as const;

const SEVERITIES = [
  { value: "blocker", label: "🔴 Blocker", desc: "App is broken / unusable" },
  { value: "major", label: "🟠 Major", desc: "Feature doesn't work" },
  { value: "minor", label: "🟡 Minor", desc: "Works but wrong" },
  { value: "cosmetic", label: "🔵 Cosmetic", desc: "Visual issue" },
] as const;

const FREQUENCIES = [
  { value: "always", label: "Always" },
  { value: "sometimes", label: "Sometimes" },
  { value: "once", label: "Once" },
] as const;

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
  if (path.startsWith("/council")) return "offerings";
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
}

const BugReportDialog = ({ trigger, defaultOpen }: BugReportDialogProps) => {
  const location = useLocation();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const [form, setForm] = useState({
    title: "",
    actual: "",
    expected: "",
    steps: "",
    severity: "minor",
    frequency: "once",
    feature_area: guessFeatureArea(location.pathname),
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
      severity: "minor",
      frequency: "once",
      feature_area: guessFeatureArea(location.pathname),
      include_diagnostics: true,
    });
    setShowOptional(false);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.actual.trim() || !form.expected.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to report bugs");
        return;
      }

      const diagnosticsData = form.include_diagnostics ? buildDiagnostics() : null;

      const payload: Record<string, unknown> = {
        user_id: user.id,
        title: form.title.trim().slice(0, 200),
        actual: form.actual.trim().slice(0, 2000),
        expected: form.expected.trim().slice(0, 1000),
        steps: form.steps.trim().slice(0, 2000) || "Not provided",
        severity: form.severity,
        frequency: form.frequency,
        feature_area: form.feature_area,
        page_route: location.pathname,
        device_info: form.include_diagnostics ? getDeviceInfo() : null,
        diagnostics: diagnosticsData,
        include_diagnostics: form.include_diagnostics,
        app_version: typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : null,
        status: "new",
      };

      const { error } = await supabase.from("bug_reports").insert(payload as any);
      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("You've reached the daily limit of 3 bug reports. Try again tomorrow!");
        } else {
          throw error;
        }
        return;
      }

      toast.success("🐞 Bug report filed — thank you, Wanderer!");
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Bug className="w-3.5 h-3.5" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Report a Bug
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-title">Title *</Label>
            <Input
              id="bug-title"
              placeholder="e.g. Map markers disappear on zoom"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={200}
            />
          </div>

          {/* What happened */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-actual">What happened? *</Label>
            <Textarea
              id="bug-actual"
              placeholder="Describe what went wrong…"
              value={form.actual}
              onChange={(e) => update("actual", e.target.value)}
              maxLength={2000}
              className="min-h-[70px]"
            />
          </div>

          {/* What expected */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-expected">What did you expect? *</Label>
            <Textarea
              id="bug-expected"
              placeholder="What should have happened instead…"
              value={form.expected}
              onChange={(e) => update("expected", e.target.value)}
              maxLength={1000}
              className="min-h-[60px]"
            />
          </div>

          {/* Severity + Frequency row */}
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
              <Label>Frequency *</Label>
              <Select value={form.frequency} onValueChange={(v) => update("frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feature area */}
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
                  <Label htmlFor="bug-steps">Steps to reproduce</Label>
                  <Textarea
                    id="bug-steps"
                    placeholder="1. Go to…&#10;2. Click on…&#10;3. See error"
                    value={form.steps}
                    onChange={(e) => update("steps", e.target.value)}
                    maxLength={2000}
                    className="min-h-[80px]"
                  />
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
          <Button onClick={submit} disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
            {submitting ? "Filing…" : "File Bug Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportDialog;

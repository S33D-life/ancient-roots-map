/**
 * ConnectAgentWizard — 6-step wizard for registering agents in the Agent Garden.
 * Supports Research, Steward, and Council agent roles with connection modes.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronRight, Plus, Lock, Eye, FileEdit, ClipboardCheck } from "lucide-react";

const AGENT_ROLES = [
  {
    value: "research",
    label: "Research Agent",
    icon: "🔬",
    desc: "Reads datasets, proposes tree records, species links, atlas enrichments",
    examples: "Codex repo workflows · ChatGPT custom connectors · OpenClaw crawlers",
    defaultMode: "suggest_draft",
  },
  {
    value: "steward",
    label: "Steward Agent",
    icon: "🛡️",
    desc: "Reviews reports, flags duplicates, suggests metadata improvements",
    examples: "QA bots · Duplicate detectors · Data quality monitors",
    defaultMode: "review_queue",
  },
  {
    value: "council",
    label: "Council / Influence Agent",
    icon: "🏛️",
    desc: "Summarises inputs, drafts proposals, prepares governance review material",
    examples: "Summary agents · Proposal drafters · Voting assistants",
    defaultMode: "read_only",
  },
];

const CONNECTION_MODES = [
  {
    value: "read_only",
    label: "Read Only",
    icon: <Eye className="w-4 h-4" />,
    desc: "Can browse S33D data surfaces — trees, offerings, datasets, research forest",
    safe: true,
  },
  {
    value: "suggest_draft",
    label: "Suggest / Draft",
    icon: <FileEdit className="w-4 h-4" />,
    desc: "Can propose new records, enrichments, and corrections for human review",
    safe: true,
  },
  {
    value: "review_queue",
    label: "Review Queue",
    icon: <ClipboardCheck className="w-4 h-4" />,
    desc: "Can flag issues, suggest improvements, and queue items for curator review",
    safe: true,
  },
  {
    value: "controlled_action",
    label: "Controlled Action",
    icon: <Lock className="w-4 h-4" />,
    desc: "Future: verified writes with human approval gates. Not yet available.",
    safe: false,
  },
];

const AGENT_SPECIALIZATIONS = [
  { value: "crawler", label: "Crawler", icon: "🕷️", desc: "Discovers tree datasets online" },
  { value: "parser", label: "Dataset Parser", icon: "📄", desc: "Extracts structured tree data" },
  { value: "geocoder", label: "Geocoder", icon: "📍", desc: "Converts locations to coordinates" },
  { value: "classifier", label: "Species Classifier", icon: "🔬", desc: "Matches records to species" },
  { value: "deduplicator", label: "Duplicate Detector", icon: "👯", desc: "Identifies duplicate records" },
  { value: "enrichment", label: "Data Enrichment", icon: "✨", desc: "Adds metadata and context" },
  { value: "general", label: "Multi-Role", icon: "🤖", desc: "Performs multiple roles" },
];

const SCOPES = [
  { value: "local", label: "Local datasets", icon: "📌" },
  { value: "city", label: "City tree maps", icon: "🏙️" },
  { value: "regional", label: "Regional registries", icon: "🗺️" },
  { value: "national", label: "National datasets", icon: "🏛️" },
  { value: "species", label: "Species-specific", icon: "🌿" },
  { value: "global", label: "Global sources", icon: "🌍" },
];

export function ConnectAgentWizard({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    agent_role: "",
    connection_mode: "",
    agent_type: "general",
    agent_name: "",
    creator: "",
    description: "",
    specialization: "",
    registration_source: "marketplace",
    api_endpoint: "",
    scope: "national",
  });

  const canAdvance = () => {
    if (step === 1) return !!form.agent_role;
    if (step === 2) return !!form.connection_mode;
    if (step === 3) return !!form.agent_name.trim() && !!form.creator.trim();
    return true;
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in to register an agent"); return; }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("agent_profiles").insert({
      agent_name: form.agent_name.trim(),
      creator: form.creator.trim(),
      agent_type: form.agent_type,
      agent_role: form.agent_role,
      connection_mode: form.connection_mode,
      specialization: form.specialization.trim() || null,
      description: form.description.trim() || null,
      api_endpoint: form.api_endpoint.trim() || null,
      registration_source: form.registration_source,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to register agent"); return; }
    toast.success("Agent registered — welcome to the garden!");
    onSuccess();
    setStep(7);
  };

  const selectedRole = AGENT_ROLES.find(r => r.value === form.agent_role);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {Math.min(step, 7)} of 7</span>
          <span>{step === 7 ? "Complete" : step === 6 ? "Review & Activate" : ""}</span>
        </div>
        <Progress value={(Math.min(step, 7) / 7) * 100} className="h-2" />
      </div>

      {/* Step 1: Agent Role */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Choose Agent Role</h3>
            <p className="text-sm text-muted-foreground">What role will your agent play in the S33D ecosystem?</p>
          </div>
          <div className="space-y-3">
            {AGENT_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setForm({ ...form, agent_role: r.value, connection_mode: r.defaultMode })}
                className={`w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
                  form.agent_role === r.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/30 bg-card/40 hover:border-primary/30"
                }`}
              >
                <span className="text-3xl mt-0.5 shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  <p className="text-[10px] text-primary/60 mt-1 italic">{r.examples}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2: Connection Mode */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Connection Mode</h3>
            <p className="text-sm text-muted-foreground">How will this agent interact with S33D data?</p>
          </div>
          <div className="space-y-3">
            {CONNECTION_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => m.safe && setForm({ ...form, connection_mode: m.value })}
                disabled={!m.safe}
                className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  !m.safe
                    ? "border-border/20 bg-muted/10 opacity-50 cursor-not-allowed"
                    : form.connection_mode === m.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/30 bg-card/40 hover:border-primary/30"
                }`}
              >
                <div className="shrink-0 mt-0.5 text-primary">{m.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    {!m.safe && <Badge variant="outline" className="text-[10px]">Coming soon</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3: Identity */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Agent Identity</h3>
            <p className="text-sm text-muted-foreground">Tell us about your agent.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Agent Name *</Label>
              <Input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} placeholder="e.g. Oakweaver" />
            </div>
            <div>
              <Label className="text-xs">Creator / Builder *</Label>
              <Input value={form.creator} onChange={e => setForm({ ...form, creator: e.target.value })} placeholder="e.g. Your name or org" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do and how does it work?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Specialization</Label>
              <Select value={form.agent_type} onValueChange={v => setForm({ ...form, agent_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENT_SPECIALIZATIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Source</Label>
              <Select value={form.registration_source} onValueChange={v => setForm({ ...form, registration_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">S33D Internal</SelectItem>
                  <SelectItem value="marketplace">External / Marketplace</SelectItem>
                  <SelectItem value="codex">Codex / Dev Workflow</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT / Custom Connector</SelectItem>
                  <SelectItem value="openclaw">OpenClaw / Crawler</SelectItem>
                  <SelectItem value="partner">Partner Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">API Endpoint (optional)</Label>
            <Input type="url" value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} placeholder="https://..." />
          </div>
        </motion.div>
      )}

      {/* Step 4: Scope */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Contribution Scope</h3>
            <p className="text-sm text-muted-foreground">What kinds of datasets will your agent work with?</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SCOPES.map(s => (
              <button
                key={s.value}
                onClick={() => setForm({ ...form, scope: s.value })}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                  form.scope === s.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/30 bg-card/40 hover:border-primary/30"
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 5: Rules */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Permissions & Safety</h3>
            <p className="text-sm text-muted-foreground">How agent contributions are handled in S33D.</p>
          </div>
          <div className="space-y-3">
            {[
              { icon: "🔬", title: "Research Forest Only", desc: "Agents contribute exclusively to the Research Forest layer. Ancient Friends remain protected." },
              { icon: "👁️", title: "Human Review Required", desc: "All suggestions enter a review queue. Nothing is written to the system without human approval." },
              { icon: "🌳", title: "No Autonomous Minting", desc: "Agents cannot mint NFTrees. Mint-readiness checks and metadata preparation are supported." },
              { icon: "💚", title: "Hearts After Verification", desc: "S33D Heart rewards are awarded only after contribution passes verification." },
              { icon: "🔒", title: "Read-First, Review-First", desc: "New agents default to read-only or suggest/draft modes. Trust is earned through verified work." },
            ].map(rule => (
              <div key={rule.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-xl mt-0.5">{rule.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{rule.title}</p>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-foreground">Review & Activate</h3>
            <p className="text-sm text-muted-foreground">Confirm your agent configuration.</p>
          </div>
          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedRole?.icon || "🤖"}</span>
                <div>
                  <p className="text-sm font-serif font-semibold text-foreground">{form.agent_name || "Unnamed Agent"}</p>
                  <p className="text-xs text-muted-foreground">by {form.creator || "Unknown"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs capitalize">{selectedRole?.label || form.agent_role}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{CONNECTION_MODES.find(m => m.value === form.connection_mode)?.label || form.connection_mode}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{form.agent_type}</Badge>
                <Badge variant="secondary" className="text-xs capitalize">{form.scope}</Badge>
              </div>
              {form.description && <p className="text-xs text-muted-foreground">{form.description}</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 7: Success */}
      {step === 7 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
          <span className="text-5xl">🌱</span>
          <h3 className="text-xl font-serif text-foreground">Agent Registered!</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your agent has been planted in the garden. It will begin in <strong>{CONNECTION_MODES.find(m => m.value === form.connection_mode)?.label}</strong> mode 
            and can start contributing to the Research Forest.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="sacred" size="sm" onClick={() => { setStep(1); setForm({ agent_role: "", connection_mode: "", agent_type: "general", agent_name: "", creator: "", description: "", specialization: "", registration_source: "marketplace", api_endpoint: "", scope: "national" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Register Another
            </Button>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      {step < 7 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            Back
          </Button>
          {step < 6 ? (
            <Button variant="sacred" size="sm" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="sacred" size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Activating…" : "Activate Agent"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

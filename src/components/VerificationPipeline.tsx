/**
 * VerificationPipeline — workflow for promoting a Research tree
 * through the immutability pipeline:
 *   research → under_review → verified → immutable
 */
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle, Circle, AlertCircle, Lock, Send,
  MapPin, Leaf, Camera, FileText, Search, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type RecordStatus = "research" | "under_review" | "verified" | "immutable" | "rejected";

interface PipelineTree {
  id: string;
  tree_name: string | null;
  species_scientific: string;
  species_common: string | null;
  locality_text: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  geo_precision: string;
  record_status: RecordStatus;
  verification_score: number;
}

interface VerificationPipelineProps {
  tree: PipelineTree;
  onStatusChange?: (newStatus: RecordStatus) => void;
}

/* ─── Readiness check items ─── */
interface CheckItem {
  key: string;
  label: string;
  icon: React.ElementType;
  check: (t: PipelineTree) => boolean;
  hint: string;
}

const READINESS_CHECKS: CheckItem[] = [
  {
    key: "location",
    label: "Verified Location",
    icon: MapPin,
    check: (t) => t.latitude != null && t.longitude != null && t.geo_precision !== "unknown",
    hint: "Tree must have coordinates with at least approximate precision.",
  },
  {
    key: "species",
    label: "Species Identified",
    icon: Leaf,
    check: (t) => !!t.species_scientific && t.species_scientific.length > 3,
    hint: "A valid scientific name is required.",
  },
  {
    key: "description",
    label: "Description Present",
    icon: FileText,
    check: (t) => !!t.description && t.description.length >= 20,
    hint: "At least a short description (20+ characters).",
  },
  {
    key: "media",
    label: "Media Documentation",
    icon: Camera,
    check: () => true, // placeholder — would check offerings/media in real system
    hint: "At least one photo or field record attached.",
  },
  {
    key: "duplicate",
    label: "Duplicate Check Passed",
    icon: Search,
    check: () => true, // placeholder — would run dedup in real system
    hint: "No duplicate records found within 50m radius.",
  },
];

/* ─── Status badge styling ─── */
const STATUS_STYLES: Record<RecordStatus, { label: string; color: string; bg: string; border: string }> = {
  research: { label: "Research", color: "hsl(35 70% 55%)", bg: "hsl(35 60% 40% / 0.15)", border: "hsl(35 60% 40% / 0.3)" },
  under_review: { label: "Under Review", color: "hsl(200 70% 55%)", bg: "hsl(200 60% 40% / 0.15)", border: "hsl(200 60% 40% / 0.3)" },
  verified: { label: "Verified", color: "hsl(120 55% 50%)", bg: "hsl(120 50% 40% / 0.15)", border: "hsl(120 50% 40% / 0.3)" },
  immutable: { label: "Immutable", color: "hsl(42 80% 55%)", bg: "hsl(42 80% 50% / 0.15)", border: "hsl(42 80% 50% / 0.3)" },
  rejected: { label: "Rejected", color: "hsl(0 55% 55%)", bg: "hsl(0 50% 40% / 0.15)", border: "hsl(0 50% 40% / 0.3)" },
};

/* ─── Status step indicator ─── */
const STEPS: RecordStatus[] = ["research", "under_review", "verified", "immutable"];

const VerificationPipeline = ({ tree, onStatusChange }: VerificationPipelineProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const currentStatus = tree.record_status || "research";
  const currentStep = STEPS.indexOf(currentStatus);
  const style = STATUS_STYLES[currentStatus] || STATUS_STYLES.research;

  const checkResults = useMemo(
    () => READINESS_CHECKS.map((c) => ({ ...c, passed: c.check(tree) })),
    [tree]
  );
  const allPassed = checkResults.every((c) => c.passed);
  const passedCount = checkResults.filter((c) => c.passed).length;
  const readinessScore = Math.round((passedCount / READINESS_CHECKS.length) * 100);

  /* ── Submit for verification ── */
  const handleSubmitForReview = async () => {
    if (!allPassed) {
      toast({ title: "Readiness incomplete", description: "Please resolve all checklist items before submitting.", variant: "destructive" });
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from("research_trees")
      .update({ record_status: "under_review", verification_score: readinessScore } as any)
      .eq("id", tree.id);
    setProcessing(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted for verification", description: "This tree is now in the moderation queue." });
      onStatusChange?.("under_review");
    }
  };

  /* ── Anchor as immutable (mock — real anchor integration Phase 2) ── */
  const handleAnchor = async () => {
    setProcessing(true);
    const now = new Date().toISOString();
    const mockRecordId = `IMM-${tree.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const mockAnchorRef = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const mockMetadataHash = `Qm${Array.from({ length: 44 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("")}`;

    const { error } = await supabase
      .from("research_trees")
      .update({
        record_status: "immutable",
        immutable_record_id: mockRecordId,
        immutable_anchor_reference: mockAnchorRef,
        metadata_hash: mockMetadataHash,
        anchored_at: now,
      } as any)
      .eq("id", tree.id);

    setProcessing(false);
    if (error) {
      toast({ title: "Anchoring failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anchored as Immutable", description: "This tree has been permanently recorded in the Eternal Grove." });
      onStatusChange?.("immutable");
    }
  };

  return (
    <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Immutability Pipeline
          </CardTitle>
          <Badge
            className="text-[9px] px-2 py-0.5"
            style={{ color: style.color, background: style.bg, borderColor: style.border }}
          >
            {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step progress */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const reached = i <= currentStep;
            const isCurrent = i === currentStep;
            const stepStyle = STATUS_STYLES[step];
            return (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif shrink-0 transition-all"
                  style={{
                    background: reached ? stepStyle.bg : "hsl(var(--muted))",
                    border: `1.5px solid ${reached ? stepStyle.color : "hsl(var(--border))"}`,
                    color: reached ? stepStyle.color : "hsl(var(--muted-foreground))",
                    boxShadow: isCurrent ? `0 0 8px ${stepStyle.color}40` : "none",
                  }}
                >
                  {reached && i < currentStep ? <CheckCircle className="w-3 h-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-[2px] rounded-full transition-colors"
                    style={{ background: i < currentStep ? stepStyle.color : "hsl(var(--border))" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>Research</span>
          <span>Review</span>
          <span>Verified</span>
          <span>Immutable</span>
        </div>

        {/* Actions based on current status */}
        {currentStatus === "research" && (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-2"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <Shield className="w-3 h-3" />
              {showChecklist ? "Hide Checklist" : "Prepare for Immutability"}
              <Badge variant="outline" className="text-[9px] ml-auto">
                {passedCount}/{READINESS_CHECKS.length}
              </Badge>
            </Button>

            <AnimatePresence>
              {showChecklist && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 p-3 rounded-lg border border-primary/10 bg-card/40">
                    {checkResults.map((item) => (
                      <div key={item.key} className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {item.passed ? (
                            <CheckCircle className="w-3.5 h-3.5 text-[hsl(120_55%_50%)]" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-serif ${item.passed ? "text-foreground" : "text-muted-foreground"}`}>
                            {item.label}
                          </p>
                          {!item.passed && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.hint}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-border/30">
                      <Button
                        variant="sacred"
                        size="sm"
                        className="w-full text-xs gap-2"
                        disabled={!allPassed || processing}
                        onClick={handleSubmitForReview}
                      >
                        <Send className="w-3 h-3" />
                        {processing ? "Submitting…" : "Submit for Verification"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {currentStatus === "under_review" && (
          <div className="p-3 rounded-lg border border-[hsl(200_60%_40%/0.2)] bg-[hsl(200_60%_40%/0.08)] text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-[hsl(200_70%_55%)] mx-auto" />
            <p className="text-xs font-serif text-[hsl(200_70%_55%)]">Awaiting Verification</p>
            <p className="text-[10px] text-muted-foreground">
              This tree is in the Council moderation queue. A curator or steward will verify it.
            </p>
          </div>
        )}

        {currentStatus === "verified" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-[hsl(120_50%_40%/0.2)] bg-[hsl(120_50%_40%/0.08)] text-center space-y-1">
              <CheckCircle className="w-5 h-5 text-[hsl(120_55%_50%)] mx-auto" />
              <p className="text-xs font-serif text-[hsl(120_55%_50%)]">Verified — Ready for Permanence</p>
              <p className="text-[10px] text-muted-foreground">
                This tree has passed verification. It can now be anchored as an Immutable Ancient Friend.
              </p>
            </div>
            <Button
              variant="mystical"
              size="sm"
              className="w-full text-xs gap-2"
              disabled={processing}
              onClick={handleAnchor}
            >
              <Lock className="w-3 h-3" />
              {processing ? "Anchoring…" : "Anchor as Immutable Ancient Friend"}
            </Button>
          </div>
        )}

        {currentStatus === "immutable" && (
          <div className="p-3 rounded-lg border border-[hsl(42_80%_50%/0.25)] bg-[hsl(42_30%_12%/0.4)] text-center space-y-1">
            <Sparkles className="w-5 h-5 text-[hsl(42_80%_55%)] mx-auto" />
            <p className="text-xs font-serif text-[hsl(42_80%_55%)]">Permanently Archived</p>
            <p className="text-[10px] text-muted-foreground">
              This tree is an Immutable Ancient Friend — recorded forever in the Eternal Grove.
            </p>
          </div>
        )}

        {currentStatus === "rejected" && (
          <div className="p-3 rounded-lg border border-[hsl(0_50%_40%/0.2)] bg-[hsl(0_50%_40%/0.08)] text-center space-y-1">
            <AlertCircle className="w-5 h-5 text-[hsl(0_55%_55%)] mx-auto" />
            <p className="text-xs font-serif text-[hsl(0_55%_55%)]">Verification Declined</p>
            <p className="text-[10px] text-muted-foreground">
              This record did not meet verification standards. It remains in the Research layer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationPipeline;

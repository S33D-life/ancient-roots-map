/**
 * ConversionReviewPanel — Calm, informative panel showing
 * field mapping, completeness, warnings, and conversion actions.
 */
import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Circle, AlertTriangle, ArrowRight,
  ChevronDown, ChevronUp, Sparkles, Search, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import CompletenessRing from "./CompletenessRing";
import ConversionStatusBadge from "./ConversionStatusBadge";
import {
  type ConversionStatus,
  CONVERSION_STATUSES,
  getConversionStatus,
  calculateCompleteness,
  auditFieldMapping,
  buildTreeInsertPayload,
  haversineKm,
  type DuplicateCandidate,
  type CompletenessResult,
  type FieldMapping,
} from "@/utils/researchConversion";
import type { Database } from "@/integrations/supabase/types";

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];

interface ConversionReviewPanelProps {
  researchTree: ResearchTreeRow;
  onStatusChange?: (newStatus: ConversionStatus) => void;
  onConverted?: (newTreeId: string) => void;
}

const ConversionReviewPanel = ({ researchTree, onStatusChange, onConverted }: ConversionReviewPanelProps) => {
  const { toast } = useToast();
  const [showFieldMap, setShowFieldMap] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupChecked, setDupChecked] = useState(false);
  const [converting, setConverting] = useState(false);

  const status = getConversionStatus(researchTree);
  const completeness = useMemo(() => calculateCompleteness(researchTree), [researchTree]);
  const fieldMapping = useMemo(() => auditFieldMapping(researchTree), [researchTree]);

  const mappedCount = fieldMapping.filter((f) => f.status === "mapped" || f.status === "transformed").length;
  const missingCount = fieldMapping.filter((f) => f.status === "missing").length;

  /* ── Duplicate check ── */
  const handleDuplicateCheck = async () => {
    if (!researchTree.latitude || !researchTree.longitude) {
      toast({ title: "No coordinates", description: "Cannot check duplicates without location data." });
      return;
    }
    setDupLoading(true);
    setShowDuplicates(true);

    const lat = researchTree.latitude;
    const lng = researchTree.longitude;
    const radius = 0.01; // ~1.1km in degrees

    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .gte("latitude", lat - radius)
      .lte("latitude", lat + radius)
      .gte("longitude", lng - radius)
      .lte("longitude", lng + radius)
      .limit(10);

    const results: DuplicateCandidate[] = (data || [])
      .map((t) => ({
        id: t.id,
        name: t.name,
        species: t.species,
        distance_km: haversineKm(lat, lng, t.latitude!, t.longitude!),
        reason: t.species?.toLowerCase() === (researchTree.species_common || "").toLowerCase()
          ? "Same species nearby"
          : "Nearby tree",
      }))
      .filter((d) => d.distance_km < 0.5)
      .sort((a, b) => a.distance_km - b.distance_km);

    setDuplicates(results);
    setDupLoading(false);
    setDupChecked(true);
  };

  /* ── Mark as candidate ── */
  const handleMarkCandidate = async () => {
    const { error } = await supabase
      .from("research_trees")
      .update({ conversion_status: "candidate" } as any)
      .eq("id", researchTree.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as Candidate", description: "This tree is now a conversion candidate." });
      onStatusChange?.("candidate");
    }
  };

  /* ── Convert to Ancient Friend ── */
  const handleConvert = async () => {
    setConverting(true);

    // Build payload
    const payload = buildTreeInsertPayload(researchTree);

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      (payload as any).created_by = session.user.id;
    }

    // Insert into trees
    const { data: newTree, error: insertError } = await supabase
      .from("trees")
      .insert(payload as any)
      .select("id")
      .single();

    if (insertError || !newTree) {
      setConverting(false);
      toast({ title: "Conversion failed", description: insertError?.message || "Unknown error", variant: "destructive" });
      return;
    }

    // Update research_trees with link
    await supabase
      .from("research_trees")
      .update({
        conversion_status: "converted",
        converted_tree_id: newTree.id,
        linked_tree_id: newTree.id,
      } as any)
      .eq("id", researchTree.id);

    setConverting(false);
    toast({ title: "Ancient Friend Created", description: "This tree now has a full page in the living ledger." });
    onConverted?.(newTree.id);
    onStatusChange?.("converted");
  };

  const isConverted = status === "converted" || status === "featured";
  const canConvert = completeness.score >= 40 && !isConverted;

  return (
    <div className="space-y-5">
      {/* ── Header: Status + Completeness ── */}
      <div className="flex items-start gap-4">
        <CompletenessRing score={completeness.score} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ConversionStatusBadge status={status} />
            {completeness.score >= 80 && (
              <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">
                Ready for conversion
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-serif leading-relaxed">
            {CONVERSION_STATUSES[status].description}
          </p>
        </div>
      </div>

      {/* ── Missing fields / enrichment prompts ── */}
      {completeness.missingCritical.length > 0 && !isConverted && (
        <div
          className="rounded-xl border p-4 space-y-2"
          style={{
            borderColor: "hsl(var(--border) / 0.3)",
            background: "hsl(var(--card) / 0.4)",
          }}
        >
          <h4 className="text-xs font-serif uppercase tracking-[0.15em] text-muted-foreground">
            Next Best Steps
          </h4>
          {completeness.missingCritical.map((field) => (
            <div key={field.key} className="flex items-start gap-2 text-xs">
              <Circle className="h-3 w-3 mt-0.5 text-muted-foreground/50 shrink-0" />
              <div>
                <span className="text-foreground/80 font-serif">{field.label}</span>
                <span className="text-muted-foreground/60 ml-1">— {field.hint}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Category breakdown ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(completeness.byCategory).map(([cat, data]) => (
          <div
            key={cat}
            className="rounded-lg border p-2 text-center"
            style={{
              borderColor: data.passed === data.total
                ? "hsl(var(--primary) / 0.3)"
                : "hsl(var(--border) / 0.2)",
              background: "hsl(var(--card) / 0.3)",
            }}
          >
            <p className="text-xs font-serif text-foreground/80">
              {data.passed}/{data.total}
            </p>
            <p className="text-[9px] text-muted-foreground capitalize tracking-wider">
              {cat}
            </p>
          </div>
        ))}
      </div>

      {/* ── Field mapping audit (collapsible) ── */}
      <button
        onClick={() => setShowFieldMap(!showFieldMap)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-serif bg-transparent transition-colors hover:bg-card/50"
        style={{ borderColor: "hsl(var(--border) / 0.3)" }}
      >
        <span className="text-muted-foreground">
          Field Mapping — <span className="text-foreground">{mappedCount} mapped</span>, {missingCount} missing
        </span>
        {showFieldMap ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {showFieldMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-1">
              {fieldMapping.map((f) => (
                <div
                  key={f.treeField}
                  className="flex items-center gap-2 text-[11px] py-1.5 px-2 rounded"
                  style={{
                    background: f.status === "missing"
                      ? "hsl(var(--destructive) / 0.05)"
                      : "transparent",
                  }}
                >
                  {f.status === "mapped" || f.status === "transformed" ? (
                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="text-muted-foreground font-mono w-28 shrink-0 truncate">
                    {f.treeField}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />
                  <span className={`truncate ${f.status === "missing" ? "text-muted-foreground/50 italic" : "text-foreground/70"}`}>
                    {f.status === "missing"
                      ? "—"
                      : f.status === "transformed"
                      ? `${f.researchValue ?? "—"} (transformed)`
                      : String(f.researchValue ?? "—")}
                  </span>
                  {f.note && (
                    <span className="text-muted-foreground/40 text-[9px] ml-auto shrink-0">
                      {f.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Duplicate check ── */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs gap-2 font-serif"
        onClick={handleDuplicateCheck}
        disabled={dupLoading}
      >
        <Search className="h-3 w-3" />
        {dupLoading ? "Checking…" : dupChecked ? `Duplicates: ${duplicates.length} found` : "Check for Duplicates"}
      </Button>

      <AnimatePresence>
        {showDuplicates && dupChecked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {duplicates.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-serif text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                No duplicates found within 500m
              </div>
            ) : (
              <div className="space-y-2 px-1">
                {duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border text-xs"
                    style={{
                      borderColor: "hsl(var(--destructive) / 0.2)",
                      background: "hsl(var(--destructive) / 0.05)",
                    }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-foreground/80 truncate">{dup.name}</p>
                      <p className="text-muted-foreground">
                        {dup.species} · {(dup.distance_km * 1000).toFixed(0)}m away · {dup.reason}
                      </p>
                    </div>
                    <a
                      href={`/tree/${dup.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline shrink-0"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Actions ── */}
      {!isConverted && (
        <div className="flex flex-wrap gap-2 pt-2">
          {status === "research_only" && (
            <Button
              variant="outline"
              size="sm"
              className="font-serif text-xs gap-1.5"
              onClick={handleMarkCandidate}
            >
              🌱 Mark as Candidate
            </Button>
          )}
          {canConvert && (
            <Button
              size="sm"
              className="font-serif text-xs gap-1.5 glow-subtle"
              disabled={converting || (duplicates.length > 0 && !dupChecked)}
              onClick={handleConvert}
            >
              {converting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {converting ? "Converting…" : "Convert to Ancient Friend"}
            </Button>
          )}
        </div>
      )}

      {/* ── Converted state ── */}
      {isConverted && (
        <div
          className="rounded-xl border p-4 text-center space-y-2"
          style={{
            borderColor: "hsl(var(--primary) / 0.3)",
            background: "hsl(var(--primary) / 0.05)",
          }}
        >
          <Sparkles className="h-5 w-5 text-primary mx-auto" />
          <p className="text-xs font-serif text-primary">This tree is now an Ancient Friend</p>
          {(researchTree as any).converted_tree_id && (
            <a
              href={`/tree/${(researchTree as any).converted_tree_id}`}
              className="text-xs text-primary hover:underline font-serif"
            >
              View full page →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversionReviewPanel;

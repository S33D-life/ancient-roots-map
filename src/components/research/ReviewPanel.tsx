/**
 * ReviewPanel — Approve / reject / request-revision drawer for a staging entry.
 * Renders as a fixed bottom sheet when an entry is selected for review.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RotateCcw, X } from "lucide-react";
import { validateStagingEntry, hasBlockingViolations } from "@/lib/researchSafety";
import type { ResearchStagingEntry, ReviewAction } from "@/types/research";

interface Props {
  entry: ResearchStagingEntry | null;
  onDecide: (action: ReviewAction, notes: string, rejectionReason?: string) => void;
  onClose: () => void;
}

export default function ReviewPanel({ entry, onDecide, onClose }: Props) {
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (!entry) return null;

  const violations = validateStagingEntry(entry);
  const blocked = hasBlockingViolations(violations);

  function handleSubmit() {
    if (!action) return;
    onDecide(action, notes, action === "reject" ? rejectionReason : undefined);
    setAction(null);
    setNotes("");
    setRejectionReason("");
  }

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border shadow-2xl max-h-[70vh] overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                    Review entry
                  </p>
                  <h3 className="font-serif text-lg text-foreground">
                    {entry.common_name ?? entry.slug ?? "Entry"}
                    {entry.latin_name && (
                      <span className="ml-2 text-[13px] italic text-muted-foreground/70">{entry.latin_name}</span>
                    )}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                  aria-label="Close review panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Safety violations */}
              {violations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-serif uppercase tracking-widest text-muted-foreground/60">
                    Safety check ({violations.length} issue{violations.length !== 1 ? "s" : ""})
                  </p>
                  {violations.map((v, i) => (
                    <div
                      key={i}
                      className={`rounded-xl px-3 py-2 text-[12px] font-serif ${
                        v.severity === "error"
                          ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300"
                          : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
                      }`}
                    >
                      {v.severity === "error" ? "✗" : "⚠"} {v.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <ActionBtn
                  active={action === "approve"}
                  disabled={blocked}
                  onClick={() => setAction("approve")}
                  icon={<CheckCircle className="w-4 h-4" />}
                  label="Approve"
                  variant="green"
                  disabledTitle={blocked ? "Resolve safety errors before approving" : undefined}
                />
                <ActionBtn
                  active={action === "request_revision"}
                  onClick={() => setAction("request_revision")}
                  icon={<RotateCcw className="w-4 h-4" />}
                  label="Revise"
                  variant="amber"
                />
                <ActionBtn
                  active={action === "reject"}
                  onClick={() => setAction("reject")}
                  icon={<XCircle className="w-4 h-4" />}
                  label="Reject"
                  variant="red"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[11px] font-serif text-muted-foreground/70">
                  Reviewer notes {action === "approve" ? "(optional)" : "(required)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    action === "approve"
                      ? "Any notes for the record…"
                      : action === "reject"
                      ? "Why is this being rejected?"
                      : "What needs to change?"
                  }
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm font-serif text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {action === "reject" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-serif text-muted-foreground/70">
                    Rejection reason (for the agent log)
                  </label>
                  <input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. unsourced claims, incorrect taxonomy…"
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!action || (action !== "approve" && !notes.trim())}
                className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-serif font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {action === "approve"
                  ? "Approve & queue for promotion"
                  : action === "reject"
                  ? "Reject entry"
                  : action === "request_revision"
                  ? "Send back for revision"
                  : "Select an action above"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionBtn({
  active,
  disabled = false,
  onClick,
  icon,
  label,
  variant,
  disabledTitle,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "green" | "amber" | "red";
  disabledTitle?: string;
}) {
  const base = "flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-[12px] font-serif border transition-all";
  const styles: Record<typeof variant, { idle: string; active: string }> = {
    green: {
      idle:   "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300",
      active: "border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
    },
    amber: {
      idle:   "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300",
      active: "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    },
    red: {
      idle:   "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300",
      active: "border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabledTitle}
      className={`${base} ${active ? styles[variant].active : styles[variant].idle} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}

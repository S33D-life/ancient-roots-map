/**
 * InviterContext — subtle arrival acknowledgment for users who land via a shared link.
 * Shows a quiet, warm one-liner when ?ref=username is present.
 * Dismisses on tap. Fades after 10 seconds.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous } from "lucide-react";

interface InviterContextProps {
  /** The ref param from the URL or localStorage */
  refHandle: string | null;
  /** Optional context — e.g. "tree" or "offering" */
  context?: "tree" | "offering" | "grove" | "generic";
  /** Tree name for tree-specific context */
  treeName?: string;
}

const contextLines: Record<string, (handle: string, treeName?: string) => string> = {
  tree: (handle, treeName) =>
    treeName
      ? `@${handle} brought you to ${treeName}`
      : `@${handle} invited you here`,
  offering: (handle) => `@${handle} left something for you`,
  grove: (handle) => `@${handle} invited you to the forest`,
  generic: (handle) => `You arrived through @${handle}`,
};

const InviterContext = ({ refHandle, context = "generic", treeName }: InviterContextProps) => {
  const [visible, setVisible] = useState(!!refHandle);

  useEffect(() => {
    if (!refHandle) return;
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [refHandle]);

  if (!refHandle) return null;

  const line = (contextLines[context] || contextLines.generic)(refHandle, treeName);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={() => setVisible(false)}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 rounded-xl border border-primary/10 bg-primary/[0.03] text-center cursor-pointer hover:bg-primary/[0.05] transition-colors"
        >
          <TreeDeciduous className="w-3.5 h-3.5 text-primary/40 shrink-0" />
          <span className="text-[11px] font-serif text-foreground/50 tracking-wide">
            {line}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default InviterContext;

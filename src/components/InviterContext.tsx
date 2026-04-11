/**
 * InviterContext — subtle arrival acknowledgment for users who land via a shared link.
 * Shows a quiet, warm one-liner when ?ref=username is present.
 * Dismisses on tap. Fades after 10 seconds.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InviterContextProps {
  refHandle: string | null;
  context?: "tree" | "offering" | "grove" | "generic";
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
  const [treeCount, setTreeCount] = useState<number | null>(null);

  useEffect(() => {
    if (!refHandle) return;
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [refHandle]);

  // Fetch inviter's tree count for social proof
  useEffect(() => {
    if (!refHandle) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .ilike("full_name", `%${refHandle.replace(/-/g, " ")}%`)
        .limit(1)
        .maybeSingle();
      if (!data?.id) return;
      const { count } = await supabase
        .from("trees")
        .select("id", { count: "exact", head: true })
        .eq("created_by", data.id);
      if (count && count > 0) setTreeCount(count);
    })();
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
          className="w-full flex flex-col items-center gap-1 py-3 mb-4 rounded-xl border border-primary/10 bg-primary/[0.03] text-center cursor-pointer hover:bg-primary/[0.05] transition-colors"
        >
          <span className="flex items-center gap-2">
            <TreeDeciduous className="w-3.5 h-3.5 text-primary/40 shrink-0" />
            <span className="text-[11px] font-serif text-foreground/50 tracking-wide">
              {line}
            </span>
          </span>
          {treeCount && treeCount > 1 && (
            <span className="text-[10px] font-serif text-muted-foreground/40">
              They've walked with {treeCount} trees
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default InviterContext;

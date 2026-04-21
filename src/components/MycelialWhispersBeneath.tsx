/**
 * MycelialWhispersBeneath — Card shown on a tree page when group whispers
 * matching this tree's channel are waiting for the user.
 *
 * "A whisper waits for you beneath the roots"  →  tap to open
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { findOpenableAtTree, type MycelialWhisper, type MycelialWhisperRecipient } from "@/hooks/use-mycelial-whispers";
import MycelialWhisperOpenModal from "@/components/MycelialWhisperOpenModal";

interface Props {
  userId: string;
  treeId: string;
  treeSpecies: string;
}

export default function MycelialWhispersBeneath({ userId, treeId, treeSpecies }: Props) {
  const [rows, setRows] = useState<Array<MycelialWhisperRecipient & { whisper: MycelialWhisper }>>([]);
  const [openModal, setOpenModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId || !treeId) return;
    const speciesKey = (treeSpecies || "").toLowerCase().replace(/\s+/g, "_");
    const found = await findOpenableAtTree(userId, treeId, speciesKey);
    setRows(found);
  }, [userId, treeId, treeSpecies]);

  useEffect(() => { refresh(); }, [refresh]);

  if (rows.length === 0) return null;

  const active = rows[activeIndex];

  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onClick={() => { setActiveIndex(0); setOpenModal(true); }}
          className="w-full text-left rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex items-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary) / 0.15)" }}
          >
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-primary">
              A whisper waits for you beneath the roots
            </p>
            <p className="text-[11px] text-muted-foreground font-serif mt-0.5">
              {rows.length} mycelial whisper{rows.length !== 1 ? "s" : ""} ready to receive
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary/50 shrink-0" />
        </motion.button>
      </AnimatePresence>

      {active && (
        <MycelialWhisperOpenModal
          open={openModal}
          onOpenChange={(v) => {
            setOpenModal(v);
            if (!v) {
              // Move to next or refresh
              if (activeIndex < rows.length - 1) {
                setActiveIndex(i => i + 1);
                setTimeout(() => setOpenModal(true), 250);
              } else {
                refresh();
              }
            }
          }}
          whisper={active.whisper}
          currentTreeId={treeId}
          onOpened={refresh}
        />
      )}
    </>
  );
}

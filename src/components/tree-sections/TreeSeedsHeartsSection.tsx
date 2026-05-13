/**
 * TreeSeedsHeartsSection — groups Seeds (planting/sprouting/bloomed) and
 * Hearts (collectible windfall pool) into one alive, scannable section
 * placed near the top of the tree Overview tab.
 *
 * This is a presentational wrapper: it composes existing SeedPlanter and
 * TreeHeartPool components with a unified ceremonial header, so users
 * encounter the strongest engagement loop immediately on arriving at a tree.
 */
import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Sprout, Heart } from "lucide-react";

const SeedPlanter = lazy(() => import("@/components/SeedPlanter"));
const TreeHeartPool = lazy(() => import("@/components/TreeHeartPool"));

interface Props {
  treeId: string;
  treeLat: number | null;
  treeLng: number | null;
  treeSpecies: string | null;
  userId: string | null;
}

const TreeSeedsHeartsSection = ({ treeId, treeLat, treeLng, treeSpecies, userId }: Props) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card/60 to-accent/[0.04] backdrop-blur-sm"
      style={{
        boxShadow: "inset 0 0 40px hsl(var(--primary) / 0.04), 0 4px 20px -8px hsl(var(--primary) / 0.15)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="relative">
            <Sprout className="w-4 h-4 text-primary/80" />
            <Heart className="w-2.5 h-2.5 text-primary absolute -right-1 -bottom-0.5 fill-primary/40" />
          </div>
          <h3 className="text-sm font-serif tracking-[0.18em] uppercase text-foreground/85">
            Seeds &amp; Hearts
          </h3>
          <span
            aria-hidden
            className="ml-auto text-[10px] font-serif italic text-muted-foreground/60"
          >
            life growing here
          </span>
        </div>
        <p className="text-[11px] font-serif italic text-muted-foreground/70 leading-relaxed">
          Plant a seed beneath this tree. Tend what others have sown. Collect the hearts that bloom.
        </p>
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 pb-4 space-y-3">
        <Suspense fallback={null}>
          <TreeHeartPool treeId={treeId} userId={userId} />
        </Suspense>
        {/* Plant a Seed temporarily hidden */}
      </div>
    </motion.section>
  );
};

export default TreeSeedsHeartsSection;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Leaf, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryFilterDrawerProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  nameFilter: string;
  onNameChange: (val: string) => void;
  w3wFilter: string;
  onW3wChange: (val: string) => void;
  speciesFilter: string;
  onSpeciesChange: (val: string) => void;
  lineageFilter: string;
  onLineageChange: (val: string) => void;
  projectFilter: string;
  onProjectChange: (val: string) => void;
  staffFilter: string;
  onStaffChange: (val: string) => void;
  groveScaleFilter: string;
  onGroveScaleChange: (val: string) => void;
  nationFilter: string;
  onNationChange: (val: string) => void;
  uniqueSpecies: string[];
  uniqueLineages: string[];
  uniqueProjects: string[];
  uniqueNations: string[];
  staffCodes: string[];
  onClearAll: () => void;
}

const GROVE_SCALES = [
  { value: "hyper_local", label: "Hyper-Local" },
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "National" },
  { value: "bioregional", label: "Bioregional" },
  { value: "species", label: "Species" },
  { value: "lineage", label: "Lineage" },
];

const GalleryFilterDrawer = (props: GalleryFilterDrawerProps) => {
  const [open, setOpen] = useState(false);

  const activeCount = [
    props.searchQuery.trim() ? 1 : 0,
    props.nameFilter.trim() ? 1 : 0,
    props.w3wFilter.trim() ? 1 : 0,
    props.speciesFilter !== "all" ? 1 : 0,
    props.lineageFilter !== "all" ? 1 : 0,
    props.projectFilter !== "all" ? 1 : 0,
    props.staffFilter !== "all" ? 1 : 0,
    props.groveScaleFilter !== "all" ? 1 : 0,
    props.nationFilter !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const drawerProps = { ...props, onClose: () => setOpen(false), activeCount };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-serif transition-all duration-300 active:scale-95"
        style={{
          background: activeCount > 0
            ? "hsla(42, 70%, 50%, 0.15)"
            : "hsla(30, 20%, 15%, 0.6)",
          color: activeCount > 0
            ? "hsl(42, 80%, 60%)"
            : "hsl(var(--muted-foreground))",
          border: activeCount > 0
            ? "1px solid hsla(42, 60%, 50%, 0.3)"
            : "1px solid hsla(42, 40%, 30%, 0.3)",
        }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Refine Search</span>
        {activeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{
              background: "hsl(42, 80%, 50%)",
              color: "hsl(28, 30%, 10%)",
              boxShadow: "0 0 8px hsla(42, 80%, 50%, 0.5)",
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 z-[90]"
              style={{ background: "hsla(0, 0%, 0%, 0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setOpen(false)}
            />

            {/* Desktop: right panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 z-[95] w-[85vw] max-w-sm hidden md:flex flex-col"
              style={{
                background: "linear-gradient(180deg, hsl(28 20% 10%), hsl(22 18% 8%))",
                borderLeft: "1px solid hsla(42, 40%, 30%, 0.3)",
                boxShadow: "-8px 0 32px hsla(0, 0%, 0%, 0.4)",
              }}
            >
              <DrawerContent {...drawerProps} />
            </motion.div>

            {/* Mobile: slide up with swipe-to-close */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  setOpen(false);
                }
              }}
              className="fixed left-0 right-0 bottom-0 z-[95] max-h-[80vh] md:hidden flex flex-col rounded-t-2xl"
              style={{
                background: "linear-gradient(180deg, hsl(28 20% 10%), hsl(22 18% 8%))",
                borderTop: "1px solid hsla(42, 40%, 30%, 0.3)",
                boxShadow: "0 -8px 32px hsla(0, 0%, 0%, 0.4)",
                touchAction: "none",
              }}
            >
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full" style={{ background: "hsla(42, 30%, 40%, 0.4)" }} />
              </div>
              <div className="overflow-y-auto flex-1" style={{ touchAction: "pan-y" }}>
                <DrawerContent {...drawerProps} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Shared filter label ─── */
const FilterLabel = ({ children }: { children: React.ReactNode }) => (
  <label
    className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
    style={{ color: "hsl(42, 40%, 50%)" }}
  >
    {children}
  </label>
);

const inputStyle = {
  background: "hsla(28, 20%, 14%, 0.8)",
  borderColor: "hsla(42, 40%, 30%, 0.4)",
  color: "hsl(42, 55%, 65%)",
};

const selectTriggerStyle = {
  background: "hsla(28, 20%, 14%, 0.8)",
  borderColor: "hsla(42, 40%, 30%, 0.4)",
  color: "hsl(42, 55%, 62%)",
};

/* ─── Inner content shared by desktop & mobile drawers ─── */
function DrawerContent({
  onClose,
  activeCount,
  searchQuery,
  onSearchChange,
  nameFilter,
  onNameChange,
  w3wFilter,
  onW3wChange,
  speciesFilter,
  onSpeciesChange,
  lineageFilter,
  onLineageChange,
  projectFilter,
  onProjectChange,
  staffFilter,
  onStaffChange,
  groveScaleFilter,
  onGroveScaleChange,
  nationFilter,
  onNationChange,
  uniqueSpecies,
  uniqueLineages,
  uniqueProjects,
  uniqueNations,
  staffCodes,
  onClearAll,
}: GalleryFilterDrawerProps & { onClose: () => void; activeCount: number }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
          <h3 className="font-serif text-sm tracking-widest uppercase" style={{ color: "hsl(42, 60%, 60%)" }}>
            Refine Search
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-serif uppercase tracking-wider transition-colors hover:bg-white/5"
              style={{ color: "hsl(0, 60%, 60%)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors hover:bg-white/5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-5 flex-1">
        {/* Quick search (all fields) */}
        <div>
          <FilterLabel>Quick Search</FilterLabel>
          <Input
            placeholder="Search across all fields…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-serif text-sm"
            style={inputStyle}
          />
        </div>

        {/* Name */}
        <div>
          <FilterLabel>Name</FilterLabel>
          <Input
            placeholder="Filter by tree name…"
            value={nameFilter}
            onChange={(e) => onNameChange(e.target.value)}
            className="font-serif text-sm"
            style={inputStyle}
          />
        </div>

        {/* Species */}
        <div>
          <FilterLabel>Species</FilterLabel>
          <Select value={speciesFilter} onValueChange={onSpeciesChange}>
            <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
              <SelectValue placeholder="All Species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Species</SelectItem>
              {uniqueSpecies.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lineage */}
        {uniqueLineages.length > 0 && (
          <div>
            <FilterLabel>Lineage</FilterLabel>
            <Select value={lineageFilter} onValueChange={onLineageChange}>
              <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
                <SelectValue placeholder="All Lineages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lineages</SelectItem>
                {uniqueLineages.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* what3words */}
        <div>
          <FilterLabel>what3words</FilterLabel>
          <Input
            placeholder="e.g. ///filled.count.soap"
            value={w3wFilter}
            onChange={(e) => onW3wChange(e.target.value)}
            className="font-serif text-sm font-mono"
            style={inputStyle}
          />
        </div>

        {/* Project */}
        {uniqueProjects.length > 0 && (
          <div>
            <FilterLabel>Project</FilterLabel>
            <Select value={projectFilter} onValueChange={onProjectChange}>
              <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Staff */}
        {staffCodes.length > 0 && (
          <div>
            <FilterLabel>Staff</FilterLabel>
            <Select value={staffFilter} onValueChange={onStaffChange}>
              <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
                <SelectValue placeholder="All Staffs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staffs</SelectItem>
                {staffCodes.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ─── Scaffolded Future Filters ─── */}
        <div className="pt-2 border-t" style={{ borderColor: "hsla(42, 30%, 25%, 0.3)" }}>
          <p className="text-[9px] font-serif uppercase tracking-widest mb-3" style={{ color: "hsl(42, 30%, 40%)" }}>
            Advanced
          </p>

          {/* Grove Scale */}
          <div className="mb-4">
            <FilterLabel>Grove Scale</FilterLabel>
            <Select value={groveScaleFilter} onValueChange={onGroveScaleChange}>
              <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
                <SelectValue placeholder="All Scales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scales</SelectItem>
                {GROVE_SCALES.map((gs) => (
                  <SelectItem key={gs.value} value={gs.value}>{gs.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nation */}
          {uniqueNations.length > 0 && (
            <div className="mb-4">
              <FilterLabel>Nation</FilterLabel>
              <Select value={nationFilter} onValueChange={onNationChange}>
                <SelectTrigger className="font-serif text-sm" style={selectTriggerStyle}>
                  <SelectValue placeholder="All Nations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nations</SelectItem>
                  {uniqueNations.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Placeholder: Age range (coming soon) */}
          <div className="mb-4 opacity-40 pointer-events-none">
            <FilterLabel>Estimated Age</FilterLabel>
            <Input
              placeholder="Coming soon…"
              disabled
              className="font-serif text-sm"
              style={inputStyle}
            />
          </div>

          {/* Placeholder: Bioregion (coming soon) */}
          <div className="opacity-40 pointer-events-none">
            <FilterLabel>Bioregion</FilterLabel>
            <Input
              placeholder="Coming soon…"
              disabled
              className="font-serif text-sm"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GalleryFilterDrawer;

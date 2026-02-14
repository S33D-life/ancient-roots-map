import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryFilterDrawerProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  speciesFilter: string;
  onSpeciesChange: (val: string) => void;
  lineageFilter: string;
  onLineageChange: (val: string) => void;
  projectFilter: string;
  onProjectChange: (val: string) => void;
  staffFilter: string;
  onStaffChange: (val: string) => void;
  uniqueSpecies: string[];
  uniqueLineages: string[];
  uniqueProjects: string[];
  staffCodes: string[];
}

const GalleryFilterDrawer = ({
  searchQuery,
  onSearchChange,
  speciesFilter,
  onSpeciesChange,
  lineageFilter,
  onLineageChange,
  projectFilter,
  onProjectChange,
  staffFilter,
  onStaffChange,
  uniqueSpecies,
  uniqueLineages,
  uniqueProjects,
  staffCodes,
}: GalleryFilterDrawerProps) => {
  const [open, setOpen] = useState(false);

  const activeCount = [
    searchQuery.trim() ? 1 : 0,
    speciesFilter !== "all" ? 1 : 0,
    lineageFilter !== "all" ? 1 : 0,
    projectFilter !== "all" ? 1 : 0,
    staffFilter !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

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

            {/* Drawer — right on desktop, bottom on mobile */}
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
              <DrawerContent
                onClose={() => setOpen(false)}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                speciesFilter={speciesFilter}
                onSpeciesChange={onSpeciesChange}
                lineageFilter={lineageFilter}
                onLineageChange={onLineageChange}
                projectFilter={projectFilter}
                onProjectChange={onProjectChange}
                staffFilter={staffFilter}
                onStaffChange={onStaffChange}
                uniqueSpecies={uniqueSpecies}
                uniqueLineages={uniqueLineages}
                uniqueProjects={uniqueProjects}
                staffCodes={staffCodes}
              />
            </motion.div>

            {/* Mobile: slide up from bottom with swipe-to-close */}
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
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full" style={{ background: "hsla(42, 30%, 40%, 0.4)" }} />
              </div>
              <div className="overflow-y-auto flex-1" style={{ touchAction: "pan-y" }}>
                <DrawerContent
                  onClose={() => setOpen(false)}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  speciesFilter={speciesFilter}
                  onSpeciesChange={onSpeciesChange}
                  lineageFilter={lineageFilter}
                  onLineageChange={onLineageChange}
                  projectFilter={projectFilter}
                  onProjectChange={onProjectChange}
                  staffFilter={staffFilter}
                  onStaffChange={onStaffChange}
                  uniqueSpecies={uniqueSpecies}
                  uniqueLineages={uniqueLineages}
                  uniqueProjects={uniqueProjects}
                  staffCodes={staffCodes}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* Inner content shared by desktop & mobile drawers */
function DrawerContent({
  onClose,
  searchQuery,
  onSearchChange,
  speciesFilter,
  onSpeciesChange,
  lineageFilter,
  onLineageChange,
  projectFilter,
  onProjectChange,
  staffFilter,
  onStaffChange,
  uniqueSpecies,
  uniqueLineages,
  uniqueProjects,
  staffCodes,
}: {
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  speciesFilter: string;
  onSpeciesChange: (v: string) => void;
  lineageFilter: string;
  onLineageChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  staffFilter: string;
  onStaffChange: (v: string) => void;
  uniqueSpecies: string[];
  uniqueLineages: string[];
  uniqueProjects: string[];
  staffCodes: string[];
}) {
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
        <button
          onClick={onClose}
          className="p-1.5 rounded-full transition-colors hover:bg-white/5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 pb-8 space-y-5 flex-1">
        {/* Search */}
        <div>
          <label
            className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
            style={{ color: "hsl(42, 40%, 50%)" }}
          >
            Search
          </label>
          <Input
            placeholder="Search by name, species, or what3words…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-serif text-sm"
            style={{
              background: "hsla(28, 20%, 14%, 0.8)",
              borderColor: "hsla(42, 40%, 30%, 0.4)",
              color: "hsl(42, 55%, 65%)",
            }}
          />
        </div>

        {/* Species */}
        <div>
          <label
            className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
            style={{ color: "hsl(42, 40%, 50%)" }}
          >
            Species
          </label>
          <Select value={speciesFilter} onValueChange={onSpeciesChange}>
            <SelectTrigger
              className="font-serif text-sm"
              style={{
                background: "hsla(28, 20%, 14%, 0.8)",
                borderColor: "hsla(42, 40%, 30%, 0.4)",
                color: "hsl(42, 55%, 62%)",
              }}
            >
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
            <label
              className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
              style={{ color: "hsl(42, 40%, 50%)" }}
            >
              Lineage
            </label>
            <Select value={lineageFilter} onValueChange={onLineageChange}>
              <SelectTrigger
                className="font-serif text-sm"
                style={{
                  background: "hsla(28, 20%, 14%, 0.8)",
                  borderColor: "hsla(42, 40%, 30%, 0.4)",
                  color: "hsl(42, 55%, 62%)",
                }}
              >
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

        {/* Project */}
        {uniqueProjects.length > 0 && (
          <div>
            <label
              className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
              style={{ color: "hsl(42, 40%, 50%)" }}
            >
              Project
            </label>
            <Select value={projectFilter} onValueChange={onProjectChange}>
              <SelectTrigger
                className="font-serif text-sm"
                style={{
                  background: "hsla(28, 20%, 14%, 0.8)",
                  borderColor: "hsla(42, 40%, 30%, 0.4)",
                  color: "hsl(42, 55%, 62%)",
                }}
              >
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
            <label
              className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block"
              style={{ color: "hsl(42, 40%, 50%)" }}
            >
              Staff
            </label>
            <Select value={staffFilter} onValueChange={onStaffChange}>
              <SelectTrigger
                className="font-serif text-sm"
                style={{
                  background: "hsla(28, 20%, 14%, 0.8)",
                  borderColor: "hsla(42, 40%, 30%, 0.4)",
                  color: "hsl(42, 55%, 62%)",
                }}
              >
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
      </div>
    </div>
  );
}

export default GalleryFilterDrawer;

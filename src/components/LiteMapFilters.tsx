import { useState, useMemo, useCallback } from "react";
import { Filter, X, ChevronDown, Leaf } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFamilyForSpecies } from "@/data/treeSpecies";

export type LitePerspective = "collective" | "personal" | "tribe";

const STAFF_SPECIES: { key: string; species: string; image: string }[] = [
  { key: "ald", species: "Alder", image: "/images/staffs/ald.jpeg" },
  { key: "app", species: "Apple", image: "/images/staffs/app.jpeg" },
  { key: "ash", species: "Ash", image: "/images/staffs/ash.jpeg" },
  { key: "bee", species: "Beech", image: "/images/staffs/bee.jpeg" },
  { key: "bir", species: "Birch", image: "/images/staffs/bir.jpeg" },
  { key: "cher", species: "Cherry", image: "/images/staffs/cher.jpeg" },
  { key: "haw", species: "Hawthorn", image: "/images/staffs/haw.jpeg" },
  { key: "haz", species: "Hazel", image: "/images/staffs/haz.jpeg" },
  { key: "hol", species: "Holly", image: "/images/staffs/hol.jpeg" },
  { key: "oak", species: "Oak", image: "/images/staffs/oak.jpeg" },
  { key: "pine", species: "Pine", image: "/images/staffs/pine.jpeg" },
  { key: "row", species: "Rowan", image: "/images/staffs/row.jpeg" },
  { key: "syc", species: "Sycamore", image: "/images/staffs/syc.jpeg" },
  { key: "wil", species: "Willow", image: "/images/staffs/wil.jpeg" },
  { key: "yew", species: "Yew", image: "/images/staffs/yew.jpeg" },
];

const PERSPECTIVES: { key: LitePerspective; label: string; icon: string }[] = [
  { key: "collective", label: "TETOL", icon: "🌍" },
  { key: "personal", label: "Mine", icon: "🌿" },
  { key: "tribe", label: "Tribe", icon: "👥" },
];

interface LiteMapFiltersProps {
  species: string;
  onSpeciesChange: (s: string) => void;
  perspective: LitePerspective;
  onPerspectiveChange: (p: LitePerspective) => void;
  speciesCounts: Record<string, number>;
  totalVisible: number;
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  background: active ? "hsla(42, 80%, 50%, 0.2)" : "hsla(30, 30%, 12%, 0.88)",
  color: active ? "hsl(42, 80%, 60%)" : "hsl(42, 55%, 58%)",
  border: `1px solid ${active ? "hsla(42, 70%, 50%, 0.5)" : "hsla(42, 40%, 30%, 0.4)"}`,
  backdropFilter: "blur(6px)",
  boxShadow: active ? "0 0 8px hsla(42, 70%, 50%, 0.15)" : "0 1px 4px rgba(0,0,0,0.2)",
});

const LiteMapFilters = ({
  species,
  onSpeciesChange,
  perspective,
  onPerspectiveChange,
  speciesCounts,
  totalVisible,
}: LiteMapFiltersProps) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);

  const speciesWithFamilies = useMemo(
    () =>
      STAFF_SPECIES.map((s) => ({
        ...s,
        family: getFamilyForSpecies(s.species) || "Other",
      })),
    []
  );

  const availableFamilies = useMemo(() => {
    const fams = new Map<string, number>();
    for (const s of speciesWithFamilies) {
      const count = speciesCounts[s.species.toLowerCase()] || 0;
      if (count > 0) {
        fams.set(s.family, (fams.get(s.family) || 0) + count);
      }
    }
    return Array.from(fams.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [speciesWithFamilies, speciesCounts]);

  const availableSpecies = useMemo(
    () =>
      speciesWithFamilies.filter((s) => {
        const hasCount = (speciesCounts[s.species.toLowerCase()] || 0) > 0;
        const matchesFamily = !familyFilter || s.family === familyFilter;
        return hasCount && matchesFamily;
      }),
    [speciesWithFamilies, speciesCounts, familyFilter]
  );

  const handleSpeciesSelect = useCallback((s: string) => {
    onSpeciesChange(s);
    setPanelOpen(false);
  }, [onSpeciesChange]);

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center gap-1.5 animate-fade-in">
        {/* Perspective chips */}
        {PERSPECTIVES.map((p) => (
          <button
            key={p.key}
            onClick={() => onPerspectiveChange(p.key)}
            className="shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95"
            style={chipStyle(perspective === p.key)}
          >
            {p.icon} {p.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Active species chip or filter toggle */}
        {species !== "all" ? (
          <button
            onClick={() => onSpeciesChange("all")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95"
            style={chipStyle(true)}
          >
            {species} <X className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95"
            style={chipStyle(panelOpen)}
          >
            <Filter className="w-3 h-3" /> Staff
          </button>
        )}

        {/* Count badge */}
        <span
          className="shrink-0 tabular-nums px-2 py-1 rounded-full text-[10px] font-serif transition-all duration-300"
          style={{
            background: "hsla(30, 30%, 12%, 0.8)",
            color: "hsl(42, 50%, 55%)",
            border: "1px solid hsla(42, 40%, 30%, 0.3)",
          }}
        >
          {totalVisible}
        </span>
      </div>

      {/* Perspective label — subtle context indicator */}
      {perspective !== "collective" && (
        <div
          className="absolute top-12 left-2 z-[1000] px-2 py-0.5 rounded-full text-[9px] font-serif animate-fade-in"
          style={{
            background: "hsla(42, 80%, 50%, 0.12)",
            color: "hsl(42, 70%, 58%)",
            border: "1px solid hsla(42, 60%, 45%, 0.2)",
          }}
        >
          {perspective === "personal" ? "Viewing your mapped trees" : "Viewing tribe trees"}
        </div>
      )}

      {/* Slide-up species panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl"
        style={{
          background: "hsla(30, 20%, 8%, 0.96)",
          border: "1px solid hsla(42, 40%, 30%, 0.3)",
          borderBottom: "none",
          backdropFilter: "blur(12px)",
          maxHeight: panelOpen ? "45vh" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Handle */}
        <button
          onClick={() => setPanelOpen(false)}
          className="w-full flex flex-col items-center pt-2 pb-1 active:bg-white/5 transition-colors"
        >
          <div className="w-10 h-1 rounded-full" style={{ background: "hsla(42, 40%, 40%, 0.4)" }} />
          <span className="text-[10px] font-serif mt-1 flex items-center gap-0.5" style={{ color: "hsl(42, 50%, 55%)" }}>
            <ChevronDown className="w-3 h-3" />Filter by Staff
          </span>
        </button>

        {/* Family filter chips */}
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFamilyFilter(null)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif transition-all duration-200 active:scale-95"
            style={chipStyle(!familyFilter)}
          >
            <Leaf className="w-2.5 h-2.5" /> All Families
          </button>
          {availableFamilies.map((f) => (
            <button
              key={f.name}
              onClick={() => setFamilyFilter(familyFilter === f.name ? null : f.name)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif transition-all duration-200 active:scale-95"
              style={chipStyle(familyFilter === f.name)}
            >
              {f.name}
              <span
                className="text-[8px] rounded-full px-1"
                style={{ background: "hsla(42, 60%, 45%, 0.2)" }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <ScrollArea className="px-3 pb-4" style={{ maxHeight: "calc(45vh - 80px)" }}>
          <div className="grid grid-cols-5 gap-2">
            {/* TETOL */}
            <button
              onClick={() => handleSpeciesSelect("all")}
              className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 active:scale-95"
              style={species === "all" ? { background: "hsla(42, 80%, 50%, 0.15)" } : {}}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: "hsla(120, 30%, 20%, 0.5)", border: "1px solid hsla(42, 40%, 30%, 0.3)" }}
              >
                🌳
              </div>
              <span className="text-[9px] font-serif" style={{ color: "hsl(42, 55%, 58%)" }}>TETOL</span>
            </button>

            {availableSpecies.map((s) => {
              const count = speciesCounts[s.species.toLowerCase()] || 0;
              const active = species.toLowerCase() === s.species.toLowerCase();
              return (
                <button
                  key={s.key}
                  onClick={() => handleSpeciesSelect(s.species)}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 active:scale-95"
                  style={active ? { background: "hsla(42, 80%, 50%, 0.15)" } : {}}
                >
                  <div className="relative">
                    <img
                      src={s.image}
                      alt={s.species}
                      className="w-10 h-10 rounded-full object-cover transition-all duration-200"
                      style={{
                        border: active ? "2px solid hsl(42, 80%, 55%)" : "1px solid hsla(42, 40%, 30%, 0.4)",
                        boxShadow: active ? "0 0 8px hsla(42, 80%, 55%, 0.3)" : "none",
                      }}
                      loading="lazy"
                    />
                    {count > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center"
                        style={{ background: "hsl(42, 80%, 50%)", color: "hsl(30, 20%, 8%)" }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-serif leading-tight text-center" style={{ color: "hsl(42, 55%, 58%)" }}>
                    {s.species}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Backdrop when panel open */}
      {panelOpen && (
        <div
          className="absolute inset-0 z-[1000]"
          style={{ background: "rgba(0,0,0,0.2)" }}
          onClick={() => setPanelOpen(false)}
        />
      )}
    </>
  );
};

export default LiteMapFilters;

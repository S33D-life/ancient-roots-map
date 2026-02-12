import { useState, useMemo } from "react";
import { Filter, X, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  { key: "collective", label: "Collective", icon: "🌍" },
  { key: "personal", label: "Personal", icon: "🌿" },
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

const chipStyle = (active: boolean) => ({
  background: active ? "hsla(42, 80%, 50%, 0.2)" : "hsla(30, 30%, 12%, 0.88)",
  color: active ? "hsl(42, 80%, 60%)" : "hsl(42, 55%, 58%)",
  border: `1px solid ${active ? "hsla(42, 70%, 50%, 0.5)" : "hsla(42, 40%, 30%, 0.4)"}`,
  backdropFilter: "blur(6px)",
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

  const availableSpecies = useMemo(
    () => STAFF_SPECIES.filter((s) => (speciesCounts[s.species.toLowerCase()] || 0) > 0),
    [speciesCounts]
  );

  return (
    <>
      {/* Top bar: perspective chips + filter toggle */}
      <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center gap-1.5">
        {/* Perspective chips */}
        {PERSPECTIVES.map((p) => (
          <button
            key={p.key}
            onClick={() => onPerspectiveChange(p.key)}
            className="shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all active:scale-95"
            style={chipStyle(perspective === p.key)}
          >
            {p.icon} {p.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Species filter chip */}
        {species !== "all" ? (
          <button
            onClick={() => onSpeciesChange("all")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all active:scale-95"
            style={chipStyle(true)}
          >
            {species} <X className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all active:scale-95"
            style={chipStyle(panelOpen)}
          >
            <Filter className="w-3 h-3" /> Staff
          </button>
        )}

        {/* Count */}
        <span
          className="shrink-0 px-2 py-1 rounded-full text-[10px] font-serif"
          style={{
            background: "hsla(30, 30%, 12%, 0.8)",
            color: "hsl(42, 50%, 55%)",
            border: "1px solid hsla(42, 40%, 30%, 0.3)",
          }}
        >
          {totalVisible}
        </span>
      </div>

      {/* Slide-up species panel */}
      {panelOpen && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl transition-transform duration-300"
          style={{
            background: "hsla(30, 20%, 8%, 0.96)",
            border: "1px solid hsla(42, 40%, 30%, 0.3)",
            borderBottom: "none",
            backdropFilter: "blur(12px)",
            maxHeight: "45vh",
          }}
        >
          {/* Handle */}
          <button
            onClick={() => setPanelOpen(false)}
            className="w-full flex flex-col items-center pt-2 pb-1"
          >
            <div className="w-10 h-1 rounded-full" style={{ background: "hsla(42, 40%, 40%, 0.4)" }} />
            <span className="text-[10px] font-serif mt-1" style={{ color: "hsl(42, 50%, 55%)" }}>
              <ChevronUp className="w-3 h-3 inline mr-0.5" />Filter by Staff
            </span>
          </button>

          <ScrollArea className="px-3 pb-4" style={{ maxHeight: "calc(45vh - 40px)" }}>
            <div className="grid grid-cols-5 gap-2">
              {/* All / TETOL */}
              <button
                onClick={() => { onSpeciesChange("all"); setPanelOpen(false); }}
                className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all active:scale-95"
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
                    onClick={() => { onSpeciesChange(s.species); setPanelOpen(false); }}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all active:scale-95"
                    style={active ? { background: "hsla(42, 80%, 50%, 0.15)" } : {}}
                  >
                    <div className="relative">
                      <img
                        src={s.image}
                        alt={s.species}
                        className="w-10 h-10 rounded-full object-cover"
                        style={{
                          border: active ? "2px solid hsl(42, 80%, 55%)" : "1px solid hsla(42, 40%, 30%, 0.4)",
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
      )}
    </>
  );
};

export default LiteMapFilters;

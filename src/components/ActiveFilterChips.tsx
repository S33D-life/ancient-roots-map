/**
 * ActiveFilterChips — shows current map filters as dismissible chips.
 * Renders nothing if no filters are active.
 */
import { X, RotateCcw } from "lucide-react";
import { useMapFilters } from "@/contexts/MapFilterContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ActiveFilterChips = () => {
  const {
    activeFilterLabels,
    hasActiveFilters,
    setSpecies,
    setCountry,
    setHive,
    setBioRegion,
    resetFilters,
  } = useMapFilters();

  if (!hasActiveFilters) return null;

  const clearOne = (key: string) => {
    const map: Record<string, (v: string) => void> = {
      species: setSpecies,
      country: setCountry,
      hive: setHive,
      bioRegion: setBioRegion,
    };
    map[key]?.("all");
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-hide max-w-full">
      <span className="text-[10px] font-serif text-muted-foreground mr-0.5 shrink-0">Filters:</span>
      {activeFilterLabels.map(({ key, label, value }) => (
        <Badge
          key={key}
          variant="secondary"
          className="text-[10px] font-serif gap-1 pr-1 bg-primary/10 text-primary border-primary/20 shrink-0 whitespace-nowrap"
        >
          {label}: {value}
          <button
            onClick={() => clearOne(key)}
            className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors min-w-[16px] min-h-[16px] flex items-center justify-center"
            aria-label={`Remove ${label} filter`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
      {activeFilterLabels.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-5 px-1.5 text-[10px] font-serif text-muted-foreground hover:text-foreground gap-1 shrink-0"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Clear
        </Button>
      )}
    </div>
  );
};

export default ActiveFilterChips;

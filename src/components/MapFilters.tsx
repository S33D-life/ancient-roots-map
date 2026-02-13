import { useState } from "react";
import { Filter, TreeDeciduous, Users, Globe, GitBranch, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Staff images mapped to species names
const STAFF_SPECIES: { key: string; species: string; image: string }[] = [
  { key: "ald", species: "Alder", image: "/images/staffs/ald.jpeg" },
  { key: "app", species: "Apple", image: "/images/staffs/app.jpeg" },
  { key: "ash", species: "Ash", image: "/images/staffs/ash.jpeg" },
  { key: "bee", species: "Beech", image: "/images/staffs/bee.jpeg" },
  { key: "bir", species: "Birch", image: "/images/staffs/bir.jpeg" },
  { key: "box", species: "Box", image: "/images/staffs/box.jpeg" },
  { key: "buck", species: "Buckthorn", image: "/images/staffs/buck.jpeg" },
  { key: "bud", species: "Buddleja", image: "/images/staffs/bud.jpeg" },
  { key: "cher", species: "Cherry", image: "/images/staffs/cher.jpeg" },
  { key: "crab", species: "Crab Apple", image: "/images/staffs/crab.jpeg" },
  { key: "dawn", species: "Dawn Redwood", image: "/images/staffs/dawn.jpeg" },
  { key: "eld", species: "Elder", image: "/images/staffs/eld.jpeg" },
  { key: "goa", species: "Goat Willow", image: "/images/staffs/goa.jpeg" },
  { key: "haw", species: "Hawthorn", image: "/images/staffs/haw.jpeg" },
  { key: "haz", species: "Hazel", image: "/images/staffs/haz.jpeg" },
  { key: "hol", species: "Holly", image: "/images/staffs/hol.jpeg" },
  { key: "horn", species: "Hornbeam", image: "/images/staffs/horn.jpeg" },
  { key: "hors", species: "Horse Chestnut", image: "/images/staffs/hors.jpeg" },
  { key: "ivy", species: "Ivy", image: "/images/staffs/ivy.jpeg" },
  { key: "japa", species: "Japanese Maple", image: "/images/staffs/japa.jpeg" },
  { key: "med", species: "Medlar", image: "/images/staffs/med.jpeg" },
  { key: "oak", species: "Oak", image: "/images/staffs/oak.jpeg" },
  { key: "pear", species: "Pear", image: "/images/staffs/pear.jpeg" },
  { key: "pine", species: "Pine", image: "/images/staffs/pine.jpeg" },
  { key: "pla", species: "Plane", image: "/images/staffs/pla.jpeg" },
  { key: "plum", species: "Plum", image: "/images/staffs/plum.jpeg" },
  { key: "priv", species: "Privet", image: "/images/staffs/priv.jpeg" },
  { key: "rhod", species: "Rhododendron", image: "/images/staffs/rhod.jpeg" },
  { key: "rose", species: "Rose", image: "/images/staffs/rose.jpeg" },
  { key: "row", species: "Rowan", image: "/images/staffs/row.jpeg" },
  { key: "sloe", species: "Sloe", image: "/images/staffs/sloe.jpeg" },
  { key: "swe", species: "Sweet Chestnut", image: "/images/staffs/swe.jpeg" },
  { key: "syc", species: "Sycamore", image: "/images/staffs/syc.jpeg" },
  { key: "wil", species: "Willow", image: "/images/staffs/wil.jpeg" },
  { key: "witc", species: "Witch Hazel", image: "/images/staffs/witc.jpeg" },
  { key: "yew", species: "Yew", image: "/images/staffs/yew.jpeg" },
];

export type GroveScale = "all" | "local" | "regional" | "national" | "continental";

interface MapFiltersProps {
  speciesFilter: string;
  onSpeciesChange: (species: string) => void;
  groveScale: GroveScale;
  onGroveScaleChange: (scale: GroveScale) => void;
  treeCounts: Record<string, number>;
  totalTrees: number;
  lineageFilter?: string;
  onLineageChange?: (lineage: string) => void;
  availableLineages?: string[];
  projectFilter?: string;
  onProjectChange?: (project: string) => void;
  availableProjects?: string[];
}

const MapFilters = ({
  speciesFilter,
  onSpeciesChange,
  groveScale,
  onGroveScaleChange,
  treeCounts,
  totalTrees,
  lineageFilter = "all",
  onLineageChange,
  availableLineages = [],
  projectFilter = "all",
  onProjectChange,
  availableProjects = [],
}: MapFiltersProps) => {
  const [open, setOpen] = useState(false);

  const activeStaff = STAFF_SPECIES.find(
    (s) => s.species.toLowerCase() === speciesFilter.toLowerCase()
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/95 backdrop-blur border-border shadow-lg gap-2"
        >
          <Filter className="h-4 w-4" />
          Layers
          {speciesFilter !== "all" && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5">
              {speciesFilter}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[340px] sm:w-[380px] p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="font-serif text-mystical flex items-center gap-2">
            <TreeDeciduous className="h-5 w-5" />
            Atlas Layers
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground">
            {totalTrees} trees on the atlas
          </p>
        </div>

        <Separator />

        {/* Grove Scale */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Grove Scale
          </h3>
          <p className="text-xs text-muted-foreground">
            View trees grouped into groves by proximity and species
          </p>
          <Tabs value={groveScale} onValueChange={(v) => onGroveScaleChange(v as GroveScale)}>
            <TabsList className="grid grid-cols-5 w-full bg-muted">
              <TabsTrigger value="all" className="text-xs px-1">TETOL</TabsTrigger>
              <TabsTrigger value="local" className="text-xs px-1">Local</TabsTrigger>
              <TabsTrigger value="regional" className="text-xs px-1">Regional</TabsTrigger>
              <TabsTrigger value="national" className="text-xs px-1">National</TabsTrigger>
              <TabsTrigger value="continental" className="text-xs px-1">Continental</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-xs text-muted-foreground italic">
            {groveScale === "local" && "12 nearest trees of the same species"}
            {groveScale === "regional" && "Same species within your region"}
            {groveScale === "national" && "Same species within a country"}
            {groveScale === "continental" && "Same species across the continent"}
            {groveScale === "all" && "Showing all trees, ungrouped"}
          </div>
        </div>

        <Separator />

        {/* Species / Staff Filter */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Filter by Staff
          </h3>
          <p className="text-xs text-muted-foreground">
            Each staff represents a species of tree
          </p>

          {/* Active filter indicator */}
          {activeStaff && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <img
                src={activeStaff.image}
                alt={activeStaff.species}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/40"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{activeStaff.species}</p>
                <p className="text-xs text-muted-foreground">
                  {treeCounts[activeStaff.species.toLowerCase()] || 0} trees
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSpeciesChange("all")}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Lineage Filter */}
        {availableLineages.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Filter by Lineage
              </h3>
              <p className="text-xs text-muted-foreground">
                Named lineages connect trees through heritage
              </p>
              <Select value={lineageFilter} onValueChange={(v) => onLineageChange?.(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Lineages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lineages</SelectItem>
                  {availableLineages.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Project Scope Filter */}
        {availableProjects.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                Filter by Project
              </h3>
              <p className="text-xs text-muted-foreground">
                Trees linked to conservation or mapping projects
              </p>
              <Select value={projectFilter} onValueChange={(v) => onProjectChange?.(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {availableProjects.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Separator />

        <ScrollArea className="flex-1 h-[calc(100vh-420px)]">
          <div className="grid grid-cols-4 gap-2 px-4 pb-4">
            {/* All option */}
            <button
              onClick={() => {
                onSpeciesChange("all");
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all border ${
                speciesFilter === "all"
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-muted"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <TreeDeciduous className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-center leading-tight">TETOL</span>
            </button>

            {STAFF_SPECIES.map((staff) => {
              const count = treeCounts[staff.species.toLowerCase()] || 0;
              const isActive = speciesFilter.toLowerCase() === staff.species.toLowerCase();

              return (
                <button
                  key={staff.key}
                  onClick={() => {
                    onSpeciesChange(staff.species);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all border ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={staff.image}
                      alt={staff.species}
                      className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                        isActive ? "border-primary" : "border-muted"
                      } ${count === 0 ? "opacity-40 grayscale" : ""}`}
                    />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-center leading-tight">
                    {staff.species}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MapFilters;

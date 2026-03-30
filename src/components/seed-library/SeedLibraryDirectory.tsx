/**
 * SeedLibraryDirectory — Searchable list of global seed libraries.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, MapPin, ExternalLink, Users, MessageCircle, Filter } from "lucide-react";
import { useSeedLibraries, useSeedLibraryCountries, type SeedLibraryFilters, type SeedLibrary } from "@/hooks/use-seed-libraries";
import SeedLibraryDetail from "./SeedLibraryDetail";
import SeedLibrarySubmitForm from "./SeedLibrarySubmitForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<string, string> = {
  seed_library: "Seed Library",
  seed_bank: "Seed Bank",
  seed_swap: "Seed Swap",
  community_seed_initiative: "Community Initiative",
};

const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  community_verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  curator_verified: "bg-primary/15 text-primary",
};

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Unverified",
  community_verified: "Community Verified",
  curator_verified: "Curator Verified",
};

function LibraryCard({ library, onClick }: { library: SeedLibrary; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 md:p-5 hover:border-primary/40 hover:bg-card/60 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base md:text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {library.name}
            </h3>
            {library.is_featured && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                ✦ Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[library.city, library.region, library.country].filter(Boolean).join(", ")}
            </span>
          </div>
          {library.description && (
            <p className="text-xs text-foreground/60 mt-2 line-clamp-2 leading-relaxed">
              {library.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge className={`text-[10px] ${VERIFICATION_COLORS[library.verification_status] || ""}`}>
            {VERIFICATION_LABELS[library.verification_status] || library.verification_status}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {TYPE_LABELS[library.library_type] || library.library_type}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {library.verification_count} verified
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" /> {library.testimonial_count} stories
        </span>
        {library.website && (
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> website
          </span>
        )}
      </div>
    </button>
  );
}

export default function SeedLibraryDirectory() {
  const [filters, setFilters] = useState<SeedLibraryFilters>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: libraries = [], isLoading } = useSeedLibraries(filters);
  const { data: countries = [] } = useSeedLibraryCountries();

  if (selectedSlug) {
    return <SeedLibraryDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  }

  if (showSubmit) {
    return <SeedLibrarySubmitForm onBack={() => setShowSubmit(false)} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-foreground">🌱 Seed Libraries</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            A living commons of places sharing seeds, stories, and local resilience
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowSubmit(true)}
          className="self-start md:self-auto"
        >
          <Plus className="w-4 h-4 mr-1" /> Add a Library
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search seed libraries…"
              className="pl-9 bg-background/60"
              value={filters.search || ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            className={showFilters ? "border-primary text-primary" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <Select
              value={filters.country || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, country: v === "all" ? undefined : v }))}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background/60">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.libraryType || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, libraryType: v === "all" ? undefined : v }))}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background/60">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.verificationStatus || "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, verificationStatus: v === "all" ? undefined : v }))}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(VERIFICATION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : libraries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-serif text-muted-foreground">No seed libraries found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Be the first to add one in your area
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowSubmit(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add a Library
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {libraries.length} {libraries.length === 1 ? "library" : "libraries"} found
          </p>
          {libraries.map((lib) => (
            <LibraryCard
              key={lib.id}
              library={lib}
              onClick={() => setSelectedSlug(lib.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { lazy, Suspense, useMemo, useState } from "react";
import { Search, Plus, ImagePlus, Leaf, Sparkles, Upload, Sprout, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSeedLibraries } from "@/hooks/use-seed-libraries";
import {
  getSeedLifeImageUrl,
  useCreateSeedLifeEntry,
  useSeedLifeEntries,
  useSeedLifeFilterOptions,
  type SeedLifeEntry,
  type SeedLifeFilters,
} from "@/hooks/use-seed-life-gallery";
import SeedLifeDetail from "./SeedLifeDetail";

const USE_LABELS: Record<string, string> = {
  food: "Food",
  medicinal: "Medicinal",
  tree: "Tree",
  wild: "Wild",
};

function SeedCard({ seed, onOpen }: { seed: SeedLifeEntry; onOpen: () => void }) {
  const imageUrl = getSeedLifeImageUrl(seed.image_thumb_path || seed.image_path);

  return (
    <button
      onClick={onOpen}
      className="group overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/50 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <AspectRatio ratio={4 / 5}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={seed.image_alt || seed.common_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/60 via-background to-muted/50 text-muted-foreground">
            <div className="text-center space-y-2">
              <Leaf className="w-6 h-6 mx-auto" />
              <p className="font-serif text-sm">Image awaiting a steward</p>
            </div>
          </div>
        )}
      </AspectRatio>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground">{USE_LABELS[seed.use_category] || seed.use_category}</Badge>
          <Badge variant="outline" className="border-border/60">{seed.species_group}</Badge>
          {seed.validation_count > 0 && (
            <Badge className="bg-primary/15 text-primary border-transparent">{seed.validation_count} validations</Badge>
          )}
        </div>
        <div>
          <h3 className="font-serif text-lg text-foreground leading-tight">{seed.common_name}</h3>
          {seed.latin_name && <p className="text-xs italic text-muted-foreground mt-1">{seed.latin_name}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{seed.region_label || "Region still gathering"}</span>
          <span>{seed.verification_status === "community_validated" ? "Community held" : "Emerging"}</span>
        </div>
      </div>
    </button>
  );
}

function SeedLifeSubmitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { userId } = useCurrentUser();
  const createSeed = useCreateSeedLifeEntry();
  const { data: libraries = [] } = useSeedLibraries();

  const [commonName, setCommonName] = useState("");
  const [latinName, setLatinName] = useState("");
  const [originLabel, setOriginLabel] = useState("");
  const [speciesGroup, setSpeciesGroup] = useState("");
  const [useCategory, setUseCategory] = useState("food");
  const [regionLabel, setRegionLabel] = useState("");
  const [description, setDescription] = useState("");
  const [seedSize, setSeedSize] = useState("");
  const [germinationNotes, setGerminationNotes] = useState("");
  const [storageNotes, setStorageNotes] = useState("");
  const [archiveLink, setArchiveLink] = useState("");
  const [pollinators, setPollinators] = useState("");
  const [soil, setSoil] = useState("");
  const [relationshipUses, setRelationshipUses] = useState("");
  const [companions, setCompanions] = useState("");
  const [seedStage, setSeedStage] = useState("");
  const [plantStage, setPlantStage] = useState("");
  const [flowerStage, setFlowerStage] = useState("");
  const [fruitStage, setFruitStage] = useState("");
  const [guardianLibraryId, setGuardianLibraryId] = useState("none");
  const [guardianPodName, setGuardianPodName] = useState("");
  const [guardianNote, setGuardianNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const canSubmit = Boolean(userId && commonName.trim() && speciesGroup.trim() && imageFile);

  const closeAndReset = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCommonName("");
      setLatinName("");
      setOriginLabel("");
      setSpeciesGroup("");
      setUseCategory("food");
      setRegionLabel("");
      setDescription("");
      setSeedSize("");
      setGerminationNotes("");
      setStorageNotes("");
      setArchiveLink("");
      setPollinators("");
      setSoil("");
      setRelationshipUses("");
      setCompanions("");
      setSeedStage("");
      setPlantStage("");
      setFlowerStage("");
      setFruitStage("");
      setGuardianLibraryId("none");
      setGuardianPodName("");
      setGuardianNote("");
      setImageFile(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    createSeed.mutate(
      {
        common_name: commonName,
        latin_name: latinName,
        origin_label: originLabel,
        species_group: speciesGroup,
        use_category: useCategory,
        region_label: regionLabel,
        description,
        seed_size: seedSize,
        germination_notes: germinationNotes,
        storage_notes: storageNotes,
        archive_link: archiveLink,
        image_file: imageFile,
        growthStages: {
          seed: seedStage,
          plant: plantStage,
          flower: flowerStage,
          fruit: fruitStage,
        },
        relationshipNotes: {
          pollinators,
          soil,
          uses: relationshipUses,
          companions,
        },
        guardianLibraryId: guardianLibraryId === "none" ? undefined : guardianLibraryId,
        guardianPodName,
        guardianNote,
      },
      { onSuccess: () => closeAndReset(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[1.75rem] border-border/60 bg-background/95 backdrop-blur-xl p-6 md:p-7">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Seed Life Gallery</DialogTitle>
          <DialogDescription>
            Add one seed with enough clarity to spark curiosity; deeper stewardship can unfold later.
          </DialogDescription>
        </DialogHeader>

        {!userId ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-sm text-muted-foreground text-center">
            Sign in to add a seed, upload images, and leave growing notes.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seed image *</label>
                <label className="flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-6 text-center hover:border-primary/40 hover:bg-card/60 transition-colors">
                  <ImagePlus className="w-6 h-6 mb-2 text-primary" />
                  <span className="font-serif text-foreground">{imageFile ? imageFile.name : "Upload a seed image"}</span>
                  <span className="text-xs text-muted-foreground mt-1">A clean close-up works best.</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Common name *</label>
                  <Input value={commonName} onChange={(event) => setCommonName(event.target.value)} placeholder="Scarlet runner bean" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latin name</label>
                  <Input value={latinName} onChange={(event) => setLatinName(event.target.value)} placeholder="Phaseolus coccineus" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Species group *</label>
                    <Input value={speciesGroup} onChange={(event) => setSpeciesGroup(event.target.value)} placeholder="Bean" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Use</label>
                    <Select value={useCategory} onValueChange={setUseCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="medicinal">Medicinal</SelectItem>
                        <SelectItem value="tree">Tree</SelectItem>
                        <SelectItem value="wild">Wild</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Origin</label>
                <Input value={originLabel} onChange={(event) => setOriginLabel(event.target.value)} placeholder="Andean highlands" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Region</label>
                <Input value={regionLabel} onChange={(event) => setRegionLabel(event.target.value)} placeholder="Pacific Northwest" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seed size</label>
                <Input value={seedSize} onChange={(event) => setSeedSize(event.target.value)} placeholder="Large, mottled, kidney-shaped" />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Identity note</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What draws people toward this seed?"
                className="min-h-[92px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Germination</label>
                <Textarea value={germinationNotes} onChange={(event) => setGerminationNotes(event.target.value)} className="min-h-[90px]" placeholder="Warm soak, sow after frost, germinates in 7–12 days" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Storage</label>
                <Textarea value={storageNotes} onChange={(event) => setStorageNotes(event.target.value)} className="min-h-[90px]" placeholder="Keep dry and cool; good viability for 3 years" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Sprout className="w-4 h-4 text-primary" /> Growth journey
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input value={seedStage} onChange={(event) => setSeedStage(event.target.value)} placeholder="Seed stage" />
                <Input value={plantStage} onChange={(event) => setPlantStage(event.target.value)} placeholder="Plant stage" />
                <Input value={flowerStage} onChange={(event) => setFlowerStage(event.target.value)} placeholder="Flower stage" />
                <Input value={fruitStage} onChange={(event) => setFruitStage(event.target.value)} placeholder="Fruit stage" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Relationships</label>
                <div className="space-y-3 mt-2">
                  <Input value={pollinators} onChange={(event) => setPollinators(event.target.value)} placeholder="Pollinators" />
                  <Input value={soil} onChange={(event) => setSoil(event.target.value)} placeholder="Soil / conditions" />
                  <Input value={relationshipUses} onChange={(event) => setRelationshipUses(event.target.value)} placeholder="Uses" />
                  <Input value={companions} onChange={(event) => setCompanions(event.target.value)} placeholder="Companions" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Guardians</label>
                <div className="space-y-3 mt-2">
                  <Select value={guardianLibraryId} onValueChange={setGuardianLibraryId}>
                    <SelectTrigger><SelectValue placeholder="Held by a seed library" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No library linked yet</SelectItem>
                      {libraries.map((library) => (
                        <SelectItem key={library.id} value={library.id}>{library.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={guardianPodName} onChange={(event) => setGuardianPodName(event.target.value)} placeholder="Pod name (optional)" />
                  <Textarea value={guardianNote} onChange={(event) => setGuardianNote(event.target.value)} placeholder="How is this seed being held or stewarded?" className="min-h-[88px]" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Archive link</label>
              <Input value={archiveLink} onChange={(event) => setArchiveLink(event.target.value)} placeholder="Link back to Airtable or source record" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground max-w-xl">
                New seeds enter softly, then gather validation from the community over time.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => closeAndReset(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || createSeed.isPending}>
                  <Upload className="w-4 h-4 mr-1" /> {createSeed.isPending ? "Submitting…" : "Add seed"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const SeedModelViewer = lazy(() => import("./seed-3d/SeedModelViewer"));

export default function SeedLifeGallery() {
  const [filters, setFilters] = useState<SeedLifeFilters>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const { data: seeds = [], isLoading } = useSeedLifeEntries(filters);
  const { data: filterOptions } = useSeedLifeFilterOptions();

  const summary = useMemo(() => {
    const featured = seeds.filter((seed) => seed.is_featured).length;
    const regions = new Set(seeds.map((seed) => seed.region_label).filter(Boolean));
    return { featured, regions: regions.size };
  }, [seeds]);

  if (selectedSlug) {
    return <SeedLifeDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-border/60 bg-card/40 p-5 md:p-6 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <Badge className="bg-primary/15 text-primary border-transparent">New in the Seed Cellar</Badge>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif text-foreground">🌰 Seed Life Gallery</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                A visual field guide for individual seeds — image-first, quietly held, and ready to grow into richer plant and tree stories later.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1">{seeds.length} seeds in view</span>
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1">{summary.regions} regions represented</span>
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1">{summary.featured} featured</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowSubmit(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add a seed
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-border/60 bg-card/35 p-4 backdrop-blur-sm space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(150px,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={filters.search || ""}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value || undefined }))}
              placeholder="Search by seed name"
              className="pl-9 bg-background/60"
            />
          </div>

          <Select
            value={filters.species || "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, species: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="bg-background/60"><SelectValue placeholder="Species" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              {filterOptions?.species.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.useCategory || "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, useCategory: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="bg-background/60"><SelectValue placeholder="Use" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All uses</SelectItem>
              {filterOptions?.uses.map((option) => (
                <SelectItem key={option} value={option}>{USE_LABELS[option] || option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.region || "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, region: value === "all" ? undefined : value }))}
          >
            <SelectTrigger className="bg-background/60"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {filterOptions?.regions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[22rem] rounded-[1.5rem] bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : seeds.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/30 p-10 text-center space-y-4">
          <Sparkles className="w-7 h-7 mx-auto text-primary" />
          <div>
            <h3 className="text-xl font-serif text-foreground">The gallery is still germinating</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">
              Add the first close-up seed portrait and a few stewardship notes to start this visual field guide.
            </p>
          </div>
          <Button onClick={() => setShowSubmit(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add the first seed
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {seeds.map((seed) => (
            <SeedCard key={seed.id} seed={seed} onOpen={() => setSelectedSlug(seed.slug)} />
          ))}
        </div>
      )}

      <SeedLifeSubmitDialog open={showSubmit} onOpenChange={setShowSubmit} />
    </div>
  );
}
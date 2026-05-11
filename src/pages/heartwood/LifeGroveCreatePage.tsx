/**
 * LifeGroveCreatePage — new-grove flow.
 * Route: /heartwood/life-groves/new
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createLifeGrove } from "@/repositories/life-groves";
import GroveTypePicker from "@/components/life-groves/GroveTypePicker";
import EtherealTreeArchetypePicker from "@/components/life-groves/EtherealTreeArchetypePicker";
import EtherealTreePreview from "@/components/life-groves/EtherealTreePreview";
import HeartsDiscountPanel from "@/components/life-groves/HeartsDiscountPanel";
import TreeLinkPicker from "@/components/life-groves/TreeLinkPicker";
import {
  PLANTING_PACKAGES,
  PRIVACY_OPTIONS,
  calcHeartsDiscount,
  type GroveType,
  type PlantingPackage,
  type PlantingType,
  type PlantingStatus,
  type Privacy,
  type TreeArchetype,
  type TreeLinkType,
} from "@/lib/life-groves/types";

export default function LifeGroveCreatePage() {
  const navigate = useNavigate();
  const { userId, isLoading: loadingUser } = useCurrentUser();

  const [groveType, setGroveType] = useState<GroveType>("family");
  const [groveTitle, setGroveTitle] = useState("");
  const [rememberedName, setRememberedName] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [treeName, setTreeName] = useState("");
  const [archetype, setArchetype] = useState<TreeArchetype>("oak");
  const [speciesDetail, setSpeciesDetail] = useState("");
  const [plantingType, setPlantingType] = useState<PlantingType>("symbolic_ethereal_tree");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [storyIntro, setStoryIntro] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("invite_only");
  const [pkg, setPkg] = useState<PlantingPackage>("symbolic");
  const [hearts, setHearts] = useState(0);

  const packagePence = useMemo(
    () => PLANTING_PACKAGES.find((p) => p.value === pkg)?.pricePence ?? 0,
    [pkg],
  );

  const { discountPence, totalPence } = calcHeartsDiscount(packagePence, hearts);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in.");
      if (!groveTitle.trim()) throw new Error("A grove title is needed.");
      const grove = await createLifeGrove({
        created_by: userId,
        grove_type: groveType,
        grove_title: groveTitle.trim(),
        remembered_or_celebrated_name: rememberedName.trim() || null,
        relationship_label: relationshipLabel.trim() || null,
        tree_name: treeName.trim() || null,
        tree_archetype_species: archetype,
        tree_species_detail: speciesDetail.trim() || null,
        planting_type: plantingType,
        location_text: locationText.trim() || null,
        event_date: eventDate || null,
        story_intro: storyIntro.trim() || null,
        privacy,
        planting_package: pkg,
        package_price_pence: packagePence,
        hearts_applied: hearts,
        discount_pence: discountPence,
      });
      return grove;
    },
    onSuccess: (grove) => {
      toast("Your Life Grove has begun.");
      navigate(`/heartwood/life-groves/${grove.id}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not create grove.";
      toast(msg);
    },
  });

  if (!loadingUser && !userId) {
    return (
      <div className="min-h-screen botanical-heartwood">
        <Header />
        <main className="max-w-md mx-auto px-4 py-24 text-center" style={{ paddingTop: "var(--content-top)" }}>
          <h1 className="font-serif text-2xl text-foreground mb-2">Sign in to plant a grove</h1>
          <p className="text-sm font-serif text-muted-foreground/80 mb-6">
            Life Groves are kept in your Heartwood.
          </p>
          <Button onClick={() => navigate("/auth")}>Sign in</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen botanical-heartwood">
      <Header />
      <main
        className="max-w-3xl mx-auto px-4 pb-24 space-y-8"
        style={{ paddingTop: "var(--content-top)" }}
      >
        <header className="text-center">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            Heartwood · Life Groves
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mt-2">
            Begin a Life Grove
          </h1>
          <p className="font-serif text-sm italic text-muted-foreground/70 mt-2 max-w-xl mx-auto">
            The visible tree is your grove. Inside the Heartwood is the library.
          </p>
        </header>

        {/* Grove type */}
        <section className="space-y-2">
          <Label className="font-serif text-sm">What kind of grove?</Label>
          <GroveTypePicker value={groveType} onChange={setGroveType} />
        </section>

        {/* Basics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title" className="font-serif text-sm">Grove title</Label>
            <Input
              id="title"
              value={groveTitle}
              onChange={(e) => setGroveTitle(e.target.value)}
              placeholder="e.g. The Mira Grove"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remembered" className="font-serif text-sm">Remembered / celebrated name</Label>
            <Input
              id="remembered"
              value={rememberedName}
              onChange={(e) => setRememberedName(e.target.value)}
              placeholder="Whose grove is this?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship" className="font-serif text-sm">Relationship</Label>
            <Input
              id="relationship"
              value={relationshipLabel}
              onChange={(e) => setRelationshipLabel(e.target.value)}
              placeholder="Mother, friend, our family…"
            />
          </div>
        </section>

        {/* Ethereal tree */}
        <section className="space-y-3">
          <Label className="font-serif text-sm">Choose an ethereal tree</Label>
          <EtherealTreeArchetypePicker value={archetype} onChange={setArchetype} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="treeName" className="font-serif text-sm">Tree name</Label>
                <Input
                  id="treeName"
                  value={treeName}
                  onChange={(e) => setTreeName(e.target.value)}
                  placeholder="e.g. Mira's Oak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speciesDetail" className="font-serif text-sm">Species detail (optional)</Label>
                <Input
                  id="speciesDetail"
                  value={speciesDetail}
                  onChange={(e) => setSpeciesDetail(e.target.value)}
                  placeholder="Quercus robur, Bramley apple…"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 text-center mb-2">
                Preview
              </p>
              <EtherealTreePreview archetype={archetype} treeName={treeName} size="sm" />
            </div>
          </div>
        </section>

        {/* Planting */}
        <section className="space-y-3">
          <Label className="font-serif text-sm">Planting</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              ["symbolic_ethereal_tree", "Symbolic ethereal tree"],
              ["dedicate_existing_tree", "Dedicate an existing tree"],
              ["plant_new_tree", "Plant a new tree"],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPlantingType(v)}
                className={`text-left p-3 rounded-xl border bg-card/40 ${plantingType === v ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"}`}
              >
                <p className="font-serif text-sm text-foreground">{label}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="font-serif text-sm">Location (optional)</Label>
              <Input
                id="location"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="A place, a meadow, a town…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="font-serif text-sm">Event date (optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="space-y-2">
          <Label htmlFor="story" className="font-serif text-sm">A short opening story</Label>
          <Textarea
            id="story"
            rows={4}
            value={storyIntro}
            onChange={(e) => setStoryIntro(e.target.value)}
            placeholder="Why this grove? Who is it for?"
          />
        </section>

        {/* Privacy */}
        <section className="space-y-2">
          <Label className="font-serif text-sm">Who can see this grove?</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {PRIVACY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPrivacy(p.value)}
                className={`text-left p-3 rounded-xl border bg-card/40 ${privacy === p.value ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"}`}
              >
                <p className="font-serif text-sm text-foreground">{p.label}</p>
                <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">{p.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Package + hearts */}
        <section className="space-y-3">
          <Label className="font-serif text-sm">Planting package</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PLANTING_PACKAGES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPkg(p.value)}
                className={`text-left p-3 rounded-xl border bg-card/40 ${pkg === p.value ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"}`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-sm text-foreground">{p.label}</p>
                  <p className="font-serif text-sm text-primary">£{(p.pricePence / 100).toFixed(0)}</p>
                </div>
                <p className="text-[11px] font-serif text-muted-foreground/80">{p.hint}</p>
              </button>
            ))}
          </div>
          <HeartsDiscountPanel
            packagePence={packagePence}
            heartsApplied={hearts}
            onChange={setHearts}
          />
        </section>

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={() => navigate("/heartwood/life-groves")}>
            Back
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Planting…" : `Begin Grove · £${(totalPence / 100).toFixed(2)}`}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

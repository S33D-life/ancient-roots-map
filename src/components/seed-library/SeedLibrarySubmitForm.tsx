/**
 * SeedLibrarySubmitForm — Simple form to submit a new seed library.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useSubmitSeedLibrary } from "@/hooks/use-seed-libraries";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_OPTIONS = [
  { value: "seed_library", label: "Seed Library" },
  { value: "seed_bank", label: "Seed Bank" },
  { value: "seed_swap", label: "Seed Swap" },
  { value: "community_seed_initiative", label: "Community Initiative" },
];

interface Props {
  onBack: () => void;
}

export default function SeedLibrarySubmitForm({ onBack }: Props) {
  const { userId } = useCurrentUser();
  const submit = useSubmitSeedLibrary();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [website, setWebsite] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [libraryType, setLibraryType] = useState("seed_library");
  const [description, setDescription] = useState("");

  const canSubmit = name.trim() && country.trim() && (city.trim() || region.trim()) && (website.trim() || contactLink.trim());

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit.mutate(
      {
        name: name.trim(),
        country: country.trim(),
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        website: website.trim() || undefined,
        contact_link: contactLink.trim() || undefined,
        library_type: libraryType,
        description: description.trim() || undefined,
      },
      { onSuccess: () => onBack() },
    );
  };

  if (!userId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to submit a seed library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div>
        <h2 className="text-xl font-serif text-foreground">🌱 Add a Seed Library</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Know a place where seeds are shared? Add it to the living directory.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Name *</label>
          <Input
            placeholder="e.g. Portland Seed Library"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground/80 mb-1 block">Country *</label>
            <Input
              placeholder="e.g. United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80 mb-1 block">City or Region *</label>
            <Input
              placeholder="e.g. Portland, Oregon"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Region</label>
          <Input
            placeholder="e.g. Pacific Northwest"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground/80 mb-1 block">Website</label>
            <Input
              placeholder="https://…"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80 mb-1 block">Contact link</label>
            <Input
              placeholder="https://… or email"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Type</label>
          <Select value={libraryType} onValueChange={setLibraryType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground/80 mb-1 block">Description</label>
          <Textarea
            placeholder="Tell us about this seed library…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submit.isPending}
          className="w-full"
        >
          {submit.isPending ? "Submitting…" : "Submit for Review"}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Submissions are reviewed before appearing in the directory
        </p>
      </div>
    </div>
  );
}

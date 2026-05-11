/**
 * TreeLinkPicker — choose how a Life Grove is rooted in a real tree.
 * Symbolic only, plant new, link existing planted, or link Ancient Friend.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TREE_LINK_OPTIONS, type TreeLinkType } from "@/lib/life-groves/types";

interface Props {
  treeLinkType: TreeLinkType;
  onTreeLinkType: (v: TreeLinkType) => void;
  linkedTreeId: string;
  onLinkedTreeId: (v: string) => void;
  plantedLocationText: string;
  onPlantedLocationText: (v: string) => void;
  plantedLatitude: string;
  onPlantedLatitude: (v: string) => void;
  plantedLongitude: string;
  onPlantedLongitude: (v: string) => void;
  plantingNotes: string;
  onPlantingNotes: (v: string) => void;
}

export default function TreeLinkPicker(p: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-serif text-sm text-foreground">
          Would you like to root this Life Grove in a real tree?
        </p>
        <p className="font-serif text-xs italic text-muted-foreground/80 mt-1">
          The ethereal tree is the inner form. The rooted tree is its living body in the world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {TREE_LINK_OPTIONS.map((opt) => {
          const active = p.treeLinkType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => p.onTreeLinkType(opt.value)}
              aria-pressed={active}
              className={`text-left p-3 rounded-xl border bg-card/40 transition ${
                active ? "border-primary/60 ring-1 ring-primary/30" : "border-border/40"
              }`}
            >
              <p className="font-serif text-sm text-foreground">{opt.label}</p>
              <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5">{opt.hint}</p>
            </button>
          );
        })}
      </div>

      {p.treeLinkType === "plant_new_tree" && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="plantedLoc" className="font-serif text-sm">Where will it be planted? (optional)</Label>
            <Input
              id="plantedLoc"
              value={p.plantedLocationText}
              onChange={(e) => p.onPlantedLocationText(e.target.value)}
              placeholder="A garden, a meadow, a churchyard…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat" className="font-serif text-sm">Latitude (optional)</Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={p.plantedLatitude}
                onChange={(e) => p.onPlantedLatitude(e.target.value)}
                placeholder="51.5074"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng" className="font-serif text-sm">Longitude (optional)</Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={p.plantedLongitude}
                onChange={(e) => p.onPlantedLongitude(e.target.value)}
                placeholder="-0.1278"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-serif text-sm">Planting notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={p.plantingNotes}
              onChange={(e) => p.onPlantingNotes(e.target.value)}
              placeholder="Who will plant it? When? Any wishes?"
            />
          </div>
          <p className="text-[11px] font-serif italic text-muted-foreground/70">
            Marked as <span className="text-foreground/80">requested</span> until planting is confirmed.
          </p>
        </div>
      )}

      {p.treeLinkType === "link_existing_planted_tree" && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="existingLoc" className="font-serif text-sm">Where is it?</Label>
            <Input
              id="existingLoc"
              value={p.plantedLocationText}
              onChange={(e) => p.onPlantedLocationText(e.target.value)}
              placeholder="Town, garden, hill…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat2" className="font-serif text-sm">Latitude (optional)</Label>
              <Input
                id="lat2"
                inputMode="decimal"
                value={p.plantedLatitude}
                onChange={(e) => p.onPlantedLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng2" className="font-serif text-sm">Longitude (optional)</Label>
              <Input
                id="lng2"
                inputMode="decimal"
                value={p.plantedLongitude}
                onChange={(e) => p.onPlantedLongitude(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes2" className="font-serif text-sm">Notes (optional)</Label>
            <Textarea
              id="notes2"
              rows={2}
              value={p.plantingNotes}
              onChange={(e) => p.onPlantingNotes(e.target.value)}
              placeholder="What makes this tree the one?"
            />
          </div>
        </div>
      )}

      {p.treeLinkType === "link_ancient_friend" && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="friendId" className="font-serif text-sm">Ancient Friend ID</Label>
            <Input
              id="friendId"
              value={p.linkedTreeId}
              onChange={(e) => p.onLinkedTreeId(e.target.value)}
              placeholder="paste tree ID from the atlas"
            />
            <p className="text-[11px] font-serif italic text-muted-foreground/70">
              {/* TODO: replace with shared Ancient Friend search component */}
              For now, paste the tree ID from the atlas. A search picker will live here soon.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes3" className="font-serif text-sm">Why this Ancient Friend? (optional)</Label>
            <Textarea
              id="notes3"
              rows={2}
              value={p.plantingNotes}
              onChange={(e) => p.onPlantingNotes(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

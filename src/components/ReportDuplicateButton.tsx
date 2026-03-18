/**
 * ReportDuplicateButton — allows any authenticated user to report
 * a tree as a possible duplicate of another tree.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { calculateSimilarity } from "@/utils/treeSimilarityEngine";

interface Props {
  treeId: string;
  treeName: string;
  treeSpecies: string;
  treeLat: number | null;
  treeLng: number | null;
}

export default function ReportDuplicateButton({ treeId, treeName, treeSpecies, treeLat, treeLng }: Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .neq("id", treeId)
      .is("merged_into_tree_id", null)
      .ilike("name", `%${searchQuery.trim()}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!selectedTreeId) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      setSubmitting(false);
      return;
    }

    // Calculate similarity score
    let score = 0;
    const selected = searchResults.find((t) => t.id === selectedTreeId);
    if (selected && treeLat && treeLng && selected.latitude && selected.longitude) {
      const result = calculateSimilarity(
        { name: treeName, species: treeSpecies, latitude: treeLat, longitude: treeLng },
        { id: selected.id, name: selected.name, species: selected.species, latitude: selected.latitude, longitude: selected.longitude },
      );
      score = result.score;
    }

    // Ensure consistent ordering (smaller UUID first)
    const [aId, bId] = treeId < selectedTreeId ? [treeId, selectedTreeId] : [selectedTreeId, treeId];

    const { error } = await supabase.from("tree_duplicate_reports" as any).insert({
      tree_a_id: aId,
      tree_b_id: bId,
      similarity_score: score,
      note: note.trim() || null,
      proposer_id: user.id,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("This pair has already been reported");
      } else {
        toast.error("Failed to submit report");
      }
    } else {
      toast.success("Duplicate report submitted for steward review");
    }

    setSubmitting(false);
    setOpen(false);
    setSelectedTreeId(null);
    setNote("");
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs font-serif gap-1.5 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Copy className="h-3 w-3" />
        Report Duplicate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-sm">Report Possible Duplicate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-serif">
              Search for the tree you think is the same as <span className="text-foreground">{treeName}</span>.
            </p>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tree name..."
                className="text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {searchResults.map((t) => (
                  <button
                    key={t.id}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-serif transition-colors ${
                      selectedTreeId === t.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                    onClick={() => setSelectedTreeId(t.id)}
                  >
                    {t.name} <span className="text-muted-foreground italic">({t.species})</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <Label className="text-[10px] text-muted-foreground">Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why do you think these are the same tree?"
                className="text-xs min-h-[50px]"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={!selectedTreeId || submitting}
              className="font-serif text-xs w-full"
              size="sm"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

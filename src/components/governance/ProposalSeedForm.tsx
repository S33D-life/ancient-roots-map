/**
 * ProposalSeedForm — submit community proposals with category,
 * value tree branch, hive connection, and optional funding.
 */
import { useState } from "react";
import { useCreateProposal } from "@/hooks/use-governance-proposals";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sprout, Loader2, TreePine, Heart } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "restoration", label: "🌿 Restoration", desc: "Restore degraded ecosystems" },
  { value: "planting", label: "🌱 Community Planting", desc: "Plant trees and orchards" },
  { value: "protection", label: "🛡️ Tree Protection", desc: "Protect ancient or threatened trees" },
  { value: "seed_library", label: "📦 Seed Library", desc: "Create community seed banks" },
  { value: "nursery", label: "🏡 Tree Nursery", desc: "Fund local nurseries" },
  { value: "research", label: "🔬 Research", desc: "Support ecological research" },
  { value: "cultural", label: "📜 Cultural Memory", desc: "Preserve tree-related traditions" },
  { value: "education", label: "📚 Education", desc: "Tree and ecology education" },
  { value: "harvest", label: "🍎 Harvest", desc: "Community harvest initiatives" },
  { value: "general", label: "💡 General", desc: "Other community ideas" },
];

const BRANCHES = [
  { value: "restoration", label: "Restoration" },
  { value: "biodiversity", label: "Biodiversity" },
  { value: "food_systems", label: "Food Systems" },
  { value: "cultural_memory", label: "Cultural Memory" },
  { value: "governance", label: "Governance" },
  { value: "education", label: "Education" },
];

const FUNDING_TYPES = [
  { value: "none", label: "No funding needed" },
  { value: "hearts", label: "S33D Hearts" },
  { value: "donation", label: "Donations" },
  { value: "harvest_revenue", label: "Harvest revenue" },
  { value: "mixed", label: "Mixed" },
];

interface Props {
  userId: string;
  defaultHiveFamily?: string;
  defaultBranch?: string;
  trigger?: React.ReactNode;
}

const ProposalSeedForm = ({ userId, defaultHiveFamily, defaultBranch, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [why, setWhy] = useState("");
  const [category, setCategory] = useState("general");
  const [branch, setBranch] = useState(defaultBranch || "");
  const [hiveFamily, setHiveFamily] = useState(defaultHiveFamily || "");
  const [location, setLocation] = useState("");
  const [fundingType, setFundingType] = useState("none");
  const [fundingTarget, setFundingTarget] = useState("");
  const createProposal = useCreateProposal();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    try {
      await createProposal.mutateAsync({
        userId,
        title,
        description,
        why_it_matters: why || undefined,
        category,
        value_tree_branch: branch || undefined,
        hive_family: hiveFamily || undefined,
        location_name: location || undefined,
        funding_target: parseInt(fundingTarget) || 0,
        funding_type: fundingType,
      });
      setOpen(false);
      setTitle(""); setDescription(""); setWhy(""); setLocation("");
      setFundingTarget(""); setFundingType("none");
      toast.success("Proposal seed planted! The community can now signal support.");
    } catch (err: any) {
      toast.error(err.message || "Could not submit proposal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5">
            <Sprout className="w-3.5 h-3.5" /> Plant a Proposal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-base flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" /> Plant a Proposal Seed
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">What do you propose?</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Plant a community orchard in Camden" className="mt-1 text-sm" maxLength={200} />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Category</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORIES.map(c => (
                <Badge
                  key={c.value}
                  variant={category === c.value ? "default" : "outline"}
                  className="text-[10px] font-serif cursor-pointer transition-colors"
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the initiative..." className="mt-1 text-sm min-h-[60px]" maxLength={2000} />
          </div>

          {/* Why */}
          <div>
            <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Why it matters</label>
            <Textarea value={why} onChange={e => setWhy(e.target.value)} placeholder="How does this serve the grove?" className="mt-1 text-sm min-h-[48px]" maxLength={1000} />
          </div>

          {/* Value Tree Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Value Branch</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="mt-1 text-xs font-serif">
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => (
                    <SelectItem key={b.value} value={b.value} className="text-xs font-serif">{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Location (optional)</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Camden, London" className="mt-1 text-sm" maxLength={200} />
            </div>
          </div>

          {/* Hive Family */}
          {!defaultHiveFamily && (
            <div>
              <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Connected Species Hive (optional)</label>
              <Input value={hiveFamily} onChange={e => setHiveFamily(e.target.value)} placeholder="e.g. Oak & Beech" className="mt-1 text-sm" />
            </div>
          )}

          {/* Funding */}
          <div className="border-t border-border/30 pt-3">
            <p className="text-[10px] font-serif text-muted-foreground/70 mb-2 flex items-center gap-1">
              <Heart className="w-3 h-3" /> Funding (experimental — optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Funding Type</label>
                <Select value={fundingType} onValueChange={setFundingType}>
                  <SelectTrigger className="mt-1 text-xs font-serif">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_TYPES.map(f => (
                      <SelectItem key={f.value} value={f.value} className="text-xs font-serif">{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fundingType !== "none" && (
                <div>
                  <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Target (Hearts)</label>
                  <Input type="number" value={fundingTarget} onChange={e => setFundingTarget(e.target.value)} min={0} max={10000} className="mt-1 text-sm" />
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={createProposal.isPending || !title.trim() || !description.trim()} className="w-full font-serif">
            {createProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TreePine className="w-4 h-4 mr-2" />}
            Plant Proposal Seed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalSeedForm;

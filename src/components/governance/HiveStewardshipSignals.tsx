/**
 * HiveStewardshipSignals — displays stewardship ideas, campaigns,
 * and research notes for a species hive.
 */
import { useState } from "react";
import { useHiveStewardshipSignals, useCreateStewardshipSignal } from "@/hooks/use-governance-proposals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sprout, Loader2, Plus, TreePine, AlertTriangle, BookOpen, Leaf } from "lucide-react";
import { toast } from "sonner";

const SIGNAL_TYPES = [
  { value: "idea", label: "💡 Idea", icon: Sprout },
  { value: "restoration", label: "🌿 Restoration", icon: Leaf },
  { value: "planting_campaign", label: "🌱 Planting Campaign", icon: TreePine },
  { value: "research_note", label: "📝 Research Note", icon: BookOpen },
  { value: "protection_alert", label: "🛡️ Protection Alert", icon: AlertTriangle },
  { value: "harvest_opportunity", label: "🍎 Harvest Opportunity", icon: Leaf },
];

const SIGNAL_META: Record<string, { emoji: string; color: string }> = {
  idea: { emoji: "💡", color: "hsl(var(--muted-foreground))" },
  restoration: { emoji: "🌿", color: "hsl(var(--primary))" },
  planting_campaign: { emoji: "🌱", color: "hsl(120, 40%, 45%)" },
  research_note: { emoji: "📝", color: "hsl(210, 50%, 50%)" },
  protection_alert: { emoji: "🛡️", color: "hsl(0, 60%, 50%)" },
  harvest_opportunity: { emoji: "🍎", color: "hsl(25, 60%, 50%)" },
};

interface Props {
  hiveFamily: string;
  accentHsl: string;
  userId?: string | null;
}

const HiveStewardshipSignals = ({ hiveFamily, accentHsl, userId }: Props) => {
  const { data: signals, isLoading } = useHiveStewardshipSignals(hiveFamily);
  const createSignal = useCreateStewardshipSignal();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [signalType, setSignalType] = useState("idea");

  const handleSubmit = async () => {
    if (!title.trim() || !userId) return;
    try {
      await createSignal.mutateAsync({
        hive_family: hiveFamily,
        signal_type: signalType,
        title,
        description: description || undefined,
        author_id: userId,
      });
      setOpen(false);
      setTitle(""); setDescription("");
      toast.success("Stewardship signal planted");
    } catch (err: any) {
      toast.error(err.message || "Could not submit signal");
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, hsl(${accentHsl}), transparent)` }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4" style={{ color: `hsl(${accentHsl})` }} />
            <h4 className="font-serif text-sm text-foreground tracking-wide">Stewardship Signals</h4>
          </div>
          {userId && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-serif gap-1">
                  <Plus className="w-3 h-3" /> Add Signal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-base">Add Stewardship Signal</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Signal Type</label>
                    <Select value={signalType} onValueChange={setSignalType}>
                      <SelectTrigger className="mt-1 text-xs font-serif">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNAL_TYPES.map(s => (
                          <SelectItem key={s.value} value={s.value} className="text-xs font-serif">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Title</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oak woodland restoration plan" className="mt-1 text-sm" maxLength={200} />
                  </div>
                  <div>
                    <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Description</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Share details..." className="mt-1 text-sm min-h-[60px]" maxLength={2000} />
                  </div>
                  <Button onClick={handleSubmit} disabled={createSignal.isPending || !title.trim()} className="w-full font-serif">
                    {createSignal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
                    Plant Signal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : !signals || signals.length === 0 ? (
          <div className="py-4 text-center">
            <Sprout className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground font-serif">
              No stewardship signals yet. Share a restoration idea or planting campaign.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 5).map((s: any) => {
              const meta = SIGNAL_META[s.signal_type] || SIGNAL_META.idea;
              return (
                <div key={s.id} className="rounded-lg border border-border/30 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <p className="text-xs font-serif text-foreground flex-1 truncate">{s.title}</p>
                    <Badge variant="outline" className="text-[8px] font-serif capitalize shrink-0" style={{ borderColor: `${meta.color}40`, color: meta.color }}>
                      {s.signal_type.replace("_", " ")}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-[10px] text-muted-foreground font-serif line-clamp-2 pl-6">{s.description}</p>
                  )}
                </div>
              );
            })}
            {signals.length > 5 && (
              <p className="text-[10px] text-center text-muted-foreground font-serif">
                +{signals.length - 5} more signals
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HiveStewardshipSignals;

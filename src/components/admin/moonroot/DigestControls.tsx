import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { MoonrootDigestType } from "@/lib/moonroot/types";
import { Sparkles, Loader2, User } from "lucide-react";

interface Props {
  userId: string;
  type: MoonrootDigestType;
  startDate: string;
  endDate: string;
  loading: boolean;
  onUserId: (v: string) => void;
  onType: (v: MoonrootDigestType) => void;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onGenerate: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function presetRange(type: MoonrootDigestType): { start: string; end: string } {
  switch (type) {
    case "weekly": return { start: daysAgo(7), end: today() };
    case "new_moon":
    case "full_moon": return { start: daysAgo(14), end: today() };
    case "custom":
    default: return { start: daysAgo(28), end: today() };
  }
}

export default function DigestControls(p: Props) {
  const [selfId, setSelfId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSelfId(data.user?.id ?? null));
  }, []);

  const useSelf = () => { if (selfId) p.onUserId(selfId); };

  const handleType = (v: MoonrootDigestType) => {
    p.onType(v);
    if (v !== "custom") {
      const r = presetRange(v);
      p.onStart(r.start);
      p.onEnd(r.end);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="font-serif text-sm">User ID</Label>
          <div className="flex gap-2">
            <Input
              value={p.userId}
              onChange={(e) => p.onUserId(e.target.value)}
              placeholder="Paste a profile UUID…"
              className="font-mono text-base md:text-sm"
            />
            <Button type="button" variant="outline" onClick={useSelf} disabled={!selfId}>
              <User className="w-4 h-4" /> Me
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-serif italic">
            Paste any profile UUID. Use “Me” to preview your own digest.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="font-serif text-sm">Digest type</Label>
          <Select value={p.type} onValueChange={(v) => handleType(v as MoonrootDigestType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_moon">🌑 New Moon</SelectItem>
              <SelectItem value="full_moon">🌕 Full Moon</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 md:col-span-1">
          <div className="space-y-1.5">
            <Label className="font-serif text-sm">Start</Label>
            <Input type="date" value={p.startDate} onChange={(e) => p.onStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-serif text-sm">End</Label>
            <Input type="date" value={p.endDate} onChange={(e) => p.onEnd(e.target.value)} />
          </div>
        </div>
      </div>

      <Button
        onClick={p.onGenerate}
        disabled={p.loading || !p.userId}
        variant="mystical"
        className="w-full md:w-auto"
      >
        {p.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {p.loading ? "Gathering what moved through the grove…" : "Generate digest"}
      </Button>
    </div>
  );
}

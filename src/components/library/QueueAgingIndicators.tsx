/**
 * QueueAgingIndicators — Shows oldest items in review queues with urgency coloring.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hourglass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, getAgingUrgency } from "@/lib/lifecycle-labels";

interface AgingItem {
  label: string;
  oldest: string | null; // ISO date
}

export function QueueAgingIndicators() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AgingItem[]>([]);

  useEffect(() => {
    (async () => {
      const [candRes, verifRes, contribRes, findingsRes] = await Promise.all([
        supabase.from("source_tree_candidates")
          .select("created_at").eq("normalization_status", "raw")
          .order("created_at", { ascending: true }).limit(1),
        supabase.from("verification_tasks")
          .select("created_at").eq("status", "open")
          .order("created_at", { ascending: true }).limit(1),
        supabase.from("agent_contribution_events")
          .select("created_at").eq("validation_status", "pending")
          .order("created_at", { ascending: true }).limit(1),
        supabase.from("agent_findings")
          .select("created_at").eq("review_status", "pending")
          .order("created_at", { ascending: true }).limit(1),
      ]);

      setItems([
        { label: "Oldest raw candidate", oldest: candRes.data?.[0]?.created_at || null },
        { label: "Oldest open verification", oldest: verifRes.data?.[0]?.created_at || null },
        { label: "Oldest pending contribution", oldest: contribRes.data?.[0]?.created_at || null },
        { label: "Oldest pending finding", oldest: findingsRes.data?.[0]?.created_at || null },
      ]);
      setLoading(false);
    })();
  }, []);

  const hasAny = items.some(i => i.oldest);

  if (loading) {
    return (
      <Card className="bg-card/30 border-border/20">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-3 h-3 animate-spin text-primary mr-1.5" />
          <span className="text-[10px] text-muted-foreground">Checking queue ages…</span>
        </CardContent>
      </Card>
    );
  }

  if (!hasAny) return null;

  return (
    <Card className="bg-card/30 border-border/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <Hourglass className="w-3.5 h-3.5 text-accent-foreground" />
          Queue Aging
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1">
        {items.filter(i => i.oldest).map((item) => {
          const urgency = getAgingUrgency(item.oldest!);
          return (
            <div key={item.label} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground/70">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono ${urgency.className}`}>
                  {timeAgo(item.oldest!)}
                </span>
                <Badge variant="outline" className={`text-[8px] capitalize ${urgency.className}`}>
                  {urgency.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

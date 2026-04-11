/**
 * SourceDashboard — Per-source pipeline summary with stats and progress bars.
 */
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ExternalLink, Loader2, ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DataSource } from "@/hooks/use-data-commons";

interface SourceStats {
  crawlCount: number;
  latestCrawlStatus: string | null;
  candidateCount: number;
  promotedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  researchTreeCount: number;
  lastUpdated: string | null;
}

interface Props {
  sources: DataSource[];
}

export function SourceDashboard({ sources }: Props) {
  const [statsMap, setStatsMap] = useState<Record<string, SourceStats>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [crawlRes, candRes] = await Promise.all([
      supabase.from("dataset_crawl_runs").select("source_id, status, created_at").order("created_at", { ascending: false }),
      supabase.from("source_tree_candidates").select("source_id, normalization_status"),
    ]);

    const crawls = crawlRes.data || [];
    const candidates = candRes.data || [];
    const map: Record<string, SourceStats> = {};

    for (const src of sources) {
      const srcCrawls = crawls.filter(c => c.source_id === src.id);
      const srcCands = candidates.filter(c => c.source_id === src.id);
      map[src.id] = {
        crawlCount: srcCrawls.length,
        latestCrawlStatus: srcCrawls[0]?.status || null,
        candidateCount: srcCands.length,
        promotedCount: srcCands.filter(c => c.normalization_status === "promoted").length,
        rejectedCount: srcCands.filter(c => c.normalization_status === "rejected").length,
        duplicateCount: srcCands.filter(c => c.normalization_status === "duplicate").length,
        researchTreeCount: srcCands.filter(c => c.normalization_status === "promoted").length, // approx
        lastUpdated: srcCrawls[0]?.created_at || null,
      };
    }
    setStatsMap(map);
    setLoading(false);
  }, [sources]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground font-serif">Loading source pipeline…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((src) => {
        const s = statsMap[src.id];
        if (!s) return null;
        const total = s.candidateCount || 1;
        const promotedPct = Math.round((s.promotedCount / total) * 100);
        const rejectedPct = Math.round((s.rejectedCount / total) * 100);
        const dupPct = Math.round((s.duplicateCount / total) * 100);
        const rawPct = 100 - promotedPct - rejectedPct - dupPct;

        return (
          <Card key={src.id} className="border-primary/10 bg-card/60">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-serif text-foreground truncate">{src.name}</p>
                  <p className="text-[10px] font-serif text-muted-foreground">
                    {src.country || "Global"} · {src.scope}
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5" /> source
                      </a>
                    )}
                  </p>
                </div>
                {s.latestCrawlStatus && (
                  <Badge variant="outline" className={`text-[9px] ${s.latestCrawlStatus === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                    {s.latestCrawlStatus}
                  </Badge>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Crawls", value: s.crawlCount },
                  { label: "Candidates", value: s.candidateCount },
                  { label: "Promoted", value: s.promotedCount },
                  { label: "Research Trees", value: s.researchTreeCount },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-sm font-serif font-bold text-foreground">{stat.value}</p>
                    <p className="text-[9px] font-serif text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Pipeline bar */}
              {s.candidateCount > 0 && (
                <div className="space-y-1">
                  <div className="flex h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                    {promotedPct > 0 && <div className="bg-green-500/60" style={{ width: `${promotedPct}%` }} />}
                    {rejectedPct > 0 && <div className="bg-red-500/40" style={{ width: `${rejectedPct}%` }} />}
                    {dupPct > 0 && <div className="bg-muted-foreground/30" style={{ width: `${dupPct}%` }} />}
                    {rawPct > 0 && <div className="bg-amber-500/40" style={{ width: `${rawPct}%` }} />}
                  </div>
                  <div className="flex justify-between text-[8px] font-serif text-muted-foreground">
                    <span className="text-green-600">{s.promotedCount} promoted</span>
                    <span className="text-red-500">{s.rejectedCount} rejected</span>
                    <span>{s.duplicateCount} dup</span>
                    <span className="text-amber-600">{s.candidateCount - s.promotedCount - s.rejectedCount - s.duplicateCount} raw</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-[9px] font-serif text-muted-foreground pt-1">
                {s.lastUpdated && <span>Last crawl: {new Date(s.lastUpdated).toLocaleDateString()}</span>}
                <Button size="sm" variant="ghost" className="h-5 px-2 text-[9px] font-serif text-muted-foreground" disabled>
                  <Lock className="w-2.5 h-2.5 mr-1" /> Run crawl (keeper only)
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

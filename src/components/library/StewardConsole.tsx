/**
 * StewardConsole — Compact operational dashboard for the living system.
 * Shows wanderer health, research pipeline, review queues, source activity, and quick links.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Footprints, TreeDeciduous, ClipboardCheck, Database, Bug,
  AlertTriangle, CheckCircle, Clock, Globe, ExternalLink, Loader2,
  Eye, Telescope, Sprout,
} from "lucide-react";
import {
  clusterFindings, findFlakiestJourney, mostCommonCategory,
} from "@/lib/wanderer-patterns";
import type { AgentRun, AgentFinding } from "@/lib/wanderer-types";

interface WandererHealth {
  latestStatus: string | null;
  latestScore: number | null;
  recurringCount: number;
  commonCategory: string | null;
  flakiestJourney: string | null;
}

interface PipelineHealth {
  crawlRuns: number;
  rawCandidates: number;
  duplicates: number;
  promoted: number;
  openVerifications: number;
  completedVerifications: number;
  readyForPromotion: number;
}

interface ReviewQueues {
  candidatesAwaiting: number;
  verificationsOpen: number;
  findingsPending: number;
}

export function StewardConsole() {
  const [loading, setLoading] = useState(true);
  const [wanderer, setWanderer] = useState<WandererHealth>({
    latestStatus: null, latestScore: null, recurringCount: 0,
    commonCategory: null, flakiestJourney: null,
  });
  const [pipeline, setPipeline] = useState<PipelineHealth>({
    crawlRuns: 0, rawCandidates: 0, duplicates: 0, promoted: 0,
    openVerifications: 0, completedVerifications: 0, readyForPromotion: 0,
  });
  const [queues, setQueues] = useState<ReviewQueues>({
    candidatesAwaiting: 0, verificationsOpen: 0, findingsPending: 0,
  });
  const [latestSources, setLatestSources] = useState<{ name: string; integrationStatus: string; recordCount: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [
        runsRes, findingsRes, journeysRes,
        crawlRes, candRawRes, candDupRes, candPromRes,
        verifOpenRes, verifDoneRes, researchReadyRes,
        findingsPendingRes, sourcesRes,
      ] = await Promise.all([
        supabase.from("agent_runs").select("*, agent_journeys(title, slug)").order("created_at", { ascending: false }).limit(50),
        supabase.from("agent_findings").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("agent_journeys").select("id, slug, title").eq("is_active", true),
        supabase.from("dataset_crawl_runs").select("id", { count: "exact", head: true }),
        supabase.from("source_tree_candidates").select("id", { count: "exact", head: true }).eq("normalization_status", "raw"),
        supabase.from("source_tree_candidates").select("id", { count: "exact", head: true }).eq("normalization_status", "duplicate"),
        supabase.from("source_tree_candidates").select("id", { count: "exact", head: true }).eq("normalization_status", "promoted"),
        supabase.from("verification_tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("verification_tasks").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("research_trees").select("id", { count: "exact", head: true }).eq("conversion_status", "verified"),
        supabase.from("agent_findings").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
        supabase.from("tree_data_sources").select("id, name, integration_status, record_count").order("updated_at", { ascending: false }).limit(5),
      ]);

      // Wanderer health
      const runs = (runsRes.data || []) as unknown as AgentRun[];
      const findings = (findingsRes.data || []) as unknown as AgentFinding[];
      const journeys = (journeysRes.data || []) as { id: string; slug: string; title: string }[];
      const latestRun = runs[0];
      const patterns = clusterFindings(findings, runs);
      const recurring = patterns.filter(p => p.count >= 2);
      const flakiest = findFlakiestJourney(runs, journeys);

      setWanderer({
        latestStatus: latestRun?.status || null,
        latestScore: latestRun?.score ?? null,
        recurringCount: recurring.length,
        commonCategory: mostCommonCategory(findings),
        flakiestJourney: flakiest?.title || null,
      });

      setPipeline({
        crawlRuns: crawlRes.count ?? 0,
        rawCandidates: candRawRes.count ?? 0,
        duplicates: candDupRes.count ?? 0,
        promoted: candPromRes.count ?? 0,
        openVerifications: verifOpenRes.count ?? 0,
        completedVerifications: verifDoneRes.count ?? 0,
        readyForPromotion: researchReadyRes.count ?? 0,
      });

      setQueues({
        candidatesAwaiting: candRawRes.count ?? 0,
        verificationsOpen: verifOpenRes.count ?? 0,
        findingsPending: findingsPendingRes.count ?? 0,
      });

      const srcData = (sourcesRes.data || []);
      setLatestSources(srcData.map(s => ({
        name: s.name,
        integrationStatus: s.integration_status || "unknown",
        recordCount: s.record_count ?? 0,
      })));

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
        <span className="text-xs text-muted-foreground">Loading steward console…</span>
      </div>
    );
  }

  const totalQueueItems = queues.candidatesAwaiting + queues.verificationsOpen + queues.findingsPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-mono font-medium text-foreground/90">Steward Console</span>
        {totalQueueItems > 0 && (
          <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent-foreground border-accent/20">
            {totalQueueItems} awaiting review
          </Badge>
        )}
      </div>

      {/* Wanderer Health */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Footprints className="w-3.5 h-3.5 text-primary" />
            Wanderer Health
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/70">Latest run:</span>
              {wanderer.latestStatus === "completed" ? (
                <CheckCircle className="w-3 h-3 text-primary" />
              ) : wanderer.latestStatus === "failed" ? (
                <AlertTriangle className="w-3 h-3 text-destructive" />
              ) : (
                <Clock className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="capitalize text-foreground/80">{wanderer.latestStatus || "none"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/70">Score:</span>
              <span className="font-mono text-foreground/90">{wanderer.latestScore ?? "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/70">Recurring:</span>
              <span className={`font-mono ${wanderer.recurringCount > 0 ? "text-accent-foreground" : "text-foreground/80"}`}>
                {wanderer.recurringCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/70">Top issue:</span>
              <span className="text-foreground/80 truncate">{wanderer.commonCategory || "—"}</span>
            </div>
          </div>
          {wanderer.flakiestJourney && (
            <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Flakiest: <span className="text-foreground/70">{wanderer.flakiestJourney}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Pipeline Health */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <Telescope className="w-3.5 h-3.5 text-primary" />
            Research Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Crawl Runs", value: pipeline.crawlRuns },
              { label: "Raw Candidates", value: pipeline.rawCandidates },
              { label: "Duplicates", value: pipeline.duplicates },
              { label: "Promoted", value: pipeline.promoted },
              { label: "Verif. Open", value: pipeline.openVerifications },
              { label: "Verif. Done", value: pipeline.completedVerifications },
            ].map(item => (
              <div key={item.label} className="py-1">
                <span className="text-lg font-mono font-bold text-foreground/90 block">{item.value}</span>
                <span className="text-[9px] text-muted-foreground/60">{item.label}</span>
              </div>
            ))}
          </div>
          {pipeline.readyForPromotion > 0 && (
            <div className="mt-2 text-[10px] flex items-center gap-1.5 text-primary">
              <TreeDeciduous className="w-3 h-3" />
              {pipeline.readyForPromotion} research tree{pipeline.readyForPromotion !== 1 ? "s" : ""} ready for Ancient Friend promotion
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Queues */}
      <Card className="bg-card/30 border-border/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-accent-foreground" />
            Review Queues
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {[
            { label: "Candidates awaiting review", count: queues.candidatesAwaiting, route: "/agent-garden" },
            { label: "Verification tasks open", count: queues.verificationsOpen, route: "/agent-garden" },
            { label: "Findings pending", count: queues.findingsPending, route: "/agent-garden" },
          ].map(q => (
            <Link key={q.label} to={q.route} className="flex items-center justify-between text-[11px] group hover:bg-card/20 rounded px-1 py-0.5">
              <span className="text-muted-foreground/70 group-hover:text-foreground/80">{q.label}</span>
              <span className={`font-mono ${q.count > 0 ? "text-accent-foreground" : "text-foreground/60"}`}>{q.count}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Source Activity */}
      {latestSources.length > 0 && (
        <Card className="bg-card/30 border-border/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-secondary-foreground" />
              Source Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            {latestSources.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80 truncate max-w-[60%]">{s.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] capitalize">{s.integrationStatus}</Badge>
                  <span className="text-muted-foreground/60">{s.recordCount} records</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Wanderers", route: "/agent-garden", icon: <Footprints className="w-3 h-3" /> },
          { label: "Research Bridge", route: "/agent-garden", icon: <TreeDeciduous className="w-3 h-3" /> },
          { label: "Verification Queue", route: "/agent-garden", icon: <ClipboardCheck className="w-3 h-3" /> },
          { label: "Bug Garden", route: "/bug-garden", icon: <Bug className="w-3 h-3" /> },
          { label: "Tree Data Commons", route: "/tree-data-commons", icon: <Database className="w-3 h-3" /> },
          { label: "Agent Garden", route: "/agent-garden", icon: <Sprout className="w-3 h-3" /> },
        ].map(l => (
          <Link key={l.label} to={l.route}>
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 bg-card/20 border-border/20 text-[10px] h-7">
              {l.icon}
              {l.label}
              <ExternalLink className="w-2 h-2 ml-auto opacity-30" />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

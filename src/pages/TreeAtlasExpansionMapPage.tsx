/**
 * Tree Atlas Expansion Map — planetary canopy view for Tree Data Commons.
 * Visualizes global dataset coverage, discovery opportunities, readiness,
 * and next expansion pathways for the Ancient Friends research canopy.
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useDataCommons } from "@/hooks/use-data-commons";
import { useDiscoveryAgent, type DiscoveryCandidate } from "@/hooks/use-discovery-agent";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Globe, TreeDeciduous, MapPin, ChevronRight, BookOpen, Telescope,
  Layers, Star, ArrowUpRight, Compass, Leaf, Eye, Plus,
} from "lucide-react";

/* ────────────── Region status model ────────────── */

type RegionStatus =
  | "integrated"
  | "seeded"
  | "approved_candidate"
  | "discovered"
  | "fragmented_sources"
  | "manual_curation_needed"
  | "watching"
  | "paused";

interface ExpansionRegion {
  country_code: string;
  country_name: string;
  region_name: string;
  status: RegionStatus;
  readiness_phase: "ready_now" | "near_ready" | "research_phase" | "manual_curation_phase";
  readiness_score: number;
  story_value: number;
  tier: 1 | 2 | 3;
  dataset_types: string[];
  atlas_framing: string[];
  circles: string[];
  notes: string;
  recommended_action: string;
  flag_emoji: string;
  lat: number;
  lng: number;
  atlas_slug?: string;
  config_exists?: boolean;
}

/* ── 8 seed expansion regions ─── */

const EXPANSION_REGIONS: ExpansionRegion[] = [
  {
    country_code: "JP",
    country_name: "Japan",
    region_name: "Japan",
    status: "discovered",
    readiness_phase: "research_phase",
    readiness_score: 52,
    story_value: 95,
    tier: 3,
    dataset_types: ["sacred_trees", "natural_monuments"],
    atlas_framing: [
      "Sacred Groves and Natural Monuments",
      "Shrine Guardians and Mountain Elders",
    ],
    circles: ["Shrine Guardians", "Temple Courtyard Trees", "Mountain Elders", "Natural Monument Giants"],
    notes: "Rich sacred tree and natural monument sources. May require multi-source discovery and manual curation — no single unified national register confirmed.",
    recommended_action: "Begin multi-source discovery research",
    flag_emoji: "🇯🇵",
    lat: 36.2, lng: 138.2,
    atlas_slug: "japan", config_exists: true,
  },
  {
    country_code: "IT",
    country_name: "Italy",
    region_name: "Italy",
    status: "approved_candidate",
    readiness_phase: "ready_now",
    readiness_score: 88,
    story_value: 85,
    tier: 1,
    dataset_types: ["monumental_trees", "heritage_trees"],
    atlas_framing: [
      "Monumental Trees of the Peninsula",
      "Olive Elders, Chestnut Giants, and Sacred Oaks",
    ],
    circles: ["Olive Elders", "Chestnut Giants", "Civic Monument Trees", "Sacred Oaks and Cypress"],
    notes: "High readiness — official national monumental trees register exists. Strong candidate for standard config-driven integration.",
    recommended_action: "Generate integration pack & prepare seed set",
    flag_emoji: "🇮🇹",
    lat: 41.9, lng: 12.5,
    atlas_slug: "italy", config_exists: true,
  },
  {
    country_code: "US",
    country_name: "United States",
    region_name: "United States",
    status: "approved_candidate",
    readiness_phase: "ready_now",
    readiness_score: 84,
    story_value: 78,
    tier: 1,
    dataset_types: ["champion_trees"],
    atlas_framing: [
      "Champion Trees of Turtle Island",
      "Continental Giants and State Champions",
    ],
    circles: ["Conifer Giants", "Broadleaf Champions", "Desert Survivors", "State Legacy Trees"],
    notes: "High readiness — champion tree registry exists. National program in transition between organizations, so preserve source provenance clearly.",
    recommended_action: "Generate integration pack with provenance tracking",
    flag_emoji: "🇺🇸",
    lat: 39.8, lng: -98.6,
    atlas_slug: "united-states", config_exists: true,
  },
  {
    country_code: "ZA",
    country_name: "South Africa",
    region_name: "South Africa",
    status: "approved_candidate",
    readiness_phase: "ready_now",
    readiness_score: 82,
    story_value: 90,
    tier: 1,
    dataset_types: ["champion_trees"],
    atlas_framing: [
      "Champion Trees of the Veld and Forest",
      "Baobabs, Yellowwoods, and Living Ancestors",
    ],
    circles: ["Baobab Ancestors", "Yellowwood Guardians", "Fig and Forest Elders", "Cultural Landmark Trees"],
    notes: "High readiness — official champion tree programme exists. Strong candidate for direct dataset integration.",
    recommended_action: "Generate integration pack & prepare seed set",
    flag_emoji: "🇿🇦",
    lat: -30.6, lng: 22.9,
    atlas_slug: "south-africa", config_exists: true,
  },
  {
    country_code: "IN",
    country_name: "India",
    region_name: "India",
    status: "discovered",
    readiness_phase: "manual_curation_phase",
    readiness_score: 48,
    story_value: 98,
    tier: 3,
    dataset_types: ["heritage_trees", "sacred_trees"],
    atlas_framing: [
      "Banyan Elders and Sacred Threshold Trees",
      "Village Guardians and Temple Canopies",
    ],
    circles: ["Banyan Mandalas", "Temple Guardians", "Village Threshold Trees", "Sacred Ficus Elders"],
    notes: "Extremely high story value. Likely requires multi-source and phased curation — no single clean national register expected.",
    recommended_action: "Phased multi-source discovery research",
    flag_emoji: "🇮🇳",
    lat: 20.6, lng: 78.9,
  },
  {
    country_code: "TW",
    country_name: "Taiwan",
    region_name: "Taiwan",
    status: "discovered",
    readiness_phase: "near_ready",
    readiness_score: 72,
    story_value: 80,
    tier: 2,
    dataset_types: ["heritage_trees", "ancient_trees"],
    atlas_framing: [
      "Precious Old Trees of Island Mountains and Cities",
      "Cypress Elders, Temple Trees, and Living Heritage",
    ],
    circles: ["Temple Trees", "Mountain Elders", "Urban Protected Trees", "Cypress Guardians"],
    notes: "National old-tree preservation framework exists. Many county and city protected tree datasets may need aggregation.",
    recommended_action: "Aggregate county-level sources and assess unity",
    flag_emoji: "🇹🇼",
    lat: 23.7, lng: 120.9,
  },
  {
    country_code: "ES",
    country_name: "Spain",
    region_name: "Spain",
    status: "discovered",
    readiness_phase: "near_ready",
    readiness_score: 68,
    story_value: 82,
    tier: 2,
    dataset_types: ["monumental_trees", "heritage_trees"],
    atlas_framing: [
      "Árboles Singulares",
      "Atlantic Giants, Mediterranean Elders, and Canary Survivors",
    ],
    circles: ["Atlantic Relics", "Mediterranean Elders", "Singular Civic Trees", "Island and Botanical Guardians"],
    notes: "Strong source landscape. Likely fragmented across national, regional, and municipal singular tree catalogs.",
    recommended_action: "Map regional catalogs and assess aggregation path",
    flag_emoji: "🇪🇸",
    lat: 40.5, lng: -3.7,
  },
  {
    country_code: "MX",
    country_name: "Mexico",
    region_name: "Mexico",
    status: "discovered",
    readiness_phase: "manual_curation_phase",
    readiness_score: 45,
    story_value: 88,
    tier: 3,
    dataset_types: ["monumental_trees", "sacred_trees"],
    atlas_framing: [
      "Árboles Monumentales",
      "Ceibas, Ahuehuetes, and Desert Elders",
    ],
    circles: ["Ceiba Guardians", "Ahuehuete Elders", "Desert Monument Trees", "Sacred Plaza Trees"],
    notes: "Likely discovery-led. May need manual curation or multi-source synthesis rather than a single clean national register.",
    recommended_action: "Begin discovery research and manual curation pathway",
    flag_emoji: "🇲🇽",
    lat: 23.6, lng: -102.5,
  },
];

/* ── Already-integrated regions from the existing system ── */
const INTEGRATED_REGIONS: ExpansionRegion[] = [
  {
    country_code: "HK", country_name: "Hong Kong", region_name: "Hong Kong",
    status: "integrated", readiness_phase: "ready_now",
    readiness_score: 95, story_value: 85, tier: 1,
    dataset_types: ["heritage_trees"],
    atlas_framing: ["Stone Wall Trees and Urban Elders"],
    circles: ["Stone Wall Trees", "Urban Canopy Giants"],
    notes: "Fully integrated — OVT Register seeded.",
    recommended_action: "Monitor for updates via Watcher",
    flag_emoji: "🇭🇰", lat: 22.3, lng: 114.2,
  },
  {
    country_code: "SG", country_name: "Singapore", region_name: "Singapore",
    status: "integrated", readiness_phase: "ready_now",
    readiness_score: 94, story_value: 80, tier: 1,
    dataset_types: ["heritage_trees"],
    atlas_framing: ["Heritage Trees of the Garden City"],
    circles: ["NParks Heritage Trees", "Botanical Garden Elders"],
    notes: "Fully integrated — NParks Heritage Trees seeded.",
    recommended_action: "Monitor for updates via Watcher",
    flag_emoji: "🇸🇬", lat: 1.35, lng: 103.8,
  },
  {
    country_code: "CR", country_name: "Costa Rica", region_name: "Costa Rica",
    status: "seeded", readiness_phase: "ready_now",
    readiness_score: 80, story_value: 88, tier: 1,
    dataset_types: ["heritage_trees", "ancient_trees"],
    atlas_framing: ["Ancient Forests of Pura Vida"],
    circles: ["Cloud Forest Elders", "Ceiba Giants"],
    notes: "Country registered with multiple source types enabled.",
    recommended_action: "Continue seeding and expand atlas",
    flag_emoji: "🇨🇷", lat: 9.7, lng: -83.8,
  },
  {
    country_code: "ID", country_name: "Indonesia", region_name: "Indonesia",
    status: "seeded", readiness_phase: "ready_now",
    readiness_score: 75, story_value: 90, tier: 1,
    dataset_types: ["heritage_trees", "ancient_trees"],
    atlas_framing: ["Sacred Trees of the Archipelago"],
    circles: ["Banyan Guardians", "Rainforest Elders"],
    notes: "Country registered with multiple source types enabled.",
    recommended_action: "Continue seeding and expand atlas",
    flag_emoji: "🇮🇩", lat: -2.5, lng: 118.0,
  },
  {
    country_code: "PE", country_name: "Peru", region_name: "Peru",
    status: "seeded", readiness_phase: "ready_now",
    readiness_score: 74, story_value: 85, tier: 1,
    dataset_types: ["heritage_trees", "ancient_trees"],
    atlas_framing: ["Ancient Trees of the Andes and Amazon"],
    circles: ["Andean Elders", "Amazon Giants"],
    notes: "Country registered with multiple source types enabled.",
    recommended_action: "Continue seeding and expand atlas",
    flag_emoji: "🇵🇪", lat: -9.2, lng: -75.0,
  },
];

/* ── Color helpers ─── */

const STATUS_COLORS: Record<RegionStatus, string> = {
  integrated: "bg-primary/25 text-primary border-primary/50",
  seeded: "bg-primary/15 text-primary/80 border-primary/30",
  approved_candidate: "bg-accent/25 text-accent-foreground border-accent/50",
  discovered: "bg-secondary text-secondary-foreground border-border",
  fragmented_sources: "bg-accent/15 text-accent-foreground border-accent/30",
  manual_curation_needed: "bg-muted text-muted-foreground border-border",
  watching: "bg-primary/10 text-primary/60 border-primary/20",
  paused: "bg-muted/50 text-muted-foreground border-border/50",
};

const MAP_DOT_COLORS: Record<RegionStatus, string> = {
  integrated: "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]",
  seeded: "bg-primary/70",
  approved_candidate: "bg-accent",
  discovered: "bg-secondary-foreground/50",
  fragmented_sources: "bg-accent/50",
  manual_curation_needed: "bg-muted-foreground/40",
  watching: "bg-primary/40",
  paused: "bg-muted-foreground/20",
};

const PHASE_LABELS: Record<string, string> = {
  ready_now: "Ready Now",
  near_ready: "Near Ready",
  research_phase: "Research Phase",
  manual_curation_phase: "Manual Curation",
};

const PHASE_COLORS: Record<string, string> = {
  ready_now: "bg-primary/20 text-primary border-primary/40",
  near_ready: "bg-accent/20 text-accent-foreground border-accent/40",
  research_phase: "bg-secondary text-secondary-foreground border-border",
  manual_curation_phase: "bg-muted text-muted-foreground border-border",
};

/* ────────────── Coverage Summary ────────────── */
function CoverageSummary({
  allRegions,
  discoveryStats,
  commonsStats,
}: {
  allRegions: ExpansionRegion[];
  discoveryStats: ReturnType<typeof useDiscoveryAgent>["stats"];
  commonsStats: ReturnType<typeof useDataCommons>["stats"];
}) {
  const integrated = allRegions.filter(r => r.status === "integrated").length;
  const seeded = allRegions.filter(r => r.status === "seeded").length;
  const approved = allRegions.filter(r => r.status === "approved_candidate").length;
  const discovered = allRegions.filter(r => r.status === "discovered").length;

  const metrics = [
    { label: "Countries Represented", value: allRegions.length, icon: Globe },
    { label: "Integrated Datasets", value: integrated, icon: Layers },
    { label: "Seeded Regions", value: seeded, icon: TreeDeciduous },
    { label: "Approved Candidates", value: approved, icon: Star },
    { label: "Discovered Regions", value: discovered, icon: Telescope },
    { label: "Research Trees", value: commonsStats.totalRecords, icon: Leaf },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {metrics.map(m => (
        <Card key={m.label} className="border-primary/10 bg-card/40">
          <CardContent className="p-3 text-center">
            <m.icon className="w-4 h-4 mx-auto text-primary/60 mb-1" />
            <p className="text-lg font-serif text-primary">{m.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ────────────── World Map (simplified SVG dots) ────────────── */
function WorldMapView({
  regions,
  onSelect,
  selected,
}: {
  regions: ExpansionRegion[];
  onSelect: (r: ExpansionRegion) => void;
  selected: string | null;
}) {
  // Simple Mercator projection to fit 800x400 SVG
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * 800;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 200 - (mercN / Math.PI) * 200;
    return [x, Math.max(10, Math.min(390, y))];
  };

  return (
    <div className="relative w-full aspect-[2/1] bg-card/30 rounded-xl border border-primary/10 overflow-hidden">
      {/* Background world outline — simplified continents */}
      <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const [, y] = project(lat, 0);
          return <line key={`lat-${lat}`} x1="0" y1={y} x2="800" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />;
        })}
        {[-120, -60, 0, 60, 120].map(lng => {
          const [x] = project(0, lng);
          return <line key={`lng-${lng}`} x1={x} y1="0" x2={x} y2="400" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />;
        })}
        {/* Equator */}
        {(() => { const [, y] = project(0, 0); return <line x1="0" y1={y} x2="800" y2={y} stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.15" />; })()}

        {/* Region dots */}
        {regions.map(r => {
          const [cx, cy] = project(r.lat, r.lng);
          const isSelected = selected === r.country_code;
          const isIntegrated = r.status === "integrated" || r.status === "seeded";
          const baseRadius = isIntegrated ? 8 : 6;
          const radius = isSelected ? baseRadius + 3 : baseRadius;

          return (
            <g key={r.country_code} onClick={() => onSelect(r)} className="cursor-pointer">
              {/* Glow for integrated */}
              {isIntegrated && (
                <circle cx={cx} cy={cy} r={radius + 6} fill="hsl(var(--primary))" opacity="0.08">
                  <animate attributeName="r" values={`${radius + 4};${radius + 8};${radius + 4}`} dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.08;0.15;0.08" dur="4s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Selection ring */}
              {isSelected && (
                <circle cx={cx} cy={cy} r={radius + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
              )}
              {/* Dot */}
              <circle
                cx={cx} cy={cy} r={radius}
                fill={isIntegrated ? "hsl(var(--primary))" : r.status === "approved_candidate" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
                opacity={isIntegrated ? 0.9 : r.status === "approved_candidate" ? 0.7 : 0.45}
                stroke={isSelected ? "hsl(var(--primary-foreground))" : "none"}
                strokeWidth="1"
              />
              {/* Label */}
              <text x={cx} y={cy - radius - 4} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" opacity="0.7" className="pointer-events-none select-none">
                {r.flag_emoji} {r.country_name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[10px]">
        {[
          { label: "Integrated", color: "bg-primary" },
          { label: "Approved", color: "bg-accent" },
          { label: "Discovered", color: "bg-muted-foreground/50" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1 text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ────────────── Region Detail Card ────────────── */
function RegionDetailCard({ region }: { region: ExpansionRegion }) {
  return (
    <Card className="border-primary/15 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <span className="text-xl">{region.flag_emoji}</span>
              {region.country_name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 italic">{region.atlas_framing[0]}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[region.status]}`}>
              {region.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${PHASE_COLORS[region.readiness_phase]}`}>
              {PHASE_LABELS[region.readiness_phase]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Scores */}
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Readiness</p>
            <p className="text-lg font-serif text-primary">{region.readiness_score}<span className="text-xs text-muted-foreground">/100</span></p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Story Value</p>
            <p className="text-lg font-serif text-accent-foreground">{region.story_value}<span className="text-xs text-muted-foreground">/100</span></p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Priority Tier</p>
            <p className="text-lg font-serif text-foreground">{region.tier}</p>
          </div>
        </div>

        {/* Dataset types */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Dataset Types</p>
          <div className="flex flex-wrap gap-1">
            {region.dataset_types.map(t => (
              <Badge key={t} variant="outline" className="text-[10px] bg-muted/30 border-border/40 capitalize">
                {t.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Circles */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Suggested Circles</p>
          <div className="flex flex-wrap gap-1">
            {region.circles.map(c => (
              <Badge key={c} variant="outline" className="text-[10px] bg-primary/5 border-primary/15 text-primary/80">
                🌿 {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* Atlas framing */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Atlas Framing</p>
          {region.atlas_framing.map(f => (
            <p key={f} className="text-xs text-foreground/80 italic">"{f}"</p>
          ))}
        </div>

        {/* Notes */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
          <p className="text-xs text-muted-foreground">{region.notes}</p>
        </div>

        {/* Recommended action */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/15">
          <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary">{region.recommended_action}</p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <Link to="/discovery-agent">
              <Telescope className="w-3 h-3 mr-1" /> Discovery Agent
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <Link to="/dataset-watcher">
              <Eye className="w-3 h-3 mr-1" /> Watcher
            </Link>
          </Button>
          {region.status === "integrated" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <Link to={`/atlas/${region.country_code.toLowerCase()}`}>
                <MapPin className="w-3 h-3 mr-1" /> Atlas Page
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────── Region List Row ────────────── */
function RegionRow({ region, onSelect }: { region: ExpansionRegion; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/10 hover:border-primary/30 transition-all text-left group"
    >
      <span className="text-xl">{region.flag_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif text-foreground group-hover:text-primary transition-colors truncate">
          {region.country_name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate italic">{region.atlas_framing[0]}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{region.readiness_score}</span>
        <Badge variant="outline" className={`text-[9px] capitalize ${STATUS_COLORS[region.status]}`}>
          {region.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
    </button>
  );
}

/* ────────────── Priority Queue ────────────── */
function PriorityQueue({ regions, onSelect }: { regions: ExpansionRegion[]; onSelect: (r: ExpansionRegion) => void }) {
  const tiers = [1, 2, 3] as const;
  const tierLabels = { 1: "Tier 1 — Ready Now", 2: "Tier 2 — Near Ready", 3: "Tier 3 — Research Phase" };
  const tierDescs = {
    1: "Official registers exist. Config-driven integration path clear.",
    2: "Source landscape mapped but may need aggregation or regional synthesis.",
    3: "Rich cultural value. Multi-source discovery and manual curation needed.",
  };

  // Only show expansion candidates (not already integrated)
  const candidates = regions.filter(r => r.status !== "integrated" && r.status !== "seeded");

  return (
    <div className="space-y-6">
      {tiers.map(tier => {
        const tierRegions = candidates.filter(r => r.tier === tier);
        if (tierRegions.length === 0) return null;
        return (
          <div key={tier}>
            <h3 className="text-sm font-serif text-primary mb-1">{tierLabels[tier]}</h3>
            <p className="text-[10px] text-muted-foreground mb-3">{tierDescs[tier]}</p>
            <div className="space-y-2">
              {tierRegions
                .sort((a, b) => b.readiness_score - a.readiness_score)
                .map(r => (
                  <RegionRow key={r.country_code} region={r} onSelect={() => onSelect(r)} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────── Main Page ────────────── */
export default function TreeAtlasExpansionMapPage() {
  useDocumentTitle("Tree Atlas Expansion Map");
  const { stats: commonsStats } = useDataCommons();
  const discovery = useDiscoveryAgent();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const allRegions = useMemo(() => [...INTEGRATED_REGIONS, ...EXPANSION_REGIONS], []);
  const selectedRegion = allRegions.find(r => r.country_code === selectedCode) ?? null;

  const handleSelectRegion = (r: ExpansionRegion) => setSelectedCode(r.country_code);

  const integrated = allRegions.filter(r => r.status === "integrated" || r.status === "seeded");
  const candidates = allRegions.filter(r => r.status !== "integrated" && r.status !== "seeded");

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
                <Globe className="w-6 h-6" /> Tree Atlas Expansion Map
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                A planetary canopy view — see where the Ancient Friends research layer is rooted,
                where it is spreading next, and where the Discovery Agent should guide future growth.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link to="/discovery-agent">
                  <Telescope className="w-3.5 h-3.5 mr-1" /> Discovery
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/tree-data-commons">
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> Commons
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Coverage Summary */}
        <CoverageSummary allRegions={allRegions} discoveryStats={discovery.stats} commonsStats={commonsStats} />

        {/* Tabs */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 overflow-x-auto">
            <TabsTrigger value="map" className="text-xs">Map</TabsTrigger>
            <TabsTrigger value="priority" className="text-xs">Priority Queue</TabsTrigger>
            <TabsTrigger value="integrated" className="text-xs">Integrated Canopy ({integrated.length})</TabsTrigger>
            <TabsTrigger value="regions" className="text-xs">All Regions ({allRegions.length})</TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-4 mt-4">
            <WorldMapView
              regions={allRegions}
              onSelect={handleSelectRegion}
              selected={selectedCode}
            />
            {selectedRegion && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={selectedRegion.country_code}>
                <RegionDetailCard region={selectedRegion} />
              </motion.div>
            )}
            {!selectedRegion && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click a region on the map to see its detail card.</p>
              </div>
            )}
          </TabsContent>

          {/* Priority Queue Tab */}
          <TabsContent value="priority" className="mt-4">
            <PriorityQueue regions={allRegions} onSelect={handleSelectRegion} />
            {selectedRegion && selectedRegion.status !== "integrated" && selectedRegion.status !== "seeded" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={selectedRegion.country_code} className="mt-4">
                <RegionDetailCard region={selectedRegion} />
              </motion.div>
            )}
          </TabsContent>

          {/* Integrated Canopy Tab */}
          <TabsContent value="integrated" className="space-y-2 mt-4">
            {integrated.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No integrated regions yet.</p>
            ) : (
              <>
                {integrated.map(r => (
                  <RegionRow key={r.country_code} region={r} onSelect={() => handleSelectRegion(r)} />
                ))}
                {selectedRegion && (selectedRegion.status === "integrated" || selectedRegion.status === "seeded") && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={selectedRegion.country_code} className="mt-3">
                    <RegionDetailCard region={selectedRegion} />
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* All Regions Tab */}
          <TabsContent value="regions" className="space-y-2 mt-4">
            {allRegions
              .sort((a, b) => b.readiness_score - a.readiness_score)
              .map(r => (
                <RegionRow key={r.country_code} region={r} onSelect={() => handleSelectRegion(r)} />
              ))}
            {selectedRegion && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={selectedRegion.country_code} className="mt-3">
                <RegionDetailCard region={selectedRegion} />
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Connected Systems */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-sm font-serif text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Connected Systems
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Discovery Agent", to: "/discovery-agent", icon: "🔭" },
              { label: "Dataset Watcher", to: "/dataset-watcher", icon: "👁️" },
              { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
              { label: "Ancient Friends", to: "/map", icon: "🌳" },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/40 transition-all group text-sm">
                <span>{link.icon}</span>
                <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
}

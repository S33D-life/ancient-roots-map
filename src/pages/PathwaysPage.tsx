/**
 * PathwaysPage — Mycelial Pathway Explorer.
 * Discover ecological corridors connecting groves across the landscape.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePathwayDetection, useSavedPathways } from "@/hooks/use-pathway-detection";
import {
  PATHWAY_STRENGTH_LABELS,
  PATHWAY_STRENGTH_COLORS,
  type PathwayCandidate,
  type PathwayStrength,
} from "@/utils/pathwayDetection";
import { Network, MapPin, TreeDeciduous, Sparkles, ChevronRight } from "lucide-react";

function PathwayCard({ pathway, index }: { pathway: PathwayCandidate; index: number }) {
  const typeLabel = {
    local: "Local Pathway",
    species: "Species Corridor",
    migration: "Migration Route",
    story: "Story Path",
    restoration: "Restoration Corridor",
  }[pathway.pathway_type] || "Pathway";

  const typeEmoji = {
    local: "🕸️",
    species: "🌿",
    migration: "🦅",
    story: "📖",
    restoration: "🌱",
  }[pathway.pathway_type] || "🕸️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-all">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{typeEmoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-serif text-foreground truncate">{pathway.suggested_name}</p>
                <p className="text-[10px] text-muted-foreground">{typeLabel} · {pathway.distance_km} km</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[9px] shrink-0 ${PATHWAY_STRENGTH_COLORS[pathway.strength]}`}>
              {PATHWAY_STRENGTH_LABELS[pathway.strength]}
            </Badge>
          </div>

          {/* Connected groves */}
          <div className="flex items-center gap-1 flex-wrap">
            {pathway.groves.map((g, i) => (
              <span key={g.grove_id} className="text-[10px] text-muted-foreground/80">
                {i > 0 && <span className="mx-0.5 text-primary/40">→</span>}
                <span className="bg-muted/30 px-1.5 py-0.5 rounded">{g.name}</span>
              </span>
            ))}
          </div>

          {pathway.species_common && (
            <p className="text-[10px] text-muted-foreground">
              🌿 {pathway.species_common} corridor
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/map?lat=${pathway.center.lat}&lng=${pathway.center.lng}&zoom=12`}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" /> View on map <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SavedPathwayCard({ pathway, index }: { pathway: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className="border-primary/15 bg-card/70 backdrop-blur-sm">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-serif text-foreground truncate">{pathway.pathway_name || "Unnamed Corridor"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{pathway.pathway_type} Pathway · {pathway.distance_km || "?"} km</p>
            </div>
            <Badge variant="outline" className={`text-[9px] shrink-0 ${PATHWAY_STRENGTH_COLORS[pathway.pathway_strength as PathwayStrength] || ""}`}>
              {PATHWAY_STRENGTH_LABELS[pathway.pathway_strength as PathwayStrength] || pathway.pathway_strength}
            </Badge>
          </div>
          {pathway.species_common && (
            <p className="text-[10px] text-muted-foreground">🌿 {pathway.species_common}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PathwaysPage() {
  useDocumentTitle("Mycelial Pathways — Living Forest Corridors");
  const { data: detected, isLoading: detecting } = usePathwayDetection();
  const { data: savedPathways, isLoading: loadingSaved } = useSavedPathways();

  const localCandidates = detected?.local || [];
  const speciesCandidates = detected?.species || [];

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <Network className="w-6 h-6" /> Mycelial Pathways
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Underground corridors of connection between groves. Where the forest shares
            nutrients and stories, pathways emerge — linking communities of trees into a
            living network across the landscape.
          </p>
        </motion.div>

        {/* Summary */}
        {detected && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: "🕸️", label: "Local Pathways", count: localCandidates.length },
              { icon: "🌿", label: "Species Corridors", count: speciesCandidates.length },
              { icon: "✨", label: "Blessed", count: savedPathways?.length || 0 },
              { icon: "📏", label: "Total Connections", count: detected.all.length },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl border border-border/20 bg-card/30 text-center"
              >
                <span className="text-lg">{stat.icon}</span>
                <p className="text-lg font-bold font-serif text-foreground">{stat.count}</p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {detecting && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-serif italic">
              Tracing underground connections…
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="local" className="text-xs">Local</TabsTrigger>
            <TabsTrigger value="species" className="text-xs">Species</TabsTrigger>
            <TabsTrigger value="blessed" className="text-xs">Blessed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {detected?.all.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
                The mycelium rests beneath the surface, waiting for groves to form.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {detected?.all.slice(0, 20).map((p, i) => (
                  <PathwayCard key={`${p.start.lat}-${p.end.lat}-${i}`} pathway={p} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="local">
            {localCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
                No local pathways detected yet. More nearby groves are needed.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {localCandidates.slice(0, 20).map((p, i) => (
                  <PathwayCard key={`local-${i}`} pathway={p} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="species">
            {speciesCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
                Species corridors emerge when same-species groves grow within range.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {speciesCandidates.slice(0, 20).map((p, i) => (
                  <PathwayCard key={`species-${i}`} pathway={p} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blessed">
            {!savedPathways?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
                No pathways have been blessed yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {savedPathways.map((p: any, i: number) => (
                  <SavedPathwayCard key={p.id} pathway={p} index={i} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Ecosystem connections */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Ancient Friends Map", to: "/map", icon: "🗺" },
            { label: "Atlas", to: "/atlas", icon: "🌍" },
            { label: "Groves", to: "/groves", icon: "🌳" },
            { label: "Forest Pulse", to: "/pulse", icon: "💚" },
            { label: "Greenhouse", to: "/library/greenhouse", icon: "🌱" },
            { label: "Species Hives", to: "/hives", icon: "🐝" },
          ].map(link => (
            <Link key={link.to} to={link.to}
              className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/20 hover:border-primary/30 transition-all group text-sm">
              <span>{link.icon}</span>
              <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">{link.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

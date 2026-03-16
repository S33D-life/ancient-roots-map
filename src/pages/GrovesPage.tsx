/**
 * GrovesPage — discover and explore grove candidates and blessed groves.
 * Natural layer of place-making inside S33D.
 */
import { lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useGroveDetection, useGroves } from "@/hooks/use-grove-detection";
import {
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  type GroveCandidate,
  type GroveStrength,
} from "@/utils/groveDetection";
import {
  TreeDeciduous, MapPin, Compass, Layers, Leaf,
  ChevronRight, Sparkles, CircleDot,
} from "lucide-react";

// Lucide doesn't export Trees — use TreeDeciduous pair
const TreesIcon = TreeDeciduous;

/* ─── Grove Candidate Card ─── */
function GroveCandidateCard({ grove, index }: { grove: GroveCandidate; index: number }) {
  const navigate = useNavigate();
  const isSpecies = grove.grove_type === "species_grove";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-primary/10 bg-card/60 hover:border-primary/25 transition-all group cursor-pointer"
        onClick={() => navigate(`/map?lat=${grove.center.lat}&lng=${grove.center.lng}&zoom=15`)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                {isSpecies ? <Leaf className="w-4 h-4 text-primary" /> : <TreesIcon className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-serif text-foreground group-hover:text-primary transition-colors">
                  {grove.suggested_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {grove.trees.length} trees · {Math.round(grove.radius_m)}m radius
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[9px] ${STRENGTH_COLORS[grove.grove_strength]}`}>
              {STRENGTH_LABELS[grove.grove_strength]}
            </Badge>
          </div>

          {/* Scores */}
          <div className="flex gap-3 text-[10px]">
            <div>
              <span className="text-muted-foreground">Strength</span>
              <p className="text-sm font-serif text-primary">{grove.grove_strength_score}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Compactness</span>
              <p className="text-sm font-serif text-foreground">{Math.round(grove.compactness_score * 100)}%</p>
            </div>
            {isSpecies && grove.species_common && (
              <div>
                <span className="text-muted-foreground">Species</span>
                <p className="text-sm font-serif text-foreground">{grove.species_common}</p>
              </div>
            )}
          </div>

          {/* Tree preview chips */}
          <div className="flex flex-wrap gap-1">
            {grove.trees.slice(0, 5).map(t => (
              <span key={t.id} className="text-[9px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/30">
                {t.name.substring(0, 20)}{t.name.length > 20 ? "…" : ""}
              </span>
            ))}
            {grove.trees.length > 5 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                +{grove.trees.length - 5} more
              </span>
            )}
          </div>

          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <Link to={`/map?lat=${grove.center.lat}&lng=${grove.center.lng}&zoom=15`}>
              <MapPin className="w-3 h-3 mr-1" /> View on Map
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Saved Grove Card ─── */
function SavedGroveCard({ grove }: { grove: any }) {
  return (
    <Card className="border-primary/15 bg-card/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            {grove.grove_type === "species_grove"
              ? <Leaf className="w-4 h-4 text-primary" />
              : <TreesIcon className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground truncate">
              {grove.grove_name || "Unnamed Grove"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {grove.tree_count} trees · {grove.grove_type === "species_grove" ? grove.species_common || grove.species_scientific : "Mixed species"}
            </p>
          </div>
          <Badge variant="outline" className={`text-[9px] ${STRENGTH_COLORS[grove.grove_strength as GroveStrength] || ""}`}>
            {STRENGTH_LABELS[grove.grove_strength as GroveStrength] || grove.grove_strength}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function GrovesPage() {
  useDocumentTitle("Groves — Living Tree Communities");
  const { data: detection, isLoading: detecting } = useGroveDetection();
  const { data: savedGroves, isLoading: loadingSaved } = useGroves();

  const localCandidates = detection?.local || [];
  const speciesCandidates = detection?.species || [];

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <TreesIcon className="w-6 h-6" /> Groves
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Living communities of trees, emerging from proximity and kinship.
            Where trees gather closely or where the same species roots nearby,
            a grove begins to form.
          </p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Trees Scanned", value: detection?.totalTrees || 0, icon: TreeDeciduous },
            { label: "Local Groves", value: localCandidates.length, icon: TreesIcon },
            { label: "Species Groves", value: speciesCandidates.length, icon: Leaf },
            { label: "Blessed Groves", value: savedGroves?.length || 0, icon: Sparkles },
          ].map(m => (
            <Card key={m.label} className="border-primary/10 bg-card/40">
              <CardContent className="p-3 text-center">
                <m.icon className="w-4 h-4 mx-auto text-primary/60 mb-1" />
                <p className="text-lg font-serif text-primary">{m.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="local" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 overflow-x-auto">
            <TabsTrigger value="local" className="text-xs">Local Groves ({localCandidates.length})</TabsTrigger>
            <TabsTrigger value="species" className="text-xs">Species Groves ({speciesCandidates.length})</TabsTrigger>
            <TabsTrigger value="blessed" className="text-xs">Blessed ({savedGroves?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-3 mt-4">
            {detecting ? (
              <div className="text-center py-12 text-muted-foreground">
                <CircleDot className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Scanning the canopy for local groves…</p>
              </div>
            ) : localCandidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TreesIcon className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No local groves detected yet.</p>
                <p className="text-xs mt-1">Add more trees to the map to see groves emerge.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {localCandidates.map((g, i) => (
                  <GroveCandidateCard key={`local-${i}`} grove={g} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="species" className="space-y-3 mt-4">
            {detecting ? (
              <div className="text-center py-12 text-muted-foreground">
                <Leaf className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Detecting species patterns…</p>
              </div>
            ) : speciesCandidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Leaf className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No species groves detected yet.</p>
                <p className="text-xs mt-1">Species groves form when 6+ trees of the same species are nearby.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {speciesCandidates.map((g, i) => (
                  <GroveCandidateCard key={`species-${i}`} grove={g} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blessed" className="space-y-3 mt-4">
            {loadingSaved ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Loading blessed groves…</p>
              </div>
            ) : !savedGroves?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No groves have been blessed yet.</p>
                <p className="text-xs mt-1">Explore grove candidates and bless one to give it a name and story.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedGroves.map((g: any) => <SavedGroveCard key={g.id} grove={g} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Explanation */}
        <Card className="border-primary/10 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" /> How Groves Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                  <TreesIcon className="w-3.5 h-3.5 text-primary" /> Local Groves
                </p>
                <p>Formed when 3 or more trees gather in one place within ~2km. The closer they are, the stronger the grove. Mixed species welcome — this is about shared place.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-primary" /> Species Groves
                </p>
                <p>Formed when 6+ trees of the same species are found nearby. The tighter the local concentration, the more powerful the grove.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/20">
              <p className="font-medium text-foreground mb-1">Grove Strength</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(STRENGTH_LABELS) as [GroveStrength, string][]).map(([key, label]) => (
                  <Badge key={key} variant="outline" className={`text-[9px] ${STRENGTH_COLORS[key]}`}>
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Systems */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Ancient Friends Map", to: "/map", icon: "🗺" },
            { label: "Tree Data Commons", to: "/tree-data-commons", icon: "📊" },
            { label: "Species Hives", to: "/hive-wall", icon: "🐝" },
          ].map(link => (
            <Link key={link.to} to={link.to}
              className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/40 transition-all group text-sm">
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
